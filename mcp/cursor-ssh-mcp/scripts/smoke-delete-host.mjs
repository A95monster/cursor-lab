#!/usr/bin/env node
/**
 * 删除主机 UI 冒烟（hosts 面板）：
 * 1) 确认框不在被隐藏的 #work-row 内（防卡死）
 * 2) 未连接 → 直接删除
 * 3) 已连接 → 弹出「断开并删除」；取消保留；确认后删除
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = process.env.CURSOR_SSH_MCP_UI_PORT || "3857";
const BASE = `http://127.0.0.1:${PORT}`;
const HOME = fs.mkdtempSync("/tmp/ssh-mcp-del-");

let uiChild = null;
let failed = 0;

function ok(name, pass, reason = "") {
  if (!pass) failed += 1;
  console.log(`[${pass ? "PASS" : "FAIL"}] ${name}${reason ? ` — ${reason}` : ""}`);
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function probe() {
  try {
    const res = await fetch(`${BASE}/hosts`, { signal: AbortSignal.timeout(1200) });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureUi() {
  uiChild = spawn(process.execPath, [path.join(ROOT, "src/ui-cli.js")], {
    cwd: ROOT,
    env: {
      ...process.env,
      CURSOR_SSH_MCP_UI_PORT: String(PORT),
      CURSOR_SSH_MCP_HOME: HOME,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (let i = 0; i < 60; i++) {
    if (await probe()) return;
    await sleep(100);
  }
  throw new Error(`UI failed on :${PORT}`);
}

async function api(pathname, opts = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function upsertHost(id) {
  return api("/api/hosts", {
    method: "POST",
    body: JSON.stringify({
      id,
      name: id,
      host: "127.0.0.1",
      port: 22,
      username: "smoke",
      privateKeyPath: "",
      password: "x",
    }),
  });
}

async function hostExists(id) {
  const data = await api("/api/hosts");
  return (data.hosts || []).some((h) => h.id === id);
}

async function main() {
  await ensureUi();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(8000);

  await page.goto(`${BASE}/hosts`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.__sshMcpTest?.deleteHost));

  // 1) 对话框挂载位置（卡死根因回归）
  const meta = await page.evaluate(() => {
    const ids = ["app-confirm", "app-alert", "app-prompt", "app-conflict"];
    return ids.map((id) => {
      const el = document.getElementById(id);
      if (!el) return { id, exists: false };
      let hiddenAncestor = false;
      for (let n = el.parentElement; n; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.display === "none" || cs.visibility === "hidden") {
          hiddenAncestor = true;
          break;
        }
      }
      return {
        id,
        exists: true,
        parentIsBody: el.parentElement === document.body,
        inWorkRow: Boolean(el.closest("#work-row")),
        hiddenAncestor,
      };
    });
  });
  for (const m of meta) {
    ok(`${m.id} on body`, m.exists && m.parentIsBody && !m.inWorkRow && !m.hiddenAncestor, JSON.stringify(m));
  }

  // 2) 未连接：直接删，不弹窗
  const idleId = `idle-${Date.now()}`;
  await upsertHost(idleId);
  await page.click("#btn-refresh");
  await page.waitForSelector(`li[data-id="${idleId}"]`);
  await page.evaluate((id) => window.__sshMcpTest.forceIdle(id), idleId);

  const idlePromise = page.evaluate((id) => window.__sshMcpTest.deleteHost(id, id), idleId);
  await sleep(200);
  const idleConfirmOpen = await page.evaluate(() => document.getElementById("app-confirm")?.open === true);
  ok("idle: no confirm", !idleConfirmOpen);
  const idleRemoved = await Promise.race([
    idlePromise,
    sleep(3000).then(() => "__timeout__"),
  ]);
  ok("idle: delete returns true", idleRemoved === true, String(idleRemoved));
  ok("idle: API gone", !(await hostExists(idleId)));
  ok("idle: DOM gone", (await page.locator(`li[data-id="${idleId}"]`).count()) === 0);

  // 3) 已连接：确认 → 取消
  const liveId = `live-${Date.now()}`;
  await upsertHost(liveId);
  await page.click("#btn-refresh");
  await page.waitForSelector(`li[data-id="${liveId}"]`);
  await page.evaluate((id) => window.__sshMcpTest.forceOnline(id), liveId);
  ok("live: sessionLooksActive", await page.evaluate((id) => window.__sshMcpTest.sessionLooksActive(id), liveId));

  const cancelPromise = page.evaluate((id) => window.__sshMcpTest.deleteHost(id, id), liveId);
  await page.waitForFunction(() => document.getElementById("app-confirm")?.open === true);
  const cancelTitle = await page.locator("#app-confirm-title").innerText();
  ok("live: confirm title 断开并删除", cancelTitle.includes("断开"));
  await page.locator('#app-confirm-form button[value="cancel"]').click();
  const canceled = await Promise.race([
    cancelPromise,
    sleep(3000).then(() => "__timeout__"),
  ]);
  ok("live: cancel returns false", canceled === false, String(canceled));
  ok("live: still exists after cancel", await hostExists(liveId));

  // 4) 已连接：确认 → 断开并删除
  await page.evaluate((id) => window.__sshMcpTest.forceOnline(id), liveId);
  const okPromise = page.evaluate((id) => window.__sshMcpTest.deleteHost(id, id), liveId);
  await page.waitForFunction(() => document.getElementById("app-confirm")?.open === true);
  await page.locator("#app-confirm-ok").click();
  const deleted = await Promise.race([
    okPromise,
    sleep(5000).then(() => "__timeout__"),
  ]);
  ok("live: confirm delete returns true", deleted === true, String(deleted));
  ok("live: API gone", !(await hostExists(liveId)));
  ok("live: DOM gone", (await page.locator(`li[data-id="${liveId}"]`).count()) === 0);

  // 5) 卡片按钮路径（未连接）
  const btnId = `btn-${Date.now()}`;
  await upsertHost(btnId);
  await page.click("#btn-refresh");
  await page.waitForSelector(`li[data-id="${btnId}"]`);
  await page.evaluate((id) => window.__sshMcpTest.forceIdle(id), btnId);
  await page.locator(`li[data-id="${btnId}"] button[data-act="delete"]`).click();
  await page.waitForFunction((id) => !document.querySelector(`li[data-id="${id}"]`), btnId);
  ok("card delete button removes idle host", !(await hostExists(btnId)));

  // 6) 编辑对话框内删除（已连接）
  const dlgId = `dlg-${Date.now()}`;
  await upsertHost(dlgId);
  await page.click("#btn-refresh");
  await page.waitForSelector(`li[data-id="${dlgId}"]`);
  await page.evaluate((id) => window.__sshMcpTest.forceOnline(id), dlgId);
  await page.locator(`li[data-id="${dlgId}"] button[data-act="edit"]`).click();
  await page.waitForSelector("#host-dialog[open]");
  await page.locator("#btn-delete-host").click();
  await page.waitForFunction(() => document.getElementById("app-confirm")?.open === true);
  await page.locator("#app-confirm-ok").click();
  await page.waitForFunction((id) => !document.querySelector(`li[data-id="${id}"]`), dlgId, {
    timeout: 5000,
  });
  ok("edit-dialog delete connected host", !(await hostExists(dlgId)));

  await browser.close();
  try {
    uiChild?.kill();
  } catch {
    /* ignore */
  }
  fs.rmSync(HOME, { recursive: true, force: true });

  if (failed) {
    console.error(`\n${failed} failed`);
    process.exit(1);
  }
  console.log("\nAll delete-host checks passed");
}

main().catch((err) => {
  console.error(err);
  try {
    uiChild?.kill();
  } catch {
    /* ignore */
  }
  process.exit(1);
});

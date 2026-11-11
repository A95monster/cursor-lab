# Cursor Lab

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Projects](https://img.shields.io/badge/projects-MCP-blue.svg)](./mcp)

> **English:** [README.md](./README.md)

[@A95monster](https://github.com/A95monster) 的 **Cursor** 开源工具合集，按分类存放，方便安装与协作。

---

## 项目列表

### MCP（Model Context Protocol）

| 项目 | 说明 | 路径 |
|------|------|------|
| **[cursor-ssh-mcp](./mcp/cursor-ssh-mcp)** | Cursor 版 Termius 风格 SSH 工作台：主机、双栏 SFTP、xterm 终端、Agent MCP 工具 | [`mcp/cursor-ssh-mcp`](./mcp/cursor-ssh-mcp) |

---

## 快捷入口

- SSH MCP 中文说明：[`mcp/cursor-ssh-mcp/README.zh-CN.md`](./mcp/cursor-ssh-mcp/README.zh-CN.md)
- 安全说明：[`mcp/cursor-ssh-mcp/SECURITY.zh-CN.md`](./mcp/cursor-ssh-mcp/SECURITY.zh-CN.md)
- 贡献指南：[`mcp/cursor-ssh-mcp/CONTRIBUTING.zh-CN.md`](./mcp/cursor-ssh-mcp/CONTRIBUTING.zh-CN.md)

---

## 仓库结构

```text
cursor-lab/
├── README.md / README.zh-CN.md
├── LICENSE
├── mcp/                    # Cursor MCP 服务
│   └── cursor-ssh-mcp/
├── extensions/             #（预留）Cursor / VS Code 扩展
├── scripts/                #（预留）公共脚本
└── docs/                   # Lab 级文档
```

新工具请放入对应分类目录，并自带 README、CHANGELOG 与语义化版本号。

---

## 许可证

如无另行说明，本仓库项目采用 [MIT](./LICENSE) © A95monster。

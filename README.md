# Cursor Lab

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Projects](https://img.shields.io/badge/projects-MCP-blue.svg)](./mcp)

> **中文：** [README.zh-CN.md](./README.zh-CN.md)

A curated collection of **Cursor**-related open-source tools by [@A95monster](https://github.com/A95monster).

Organized by category so each project stays focused, versioned, and easy to install.

---

## Projects

### MCP (Model Context Protocol)

| Project | Description | Path |
|---------|-------------|------|
| **[cursor-ssh-mcp](./mcp/cursor-ssh-mcp)** | Termius-style SSH workbench for Cursor: hosts, dual-pane SFTP, xterm terminal, Agent MCP tools | [`mcp/cursor-ssh-mcp`](./mcp/cursor-ssh-mcp) |

---

## Quick links

- SSH MCP (English): [`mcp/cursor-ssh-mcp/README.md`](./mcp/cursor-ssh-mcp/README.md)
- SSH MCP (中文): [`mcp/cursor-ssh-mcp/README.zh-CN.md`](./mcp/cursor-ssh-mcp/README.zh-CN.md)
- Security: [`mcp/cursor-ssh-mcp/SECURITY.md`](./mcp/cursor-ssh-mcp/SECURITY.md)
- Contributing: [`mcp/cursor-ssh-mcp/CONTRIBUTING.md`](./mcp/cursor-ssh-mcp/CONTRIBUTING.md)

---

## Repository layout

```text
cursor-lab/
├── README.md / README.zh-CN.md
├── LICENSE
├── mcp/                    # Cursor MCP servers
│   └── cursor-ssh-mcp/
├── extensions/             # (reserved) Cursor / VS Code extensions
├── scripts/                # (reserved) shared tooling
└── docs/                   # lab-level docs
```

New Cursor tools should land under the matching category (`mcp/`, `extensions/`, …) with their own README, CHANGELOG, and SemVer.

---

## License

Unless noted otherwise, projects in this lab are [MIT](./LICENSE) © A95monster.

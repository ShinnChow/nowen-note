# MCP Server 使用教程

> 通过 MCP 协议让 AI 助手直接操作你的 nowen-note 笔记库。

---

## 什么是 MCP？

MCP（Model Context Protocol）是一种让 AI 助手连接外部工具的协议。通过 MCP Server，AI 助手（如 Claude Desktop、Cursor 等）可以直接读写你的 nowen-note 笔记。

---

## 安装

```bash
cd packages/nowen-mcp
npm install
npm run build
```

---

## 配置

### 环境变量

| 变量 | 说明 | 默认值 |
|---|---|---|
| `NOWEN_URL` | 服务器地址 | `http://localhost:3001` |
| `NOWEN_USERNAME` | 用户名 | `admin` |
| `NOWEN_PASSWORD` | 密码 | — |

### 在 Claude Desktop 中配置

编辑 Claude Desktop 配置文件：

```json
{
  "mcpServers": {
    "nowen-note": {
      "command": "node",
      "args": ["/path/to/nowen-mcp/dist/index.js"],
      "env": {
        "NOWEN_URL": "http://localhost:3001",
        "NOWEN_USERNAME": "admin",
        "NOWEN_PASSWORD": "your-password"
      }
    }
  }
}
```

---

## 可用工具

MCP Server 提供 20 个工具：

### 笔记本

| 工具 | 说明 |
|---|---|
| `nowen_list_notebooks` | 列出所有笔记本 |
| `nowen_create_notebook` | 创建笔记本 |

### 笔记

| 工具 | 说明 |
|---|---|
| `nowen_list_notes` | 列出笔记 |
| `nowen_read_note` | 读取笔记 |
| `nowen_create_note` | 创建笔记 |
| `nowen_update_note` | 更新笔记 |
| `nowen_delete_note` | 删除笔记 |

### 搜索

| 工具 | 说明 |
|---|---|
| `nowen_search` | 全文搜索笔记 |

### 标签

| 工具 | 说明 |
|---|---|
| `nowen_list_tags` | 列出标签 |
| `nowen_manage_tags` | 管理标签 |

### AI

| 工具 | 说明 |
|---|---|
| `nowen_ai_ask` | 知识库问答 |
| `nowen_ai_process` | AI 处理笔记 |
| `nowen_knowledge_stats` | 知识库统计 |

### 任务

| 工具 | 说明 |
|---|---|
| `nowen_list_tasks` | 列出任务 |
| `nowen_create_task` | 创建任务 |

### 系统

| 工具 | 说明 |
|---|---|
| `nowen_list_backups` | 列出备份 |
| `nowen_create_backup` | 创建备份 |
| `nowen_audit_stats` | 审计统计 |

---

## 使用示例

配置好 MCP Server 后，在 AI 助手中可以这样对话：

- "帮我列出所有笔记本"
- "搜索包含 React 的笔记"
- "创建一篇标题为「学习计划」的笔记"
- "根据我的笔记库回答：什么是 useEffect？"

---

## 常见问题

### Q：连接失败？

1. 确认 nowen-note 服务器正在运行
2. 检查 NOWEN_URL 是否正确
3. 检查用户名密码是否正确

### Q：工具没有出现？

确认 MCP Server 已正确配置并重启了 AI 助手。

---

## 下一步

- [OpenAPI 接入指南](./api.md) — REST API
- [SDK 使用教程](./sdk.md) — TypeScript SDK

---

> 本教程基于 nowen-note v1.1.18 编写。

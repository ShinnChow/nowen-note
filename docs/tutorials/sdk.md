# TypeScript SDK 使用教程

> 在 Node.js/TypeScript 项目中通过 SDK 操作 nowen-note。

---

## 安装

```bash
npm install nowen-sdk
# 或
cd packages/nowen-sdk && npm run build
```

---

## 快速开始

```typescript
import { NowenClient } from "nowen-sdk";

const client = new NowenClient({
  baseUrl: "http://localhost:3001",
  username: "admin",
  password: "admin123",
});

// 列出笔记本
const notebooks = await client.listNotebooks();
console.log(notebooks);

// 创建笔记
const note = await client.createNote({
  title: "SDK 创建的笔记",
  contentText: "通过 TypeScript SDK 创建",
  notebookId: notebooks[0].id,
});
```

---

## API 方法

### 笔记本

```typescript
await client.listNotebooks();
await client.createNotebook({ name: "新笔记本" });
await client.updateNotebook(id, { name: "重命名" });
await client.deleteNotebook(id);
```

### 笔记

```typescript
await client.listNotes({ notebookId: "..." });
await client.getNote(id);
await client.createNote({ title, contentText, notebookId });
await client.updateNote(id, { title: "新标题" });
await client.deleteNote(id);
```

### 标签

```typescript
await client.listTags();
await client.createTag({ name: "新标签", color: "#ff0000" });
```

### 搜索

```typescript
const results = await client.search("React");
```

### AI

```typescript
// 知识库问答
const answer = await client.aiAsk({
  question: "什么是 useEffect？",
  notebookIds: ["..."],
});

// AI 设置
const settings = await client.getAISettings();
```

### 任务

```typescript
await client.listTasks();
await client.createTask({ title: "新任务", priority: 2 });
await client.toggleTask(id);
```

### 思维导图

```typescript
await client.listMindMaps();
await client.createMindMap({ title: "新思维导图", content: "{}" });
```

---

## 完整示例：批量导入笔记

```typescript
import { NowenClient } from "nowen-sdk";

async function importNotes() {
  const client = new NowenClient({
    baseUrl: "http://localhost:3001",
    username: "admin",
    password: "admin123",
  });

  // 创建笔记本
  const nb = await client.createNotebook({ name: "导入笔记" });

  // 批量创建笔记
  const notes = [
    { title: "笔记 1", content: "内容 1" },
    { title: "笔记 2", content: "内容 2" },
  ];

  for (const n of notes) {
    await client.createNote({
      title: n.title,
      contentText: n.content,
      notebookId: nb.id,
    });
  }
}
```

---

## 下一步

- [OpenAPI 接入指南](./api.md) — REST API
- [MCP Server 教程](./mcp.md) — AI 集成
- [CLI 工具教程](./cli.md) — 命令行

---

> 本教程基于 nowen-note v1.1.18 编写。

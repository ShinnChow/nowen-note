import { readFileSync, writeFileSync } from "node:fs";

function replaceOnce(source, anchor, replacement, label) {
  if (!source.includes(anchor)) throw new Error(`${label} anchor not found`);
  return source.replace(anchor, replacement);
}

// Canonical SQLite migration registry.
{
  const path = "backend/src/db/migrations.ts";
  let source = readFileSync(path, "utf8");
  if (!source.includes('from "./workspaceJournalsMigration.js"')) {
    const anchor = 'import { taskInboxMigration } from "./taskInboxMigration.js";\n';
    source = replaceOnce(
      source,
      anchor,
      `${anchor}import { workspaceJournalsMigration } from "./workspaceJournalsMigration.js";\n`,
      "workspace journal migration import",
    );
  }
  if (!source.includes("  workspaceJournalsMigration,")) {
    const anchor = "  taskInboxCanonicalMigration,\n";
    source = replaceOnce(
      source,
      anchor,
      `${anchor}  workspaceJournalsMigration,\n`,
      "workspace journal migration registry",
    );
  }
  writeFileSync(path, source);
}

// PostgreSQL base schema parity.
{
  const path = "backend/src/db/postgres/schema.base.sql";
  let source = readFileSync(path, "utf8");
  if (!source.includes("CREATE TABLE IF NOT EXISTS workspace_journals")) {
    source += `\n\n-- Workspace shared journals: one bound note per workspace/calendar date.\nCREATE TABLE IF NOT EXISTS workspace_journals (\n  "workspaceId" TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,\n  "journalDate" TEXT NOT NULL,\n  "noteId" TEXT NOT NULL UNIQUE REFERENCES notes(id) ON DELETE CASCADE,\n  "createdBy" TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,\n  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  PRIMARY KEY ("workspaceId", "journalDate")\n);\nCREATE INDEX IF NOT EXISTS idx_workspace_journals_note\n  ON workspace_journals("noteId");\nCREATE INDEX IF NOT EXISTS idx_workspace_journals_date\n  ON workspace_journals("workspaceId", "journalDate" DESC);\n`;
  }
  writeFileSync(path, source);
}

// Journal HTTP routes.
{
  const path = "backend/src/routes/journals.ts";
  let source = readFileSync(path, "utf8");
  if (!source.includes('from "../services/workspaceJournals.js"')) {
    const anchor = '} from "../services/journalArchiveCleanup.js";\n';
    const addition = `import {\n  checkWorkspaceJournal,\n  getOrCreateWorkspaceJournal,\n  WorkspaceJournalError,\n} from "../services/workspaceJournals.js";\n`;
    source = replaceOnce(source, anchor, `${anchor}${addition}`, "workspace journal route import");
  }

  if (!source.includes('app.get("/workspace/:workspaceId/check"')) {
    const anchor = `/**\n * 将已有日记整理为真实的知识树实体目录。\n`;
    const endpoints = `function workspaceJournalErrorResponse(c: any, error: unknown) {\n  if (error instanceof WorkspaceJournalError) {\n    return c.json({ error: error.message, code: error.code }, error.status);\n  }\n  const message = error instanceof Error ? error.message : String(error);\n  if (message.startsWith("INVALID_JOURNAL_DATE:")) {\n    return c.json({ error: "日期格式无效，请使用 YYYY-MM-DD", code: "INVALID_JOURNAL_DATE" }, 400);\n  }\n  throw error;\n}\n\n/** 检查当前成员能否访问指定工作区的某日日记；只读，不创建。 */\napp.get("/workspace/:workspaceId/check", (c) => {\n  const db = getDb();\n  const userId = c.req.header("X-User-Id") || "";\n  if (!userId) return c.json({ error: "未授权" }, 401);\n  const workspaceId = c.req.param("workspaceId");\n  let dateKey: string;\n  try {\n    dateKey = getLocalDateKey(c.req.query("date"));\n    const result = checkWorkspaceJournal({\n      db, workspaceId, actorUserId: userId, dateKey,\n    });\n    return c.json({\n      ...result,\n      scope: "workspace",\n      workspaceId,\n    });\n  } catch (error) {\n    return workspaceJournalErrorResponse(c, error);\n  }\n});\n\n/** 获取或创建工作区共享日记。只读成员可打开已有日记，但不能创建缺失日期。 */\napp.post("/workspace/:workspaceId/resolve", async (c) => {\n  const db = getDb();\n  const userId = c.req.header("X-User-Id") || "";\n  if (!userId) return c.json({ error: "未授权" }, 401);\n  const workspaceId = c.req.param("workspaceId");\n  const body = await c.req.json().catch(() => ({}));\n  try {\n    const dateKey = getLocalDateKey(body?.localDate);\n    const result = getOrCreateWorkspaceJournal({\n      db, workspaceId, actorUserId: userId, dateKey,\n    });\n    return c.json({\n      ...result.note,\n      existed: result.existed,\n      canWrite: result.canWrite,\n      role: result.role,\n      archive: result.archive,\n      scope: "workspace",\n    }, result.existed ? 200 : 201);\n  } catch (error) {\n    return workspaceJournalErrorResponse(c, error);\n  }\n});\n\n`;
    source = replaceOnce(source, anchor, `${endpoints}${anchor}`, "workspace journal endpoints");
  }
  writeFileSync(path, source);
}

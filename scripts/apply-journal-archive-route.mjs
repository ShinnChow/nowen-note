import { readFileSync, writeFileSync } from "node:fs";

// Deterministic one-shot integration patch. Safe to run repeatedly.
const path = "backend/src/routes/journals.ts";
let source = readFileSync(path, "utf8");

const importNeedle = 'import { v4 as uuid } from "uuid";\n';
const serviceImport = `import {
  ensureJournalArchiveFolders,
  ensureJournalArchivePlacement,
  organizeJournalArchive,
  parseJournalDateKey,
} from "../services/journalArchiveTree.js";
`;
if (!source.includes('from "../services/journalArchiveTree.js"')) {
  if (!source.includes(importNeedle)) throw new Error("journals import anchor not found");
  source = source.replace(importNeedle, `${importNeedle}${serviceImport}`);
}

const dateHelperBefore = `function getLocalDateKey(dateStr?: string): string {
  let date: Date;

  if (dateStr && /^\\d{4}-\\d{2}-\\d{2}$/.test(dateStr)) {
    // 前端传入的 YYYY-MM-DD 格式，直接使用
    return dateStr;
  }

  date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return \`${"${year}-${month}-${day}"}\`;
}`;
const dateHelperAfter = `function getLocalDateKey(dateStr?: string): string {
  if (dateStr !== undefined) return parseJournalDateKey(dateStr).dateKey;

  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return \`${"${year}-${month}-${day}"}\`;
}`;
if (!source.includes("parseJournalDateKey(dateStr).dateKey")) {
  if (!source.includes(dateHelperBefore)) throw new Error("date helper anchor not found");
  source = source.replace(dateHelperBefore, dateHelperAfter);
}

source = source.replace(
  "  const today = getLocalDateKey(localDate);",
  `  let today: string;
  try {
    today = getLocalDateKey(localDate);
  } catch {
    return c.json({ error: "日期格式无效，请使用 YYYY-MM-DD" }, 400);
  }`,
);

const existingBefore = `  if (existing) {
    return c.json({
      ...existing,
      existed: true,
    });
  }
`;
const existingAfter = `  if (existing) {
    const archive = ensureJournalArchivePlacement({
      db,
      userId,
      noteId: existing.id,
      dateKey: today,
    });
    return c.json({
      ...existing,
      existed: true,
      archive,
    });
  }
`;
if (!source.includes("noteId: existing.id")) {
  if (!source.includes(existingBefore)) throw new Error("existing journal anchor not found");
  source = source.replace(existingBefore, existingAfter);
}

const createStart = source.indexOf("  // 不存在，创建新日记");
const createEndMarker = "/**\n * 检查今日日记是否存在";
const createEnd = source.indexOf(createEndMarker);
if (createStart < 0 || createEnd < 0 || createEnd <= createStart) {
  throw new Error("journal create section anchors not found");
}
const createSection = `  // 不存在，创建新日记。目录与日记在同一事务内落地：
  // 个人日记 / YYYY年 / YYYY年MM月 / YYYY-MM-DD。
  const id = uuid();
  const title = today;

  try {
    const result = db.transaction(() => {
      const folders = ensureJournalArchiveFolders({ db, userId, dateKey: today });
      db.prepare(\`
        INSERT INTO notes (
          id, userId, notebookId, title, content, contentText,
          note_type, journal_date, sortOrder
        ) VALUES (?, ?, ?, ?, '{}', '', 'journal', ?, 0)
      \`).run(id, userId, folders.monthNotebookId, title, today);

      const archive = ensureJournalArchivePlacement({
        db,
        userId,
        noteId: id,
        dateKey: today,
      });
      const created = db.prepare(\`
        SELECT id, userId, notebookId, workspaceId, title, content, contentText,
               isPinned, isLocked, isArchived, isTrashed, version, sortOrder,
               createdAt, updatedAt, trashedAt, contentFormat, note_type, journal_date
        FROM notes
        WHERE id = ?
      \`).get(id);
      return { created, archive };
    })();

    return c.json({
      ...result.created as any,
      existed: false,
      archive: result.archive,
    }, 201);
  } catch (err: any) {
    // UNIQUE 约束冲突：并发创建时回退查询已有日记并修复目录归属。
    if (String(err?.code || "").startsWith("SQLITE_CONSTRAINT")) {
      const retry = db.prepare(\`
        SELECT id, userId, notebookId, workspaceId, title, content, contentText,
               isPinned, isLocked, isArchived, isTrashed, version, sortOrder,
               createdAt, updatedAt, trashedAt, contentFormat, note_type, journal_date
        FROM notes
        WHERE userId = ? AND note_type = 'journal' AND journal_date = ?
          AND isTrashed = 0
      \`).get(userId, today) as any;
      if (!retry?.id) throw err;
      const archive = ensureJournalArchivePlacement({
        db,
        userId,
        noteId: retry.id,
        dateKey: today,
      });
      return c.json({
        ...retry,
        existed: true,
        archive,
      });
    }
    throw err;
  }
});

`;
source = `${source.slice(0, createStart)}${createSection}${source.slice(createEnd)}`;

source = source.replace(
  "  const today = getLocalDateKey(dateParam);",
  `  let today: string;
  try {
    today = getLocalDateKey(dateParam);
  } catch {
    return c.json({ error: "日期格式无效，请使用 YYYY-MM-DD" }, 400);
  }`,
);

const organizeAnchor = `/**
 * 获取日记列表（按日期倒序）
 */`;
const organizeRoute = `/**
 * 将已有日记整理为真实的知识树实体目录。
 *
 * 显式 POST，重复执行安全；不会修改日记正文和标题，也不会删除旧空笔记本。
 */
app.post("/organize", (c) => {
  const db = getDb();
  const userId = c.req.header("X-User-Id") || "";
  if (!userId) return c.json({ error: "未授权" }, 401);

  const result = organizeJournalArchive({ db, userId });
  return c.json({ success: true, ...result });
});

${organizeAnchor}`;
if (!source.includes('app.post("/organize"')) {
  if (!source.includes(organizeAnchor)) throw new Error("organize route anchor not found");
  source = source.replace(organizeAnchor, organizeRoute);
}

for (const required of [
  'app.post("/organize"',
  "ensureJournalArchiveFolders({ db, userId, dateKey: today })",
  "ensureJournalArchivePlacement({",
  "parseJournalDateKey(dateStr).dateKey",
]) {
  if (!source.includes(required)) throw new Error(`route patch missing: ${required}`);
}

writeFileSync(path, source);

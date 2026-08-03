import { readFileSync, writeFileSync } from "node:fs";

const routePath = "backend/src/routes/journals.ts";
let route = readFileSync(routePath, "utf8");

const existingBefore = `    const archive = ensureJournalArchivePlacement({
      db,
      userId,
      noteId: existing.id,
      dateKey: today,
    });
    return c.json({
      ...existing,
      existed: true,
      archive,
    });`;
const existingAfter = `    const archive = ensureJournalArchivePlacement({
      db,
      userId,
      noteId: existing.id,
      dateKey: today,
    });
    const refreshed = db.prepare(\`
      SELECT id, userId, notebookId, workspaceId, title, content, contentText,
             isPinned, isLocked, isArchived, isTrashed, version, sortOrder,
             createdAt, updatedAt, trashedAt, contentFormat, note_type, journal_date
      FROM notes
      WHERE id = ?
    \`).get(existing.id);
    return c.json({
      ...refreshed as any,
      existed: true,
      archive,
    });`;
if (!route.includes("const refreshed = db.prepare")) {
  if (!route.includes(existingBefore)) throw new Error("existing response anchor missing");
  route = route.replace(existingBefore, existingAfter);
}

const retryBefore = `      const archive = ensureJournalArchivePlacement({
        db,
        userId,
        noteId: retry.id,
        dateKey: today,
      });
      return c.json({
        ...retry,
        existed: true,
        archive,
      });`;
const retryAfter = `      const archive = ensureJournalArchivePlacement({
        db,
        userId,
        noteId: retry.id,
        dateKey: today,
      });
      const refreshedRetry = db.prepare(\`
        SELECT id, userId, notebookId, workspaceId, title, content, contentText,
               isPinned, isLocked, isArchived, isTrashed, version, sortOrder,
               createdAt, updatedAt, trashedAt, contentFormat, note_type, journal_date
        FROM notes
        WHERE id = ?
      \`).get(retry.id);
      return c.json({
        ...refreshedRetry as any,
        existed: true,
        archive,
      });`;
if (!route.includes("const refreshedRetry = db.prepare")) {
  if (!route.includes(retryBefore)) throw new Error("retry response anchor missing");
  route = route.replace(retryBefore, retryAfter);
}
writeFileSync(routePath, route);

const apiPath = "frontend/src/lib/api.impl.ts";
let api = readFileSync(apiPath, "utf8");
const apiBefore = `    getOrCreateToday: (localDate?: string) =>
      request<{ id: string; title: string; existed: boolean;[key: string]: any }>("/journals/today", {
        method: "POST",
        body: JSON.stringify({ localDate }),
      }),`;
const apiAfter = `    getOrCreateToday: async (localDate?: string) => {
      const result = await request<{ id: string; title: string; existed: boolean;[key: string]: any }>("/journals/today", {
        method: "POST",
        body: JSON.stringify({ localDate }),
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("nowen:knowledge-tree-changed", {
          detail: { reason: result.existed ? "journal-archive-repaired" : "journal-created" },
        }));
      }
      return result;
    },`;
if (!api.includes("journal-archive-repaired")) {
  if (!api.includes(apiBefore)) throw new Error("frontend getOrCreateToday anchor missing");
  api = api.replace(apiBefore, apiAfter);
}
writeFileSync(apiPath, api);

for (const required of ["const refreshed = db.prepare", "const refreshedRetry = db.prepare"]) {
  if (!route.includes(required)) throw new Error(`route contract fix missing: ${required}`);
}
if (!api.includes("journal-archive-repaired")) throw new Error("knowledge tree event fix missing");

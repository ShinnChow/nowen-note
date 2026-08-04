import assert from "node:assert/strict";
import test from "node:test";
import crypto from "node:crypto";

import { getDb } from "../src/db/schema";
import {
  getCurrentReferenceNotes,
  getImmediateOrphanSummary,
} from "../src/runtime/file-orphan-visibility";

test("fresh attachment becomes an orphan immediately after its last note reference is removed", () => {
  const db = getDb();
  const suffix = crypto.randomUUID();
  const userId = `orphan-user-${suffix}`;
  const notebookId = `orphan-nb-${suffix}`;
  const noteId = `orphan-note-${suffix}`;
  const attachmentId = `orphan-att-${suffix}`;
  const scope = { kind: "personal" as const, workspaceId: null };

  db.prepare(
    "INSERT INTO users (id, username, passwordHash) VALUES (?, ?, ?)",
  ).run(userId, userId, "hash");
  db.prepare(
    "INSERT INTO notebooks (id, userId, name) VALUES (?, ?, ?)",
  ).run(notebookId, userId, "孤儿测试");
  db.prepare(
    "INSERT INTO notes (id, userId, notebookId, title, content) VALUES (?, ?, ?, ?, ?)",
  ).run(noteId, userId, notebookId, "图片引用测试", "{}");
  db.prepare(
    `INSERT INTO attachments (id, noteId, userId, filename, mimeType, size, path)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(attachmentId, noteId, userId, "image.png", "image/png", 843 * 1024, `${attachmentId}.png`);

  try {
    // 新上传不足 24 小时也必须立刻出现在只读“孤儿”视图中。
    assert.deepEqual(getImmediateOrphanSummary(db, scope, userId), {
      count: 1,
      bytes: 843 * 1024,
    });
    assert.equal(
      getCurrentReferenceNotes(db, [attachmentId], scope, userId).has(attachmentId),
      false,
    );

    db.prepare(
      "INSERT INTO attachment_references (attachmentId, noteId) VALUES (?, ?)",
    ).run(attachmentId, noteId);

    assert.deepEqual(getImmediateOrphanSummary(db, scope, userId), {
      count: 0,
      bytes: 0,
    });
    const referenced = getCurrentReferenceNotes(db, [attachmentId], scope, userId);
    assert.equal(referenced.get(attachmentId)?.id, noteId);
    assert.equal(referenced.get(attachmentId)?.title, "图片引用测试");

    // 模拟编辑器删除图片并保存：syncReferences 会删除最后一条倒排引用。
    db.prepare(
      "DELETE FROM attachment_references WHERE attachmentId = ? AND noteId = ?",
    ).run(attachmentId, noteId);

    assert.deepEqual(getImmediateOrphanSummary(db, scope, userId), {
      count: 1,
      bytes: 843 * 1024,
    });
    assert.equal(
      getCurrentReferenceNotes(db, [attachmentId], scope, userId).has(attachmentId),
      false,
    );
  } finally {
    db.prepare("DELETE FROM attachment_references WHERE attachmentId = ?").run(attachmentId);
    db.prepare("DELETE FROM attachments WHERE id = ?").run(attachmentId);
    db.prepare("DELETE FROM notes WHERE id = ?").run(noteId);
    db.prepare("DELETE FROM notebooks WHERE id = ?").run(notebookId);
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);
  }
});

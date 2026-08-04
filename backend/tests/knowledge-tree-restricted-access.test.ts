import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "nowen-knowledge-restricted-"));
process.env.DB_PATH = path.join(tempDir, "knowledge-restricted.db");
let closeDatabase: (() => void) | null = null;

test.after(() => {
  closeDatabase?.();
  fs.rmSync(tempDir, { recursive: true, force: true });
  delete process.env.DB_PATH;
});

test("node member permissions become an allowlist and persist in the database", async () => {
  await import("../src/runtime/knowledge-tree-migration-bootstrap.js");
  const { getDb, closeDb } = await import("../src/db/schema.js");
  const { createKnowledgeChild, listKnowledgeTree } = await import("../src/services/knowledgeTree.js");
  const {
    clearKnowledgeNodeRole,
    listKnowledgeNodeRoles,
    resolveKnowledgeNodeAccess,
    setKnowledgeNodeRole,
  } = await import("../src/services/knowledgeCapabilities.js");

  closeDatabase = closeDb;
  const db = getDb();

  for (const userId of ["owner", "allowed", "denied"]) {
    db.prepare("INSERT INTO users (id, username, passwordHash) VALUES (?, ?, ?)")
      .run(userId, userId, "hash");
  }
  db.prepare("INSERT INTO workspaces (id, name, ownerId) VALUES (?, ?, ?)")
    .run("ws", "Team", "owner");
  db.prepare("INSERT INTO workspace_members (workspaceId, userId, role) VALUES (?, ?, ?)")
    .run("ws", "owner", "owner");
  db.prepare("INSERT INTO workspace_members (workspaceId, userId, role) VALUES (?, ?, ?)")
    .run("ws", "allowed", "viewer");
  db.prepare("INSERT INTO workspace_members (workspaceId, userId, role) VALUES (?, ?, ?)")
    .run("ws", "denied", "viewer");

  const root = createKnowledgeChild({
    actorUserId: "owner",
    workspaceId: "ws",
    parentId: null,
    nodeType: "folder",
    title: "私有项目",
    db,
  });
  const child = createKnowledgeChild({
    actorUserId: "owner",
    workspaceId: "ws",
    parentId: root.id,
    nodeType: "note",
    title: "项目密码",
    db,
  });

  assert.equal(resolveKnowledgeNodeAccess(child.id, "denied", db).source, "legacy");
  assert.equal(resolveKnowledgeNodeAccess(child.id, "denied", db).capabilities.canView, true);

  setKnowledgeNodeRole({
    nodeId: root.id,
    targetUserId: "allowed",
    rolePreset: "readonly",
    actorUserId: "owner",
    db,
  });

  const policy = db.prepare(`
    SELECT accessMode
    FROM knowledge_tree_access_policies
    WHERE nodeId = ?
  `).get(root.id) as { accessMode: string } | undefined;
  assert.equal(policy?.accessMode, "restricted");
  assert.equal(listKnowledgeNodeRoles(root.id, db).accessMode, "restricted");

  const allowedAccess = resolveKnowledgeNodeAccess(child.id, "allowed", db);
  assert.equal(allowedAccess.source, "inherited");
  assert.equal(allowedAccess.capabilities.canView, true);

  const deniedAccess = resolveKnowledgeNodeAccess(child.id, "denied", db);
  assert.equal(deniedAccess.source, "none");
  assert.equal(deniedAccess.capabilities.canView, false);

  const deniedTree = listKnowledgeTree({ userId: "denied", workspaceId: "ws", db });
  assert.equal(deniedTree.some((node) => node.id === root.id), false);
  assert.equal(deniedTree.some((node) => node.id === child.id), false);

  const allowedTree = listKnowledgeTree({ userId: "allowed", workspaceId: "ws", db });
  assert.equal(allowedTree.some((node) => node.id === root.id), true);
  assert.equal(allowedTree.some((node) => node.id === child.id), true);

  assert.equal(clearKnowledgeNodeRole({
    nodeId: root.id,
    targetUserId: "allowed",
    actorUserId: "owner",
    db,
  }), true);
  assert.equal(listKnowledgeNodeRoles(root.id, db).accessMode, "inherit");
  assert.equal(resolveKnowledgeNodeAccess(child.id, "denied", db).source, "legacy");
  assert.equal(resolveKnowledgeNodeAccess(child.id, "denied", db).capabilities.canView, true);
});

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
  const { Hono } = await import("hono");
  const { getDb, closeDb } = await import("../src/db/schema.js");
  const { resolveNotePermission, resolveNotebookPermission } = await import("../src/middleware/acl.js");
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
  const publicRoot = createKnowledgeChild({
    actorUserId: "owner",
    workspaceId: "ws",
    parentId: null,
    nodeType: "folder",
    title: "公开项目",
    db,
  });
  const publicChild = createKnowledgeChild({
    actorUserId: "owner",
    workspaceId: "ws",
    parentId: publicRoot.id,
    nodeType: "note",
    title: "公开说明",
    db,
  });

  assert.equal(resolveKnowledgeNodeAccess(child.id, "denied", db).source, "legacy");
  assert.equal(resolveKnowledgeNodeAccess(child.id, "denied", db).capabilities.canView, true);
  assert.equal(resolveNotebookPermission(root.resourceId, "denied").permission, "read");
  assert.equal(resolveNotePermission(child.resourceId, "denied").permission, "read");

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
  assert.equal(resolveNotebookPermission(root.resourceId, "allowed").permission, "read");
  assert.equal(resolveNotePermission(child.resourceId, "allowed").permission, "read");

  const deniedAccess = resolveKnowledgeNodeAccess(child.id, "denied", db);
  assert.equal(deniedAccess.source, "none");
  assert.equal(deniedAccess.capabilities.canView, false);
  assert.equal(resolveNotebookPermission(root.resourceId, "denied").permission, null);
  assert.equal(resolveNotePermission(child.resourceId, "denied").permission, null);

  const deniedTree = listKnowledgeTree({ userId: "denied", workspaceId: "ws", db });
  assert.equal(deniedTree.some((node) => node.id === root.id), false);
  assert.equal(deniedTree.some((node) => node.id === child.id), false);
  assert.equal(deniedTree.some((node) => node.id === publicRoot.id), true);
  assert.equal(deniedTree.some((node) => node.id === publicChild.id), true);

  const allowedTree = listKnowledgeTree({ userId: "allowed", workspaceId: "ws", db });
  assert.equal(allowedTree.some((node) => node.id === root.id), true);
  assert.equal(allowedTree.some((node) => node.id === child.id), true);

  // The runtime wraps legacy routers and standalone search with knowledge capability enforcement.
  await import("../src/runtime/knowledge-tree.js");
  const noteRoutes = new Hono();
  noteRoutes.get("/", (c) => c.json([
    { id: child.resourceId, title: "项目密码" },
    { id: publicChild.resourceId, title: "公开说明" },
  ]));
  noteRoutes.get("/:id", (c) => c.json({ id: c.req.param("id") }));
  const notebookRoutes = new Hono();
  notebookRoutes.get("/", (c) => c.json([
    { id: root.resourceId, name: "私有项目" },
    { id: publicRoot.resourceId, name: "公开项目" },
  ]));
  const searchRoutes = new Hono();
  searchRoutes.get("/", (c) => c.json([
    { id: child.resourceId, title: "项目密码", snippet: "restricted" },
    { id: publicChild.resourceId, title: "公开说明", snippet: "public" },
  ]));

  const api = new Hono();
  api.route("/api/notes", noteRoutes);
  api.route("/api/notebooks", notebookRoutes);
  api.route("/api/search", searchRoutes);

  const deniedNotesResponse = await api.request("http://localhost/api/notes?workspaceId=ws", {
    headers: { "X-User-Id": "denied" },
  });
  assert.equal(deniedNotesResponse.status, 200);
  assert.deepEqual(await deniedNotesResponse.json(), [
    { id: publicChild.resourceId, title: "公开说明" },
  ]);

  const allowedNotesResponse = await api.request("http://localhost/api/notes?workspaceId=ws", {
    headers: { "X-User-Id": "allowed" },
  });
  assert.equal(allowedNotesResponse.status, 200);
  assert.deepEqual(await allowedNotesResponse.json(), [
    { id: child.resourceId, title: "项目密码" },
    { id: publicChild.resourceId, title: "公开说明" },
  ]);

  const deniedNotebooksResponse = await api.request("http://localhost/api/notebooks?workspaceId=ws", {
    headers: { "X-User-Id": "denied" },
  });
  assert.equal(deniedNotebooksResponse.status, 200);
  assert.deepEqual(await deniedNotebooksResponse.json(), [
    { id: publicRoot.resourceId, name: "公开项目" },
  ]);

  const deniedSearchResponse = await api.request("http://localhost/api/search?q=项目&workspaceId=ws", {
    headers: { "X-User-Id": "denied" },
  });
  assert.equal(deniedSearchResponse.status, 200);
  assert.deepEqual(await deniedSearchResponse.json(), [
    { id: publicChild.resourceId, title: "公开说明", snippet: "public" },
  ]);

  const deniedDirectResponse = await api.request(
    `http://localhost/api/notes/${child.resourceId}`,
    { headers: { "X-User-Id": "denied" } },
  );
  assert.equal(deniedDirectResponse.status, 403);

  assert.equal(clearKnowledgeNodeRole({
    nodeId: root.id,
    targetUserId: "allowed",
    actorUserId: "owner",
    db,
  }), true);
  assert.equal(listKnowledgeNodeRoles(root.id, db).accessMode, "inherit");
  assert.equal(resolveKnowledgeNodeAccess(child.id, "denied", db).source, "legacy");
  assert.equal(resolveKnowledgeNodeAccess(child.id, "denied", db).capabilities.canView, true);
  assert.equal(resolveNotebookPermission(root.resourceId, "denied").permission, "read");
  assert.equal(resolveNotePermission(child.resourceId, "denied").permission, "read");
});

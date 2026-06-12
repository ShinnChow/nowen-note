import { Hono } from "hono";
import { getDb } from "../db/schema";
import crypto from "crypto";
import {
  getUserWorkspaceRole,
  canManageResource,
} from "../middleware/acl";

const taskProjects = new Hono();

/** Resolve scope: personal vs workspace */
function resolveScope(c: any, userId: string) {
  const raw = c.req.query("workspaceId");
  if (!raw || raw === "personal") return { workspaceId: null };
  const role = getUserWorkspaceRole(raw, userId);
  if (!role) return { workspaceId: raw, error: "No access to workspace" };
  return { workspaceId: raw };
}

// List projects
taskProjects.get("/", (c) => {
  const db = getDb();
  const userId = c.req.header("X-User-Id")!;
  const scope = resolveScope(c, userId);
  if (scope.error) return c.json({ error: scope.error }, 403);

  const rows = scope.workspaceId
    ? db.prepare(
        "SELECT p.*, (SELECT COUNT(*) FROM tasks t WHERE t.projectId = p.id) AS taskCount, " +
        "(SELECT COUNT(*) FROM tasks t WHERE t.projectId = p.id AND t.isCompleted = 1) AS completedCount, " +
        "CASE WHEN (SELECT COUNT(*) FROM tasks t WHERE t.projectId = p.id) > 0 " +
        "THEN ROUND((SELECT COUNT(*) FROM tasks t WHERE t.projectId = p.id AND t.isCompleted = 1) * 100.0 / " +
        "(SELECT COUNT(*) FROM tasks t WHERE t.projectId = p.id)) ELSE 0 END AS progress " +
        "FROM task_projects p WHERE p.workspaceId = ? ORDER BY p.sortOrder ASC, p.createdAt ASC"
      ).all(scope.workspaceId)
    : db.prepare(
        "SELECT p.*, (SELECT COUNT(*) FROM tasks t WHERE t.projectId = p.id) AS taskCount, " +
        "(SELECT COUNT(*) FROM tasks t WHERE t.projectId = p.id AND t.isCompleted = 1) AS completedCount, " +
        "CASE WHEN (SELECT COUNT(*) FROM tasks t WHERE t.projectId = p.id) > 0 " +
        "THEN ROUND((SELECT COUNT(*) FROM tasks t WHERE t.projectId = p.id AND t.isCompleted = 1) * 100.0 / " +
        "(SELECT COUNT(*) FROM tasks t WHERE t.projectId = p.id)) ELSE 0 END AS progress " +
        "FROM task_projects p WHERE p.userId = ? AND p.workspaceId IS NULL ORDER BY p.sortOrder ASC, p.createdAt ASC"
      ).all(userId);

  return c.json(rows);
});

// Role level helper for workspace permission checks
const ROLE_RANK: Record<string, number> = { viewer: 1, commenter: 2, editor: 3, admin: 4, owner: 5 };

// Create project
taskProjects.post("/", async (c) => {
  const db = getDb();
  const userId = c.req.header("X-User-Id")!;
  const body = await c.req.json();
  const scope = resolveScope(c, userId);
  if (scope.error) return c.json({ error: scope.error }, 403);

  // Fix 4: viewer/commenter cannot create projects in workspace
  if (scope.workspaceId) {
    const role = getUserWorkspaceRole(scope.workspaceId, userId) as string | null;
    if (!role || (ROLE_RANK[role] ?? 0) < ROLE_RANK["editor"]) {
      return c.json({ error: "Insufficient permissions to create project", code: "FORBIDDEN" }, 403);
    }
  }

  const id = crypto.randomUUID();
  const name = body.name || "Untitled";
  const icon = body.icon || "folder";
  const color = body.color || "#6366f1";
  const sortOrder = body.sortOrder ?? 0;

  db.prepare(
    "INSERT INTO task_projects (id, userId, workspaceId, name, icon, color, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, userId, scope.workspaceId, name, icon, color, sortOrder);

  const project = db.prepare(
    "SELECT p.*, 0 AS taskCount, 0 AS completedCount, 0 AS progress FROM task_projects p WHERE p.id = ?"
  ).get(id);
  return c.json(project, 201);
});

// Update project
taskProjects.put("/:id", async (c) => {
  const db = getDb();
  const userId = c.req.header("X-User-Id")!;
  const id = c.req.param("id");

  const existing = db.prepare("SELECT * FROM task_projects WHERE id = ?").get(id) as any;
  if (!existing) return c.json({ error: "Project not found" }, 404);
  if (!canManageResource(existing.userId, existing.workspaceId, userId)) {
    return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
  }

  const body = await c.req.json();
  const name = body.name ?? existing.name;
  const icon = body.icon ?? existing.icon;
  const color = body.color ?? existing.color;
  const sortOrder = body.sortOrder ?? existing.sortOrder;

  db.prepare(
    "UPDATE task_projects SET name = ?, icon = ?, color = ?, sortOrder = ?, updatedAt = datetime('now') WHERE id = ?"
  ).run(name, icon, color, sortOrder, id);

  const updated = db.prepare(
    "SELECT p.*, (SELECT COUNT(*) FROM tasks t WHERE t.projectId = p.id) AS taskCount, " +
    "(SELECT COUNT(*) FROM tasks t WHERE t.projectId = p.id AND t.isCompleted = 1) AS completedCount, " +
    "CASE WHEN (SELECT COUNT(*) FROM tasks t WHERE t.projectId = p.id) > 0 " +
    "THEN ROUND((SELECT COUNT(*) FROM tasks t WHERE t.projectId = p.id AND t.isCompleted = 1) * 100.0 / " +
    "(SELECT COUNT(*) FROM tasks t WHERE t.projectId = p.id)) ELSE 0 END AS progress " +
    "FROM task_projects p WHERE p.id = ?"
  ).get(id);
  return c.json(updated);
});

// Delete project (tasks are NOT deleted, just unlinked)
taskProjects.delete("/:id", (c) => {
  const db = getDb();
  const userId = c.req.header("X-User-Id")!;
  const id = c.req.param("id");

  const existing = db.prepare("SELECT * FROM task_projects WHERE id = ?").get(id) as any;
  if (!existing) return c.json({ error: "Project not found" }, 404);
  if (!canManageResource(existing.userId, existing.workspaceId, userId)) {
    return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
  }

  // Unlink tasks from this project
  db.prepare("UPDATE tasks SET projectId = NULL WHERE projectId = ?").run(id);
  db.prepare("DELETE FROM task_projects WHERE id = ?").run(id);
  return c.json({ success: true });
});

// Reorder projects
taskProjects.put("/reorder/batch", async (c) => {
  const db = getDb();
  const userId = c.req.header("X-User-Id")!;
  const body = await c.req.json();
  const items = body.items as { id: string; sortOrder: number }[];

  if (!Array.isArray(items) || items.length === 0) {
    return c.json({ error: "items required" }, 400);
  }

  const safeItems = items.slice(0, 100);

  // Fix 3: validate permissions for every project
  for (const item of safeItems) {
    const project = db.prepare("SELECT userId, workspaceId FROM task_projects WHERE id = ?").get(item.id) as any;
    if (!project) return c.json({ error: `Project ${item.id} not found`, code: "NOT_FOUND" }, 404);
    if (!canManageResource(project.userId, project.workspaceId, userId)) {
      return c.json({ error: "No permission to reorder project " + item.id, code: "FORBIDDEN" }, 403);
    }
  }

  const stmt = db.prepare("UPDATE task_projects SET sortOrder = ?, updatedAt = datetime('now') WHERE id = ?");
  const tx = db.transaction(() => {
    for (const item of safeItems) {
      stmt.run(item.sortOrder, item.id);
    }
  });
  tx();

  return c.json({ success: true });
});

export default taskProjects;

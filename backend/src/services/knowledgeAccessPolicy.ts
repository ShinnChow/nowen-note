import type Database from "better-sqlite3";

import { getDb } from "../db/schema.js";
import { ensureKnowledgeTreeTables } from "../db/knowledgeTreeMigration.js";

export type KnowledgeAccessMode = "inherit" | "restricted";

export interface KnowledgeAccessPolicyMatch {
  nodeId: string;
  accessMode: "restricted";
  depth: number;
}

const initializedDatabases = new WeakSet<Database.Database>();

/**
 * A node enters restricted mode as soon as it has at least one direct ACL row.
 * In restricted mode, workspace membership alone is not sufficient: only an ACL
 * on the restricted node or one of its descendants grants access.
 */
export function ensureKnowledgeAccessPolicyTable(
  db: Database.Database = getDb(),
): void {
  if (initializedDatabases.has(db)) return;
  ensureKnowledgeTreeTables(db);
  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_tree_access_policies (
      nodeId TEXT PRIMARY KEY,
      accessMode TEXT NOT NULL DEFAULT 'restricted'
        CHECK(accessMode IN ('restricted')),
      updatedBy TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (nodeId) REFERENCES knowledge_tree_nodes(id) ON DELETE CASCADE,
      FOREIGN KEY (updatedBy) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_knowledge_tree_access_policy_mode
      ON knowledge_tree_access_policies(accessMode, nodeId);
  `);
  initializedDatabases.add(db);
}

export function getKnowledgeNodeAccessMode(
  nodeId: string,
  db: Database.Database = getDb(),
): KnowledgeAccessMode {
  ensureKnowledgeAccessPolicyTable(db);
  const row = db.prepare(`
    SELECT accessMode
    FROM knowledge_tree_access_policies
    WHERE nodeId = ?
  `).get(nodeId) as { accessMode: "restricted" } | undefined;
  return row?.accessMode || "inherit";
}

export function findNearestRestrictedKnowledgePolicy(
  nodeId: string,
  db: Database.Database = getDb(),
): KnowledgeAccessPolicyMatch | null {
  ensureKnowledgeAccessPolicyTable(db);
  return (db.prepare(`
    WITH RECURSIVE ancestors(id, parentId, depth) AS (
      SELECT id, parentId, 0
      FROM knowledge_tree_nodes
      WHERE id = ?
      UNION ALL
      SELECT parent.id, parent.parentId, ancestors.depth + 1
      FROM knowledge_tree_nodes parent
      JOIN ancestors ON parent.id = ancestors.parentId
    )
    SELECT policy.nodeId, policy.accessMode, ancestors.depth
    FROM ancestors
    JOIN knowledge_tree_access_policies policy ON policy.nodeId = ancestors.id
    WHERE policy.accessMode = 'restricted'
    ORDER BY ancestors.depth ASC
    LIMIT 1
  `).get(nodeId) as KnowledgeAccessPolicyMatch | undefined) || null;
}

export function restrictKnowledgeNodeAccess(input: {
  nodeId: string;
  actorUserId: string;
  db?: Database.Database;
}): void {
  const db = input.db || getDb();
  ensureKnowledgeAccessPolicyTable(db);
  db.prepare(`
    INSERT INTO knowledge_tree_access_policies (
      nodeId, accessMode, updatedBy, updatedAt
    ) VALUES (?, 'restricted', ?, datetime('now'))
    ON CONFLICT(nodeId) DO UPDATE SET
      accessMode = 'restricted',
      updatedBy = excluded.updatedBy,
      updatedAt = datetime('now')
  `).run(input.nodeId, input.actorUserId);
}

/** Restore workspace/parent inheritance only when no direct members remain. */
export function restoreKnowledgeNodeInheritanceIfEmpty(input: {
  nodeId: string;
  db?: Database.Database;
}): boolean {
  const db = input.db || getDb();
  ensureKnowledgeAccessPolicyTable(db);
  const count = (db.prepare(`
    SELECT COUNT(*) AS count
    FROM knowledge_tree_acl
    WHERE nodeId = ?
  `).get(input.nodeId) as { count: number }).count;
  if (count > 0) return false;
  return db.prepare(`
    DELETE FROM knowledge_tree_access_policies
    WHERE nodeId = ?
  `).run(input.nodeId).changes > 0;
}

-- Knowledge tree restricted access policy (Issue #643)
--
-- A policy row marks a node as an allowlist boundary. Workspace membership alone
-- must not grant visibility below that node; effective access must come from a
-- knowledge_tree_acl row on the boundary or one of its descendants.

CREATE TABLE IF NOT EXISTS knowledge_tree_access_policies (
  "nodeId" TEXT PRIMARY KEY
    REFERENCES knowledge_tree_nodes(id) ON DELETE CASCADE,
  "accessMode" TEXT NOT NULL DEFAULT 'restricted'
    CHECK ("accessMode" IN ('restricted')),
  "updatedBy" TEXT
    REFERENCES users(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_tree_access_policy_mode
  ON knowledge_tree_access_policies("accessMode", "nodeId");

-- Existing explicit ACLs were presented to users as a member list, so migrate
-- them to restricted boundaries immediately instead of requiring every folder
-- to be opened and saved again after upgrade.
INSERT INTO knowledge_tree_access_policies (
  "nodeId",
  "accessMode",
  "updatedBy",
  "createdAt",
  "updatedAt"
)
SELECT
  "nodeId",
  'restricted',
  MAX("grantedBy"),
  MIN("createdAt"),
  MAX("updatedAt")
FROM knowledge_tree_acl
GROUP BY "nodeId"
ON CONFLICT ("nodeId") DO NOTHING;

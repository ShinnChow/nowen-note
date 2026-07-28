import { describe, expect, it } from "vitest";

import { countOwnedNotebooks } from "@/lib/knowledgeTreeStats";
import type { KnowledgeTreeNode } from "@/lib/knowledgeTreeApi";

const node = (
  id: string,
  resourceType: KnowledgeTreeNode["resourceType"],
  overrides: Partial<KnowledgeTreeNode> = {},
): KnowledgeTreeNode => ({
  id,
  userId: "user-1",
  workspaceId: "workspace-1",
  scopeKey: "workspace-1",
  parentId: null,
  nodeType: resourceType === "note" ? "note" : "folder",
  resourceType,
  resourceId: id,
  title: id,
  sortOrder: 0,
  isExpanded: 0,
  childCount: 0,
  isDeleted: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  access: {
    nodeId: id,
    rolePreset: "admin",
    source: "owner",
    sourceNodeId: null,
    capabilities: {
      canView: true,
      canComment: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canMove: true,
      canDownload: true,
      canReshare: true,
      canManageMembers: true,
    },
  },
  ...overrides,
});

describe("knowledge tree stats", () => {
  it("统计当前空间内所有层级的笔记本并排除共享笔记本", () => {
    expect(countOwnedNotebooks([
      node("root-notebook", "notebook"),
      node("nested-notebook", "notebook", { parentId: "root-notebook" }),
      node("shared-notebook", "notebook", { sharedRootId: "shared-notebook" }),
      node("deleted-notebook", "notebook", { isDeleted: 1 }),
      node("folder", "file"),
      node("note", "note"),
    ])).toBe(2);
  });
});

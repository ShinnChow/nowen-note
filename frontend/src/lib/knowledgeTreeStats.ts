import type { KnowledgeTreeNode } from "@/lib/knowledgeTreeApi";

export function countOwnedNotebooks(nodes: KnowledgeTreeNode[]): number {
  return nodes.filter((node) => (
    node.resourceType === "notebook"
    && !node.sharedRootId
    && node.isDeleted !== 1
  )).length;
}

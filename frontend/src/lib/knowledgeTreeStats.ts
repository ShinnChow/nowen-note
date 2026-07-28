import type { KnowledgeTreeNode } from "@/lib/knowledgeTreeApi";

export function countOwnedNotebooks(nodes: KnowledgeTreeNode[]): number {
  return nodes.filter((node) => (
    node.resourceType === "notebook"
    && !node.sharedRootId
    && node.isDeleted !== 1
  )).length;
}

export function countDescendantNotebooks(
  nodes: KnowledgeTreeNode[],
  rootNodeId: string,
): number {
  const children = new Map<string, KnowledgeTreeNode[]>();
  for (const node of nodes) {
    if (!node.parentId || node.isDeleted === 1 || node.sharedRootId) continue;
    const siblings = children.get(node.parentId) || [];
    siblings.push(node);
    children.set(node.parentId, siblings);
  }

  let count = 0;
  const pending = [rootNodeId];
  const visited = new Set(pending);
  while (pending.length > 0) {
    const parentId = pending.pop()!;
    for (const child of children.get(parentId) || []) {
      if (visited.has(child.id)) continue;
      visited.add(child.id);
      if (child.resourceType === "notebook") count += 1;
      pending.push(child.id);
    }
  }
  return count;
}

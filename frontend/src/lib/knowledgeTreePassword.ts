import type { KnowledgeTreeNode } from "@/lib/knowledgeTreeApi";

const SESSION_KEY = "nowen-knowledge-tree-unlocked-folders";
export const KNOWLEDGE_TREE_PASSWORD_SESSION_CHANGED_EVENT = "nowen:knowledge-tree-password-session-changed";

function emitSessionChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(KNOWLEDGE_TREE_PASSWORD_SESSION_CHANGED_EVENT));
  }
}

export function loadUnlockedFolderIds(): Set<string> {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]");
    return new Set(Array.isArray(value) ? value.filter((id: unknown): id is string => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

export function rememberUnlockedFolder(nodeId: string): Set<string> {
  const next = loadUnlockedFolderIds();
  next.add(nodeId);
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(Array.from(next)));
  } catch {
    // 会话存储不可用时仍允许当前组件维持解锁状态。
  }
  emitSessionChanged();
  return next;
}

export function forgetUnlockedFolder(nodeId: string): Set<string> {
  const next = loadUnlockedFolderIds();
  next.delete(nodeId);
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(Array.from(next)));
  } catch {
    // 会话存储不可用时仍允许当前组件维持锁定状态。
  }
  emitSessionChanged();
  return next;
}

export function isFolderUnlocked(node: KnowledgeTreeNode, unlockedIds: Set<string>): boolean {
  return node.isPasswordProtected !== 1 || unlockedIds.has(node.id);
}

export function hideLockedFolderDescendants(
  nodes: KnowledgeTreeNode[],
  unlockedIds: Set<string>,
): KnowledgeTreeNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return nodes.filter((node) => {
    let parent = node.parentId ? byId.get(node.parentId) : undefined;
    const visited = new Set<string>();
    while (parent && !visited.has(parent.id)) {
      if (!isFolderUnlocked(parent, unlockedIds)) return false;
      visited.add(parent.id);
      parent = parent.parentId ? byId.get(parent.parentId) : undefined;
    }
    return true;
  });
}

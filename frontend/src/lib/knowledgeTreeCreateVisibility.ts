export const KNOWLEDGE_TREE_CLEAR_SEARCH_EVENT = "nowen:knowledge-tree-clear-search";

export type KnowledgeTreeClearSearchDetail = {
  parentId?: string | null;
};

/** 文档创建成功后退出临时筛选，并让目标父节点保持展开。 */
export function revealCreatedKnowledgeTreeNote(parentId?: string | null): void {
  window.dispatchEvent(new CustomEvent<KnowledgeTreeClearSearchDetail>(
    KNOWLEDGE_TREE_CLEAR_SEARCH_EVENT,
    { detail: { parentId } },
  ));
}

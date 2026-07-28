import React, { useCallback, useEffect, useRef } from "react";

import KnowledgeTreePanelBase, {
  FOCUS_KNOWLEDGE_TREE_EVENT,
  KNOWLEDGE_TREE_CHANGED_EVENT,
  type KnowledgeTreePanelProps,
} from "./KnowledgeTreePanel";
import { choose, prompt } from "@/components/ui/confirm";
import { api } from "@/lib/api";
import {
  defaultInlineCreateTitle,
  normalizeInlineCreateTitle,
  type KnowledgeTreeInlineCreateKind,
} from "@/lib/knowledgeTreeInlineCreate";
import { knowledgeTreeApi } from "@/lib/knowledgeTreeApi";
import { toast } from "@/lib/toast";
import { useAppActions } from "@/store/AppContext";

export { FOCUS_KNOWLEDGE_TREE_EVENT, KNOWLEDGE_TREE_CHANGED_EVENT };
export type { KnowledgeTreePanelProps };

const CREATE_SCOPE_ATTR = "data-nowen-create-scope";

function markCreateButtons(root: HTMLElement): void {
  for (const button of root.querySelectorAll<HTMLButtonElement>('button[title="新建根文件夹"]')) {
    button.setAttribute(CREATE_SCOPE_ATTR, "root");
    button.title = "新建";
    button.setAttribute("aria-label", "在根目录新建");
  }
  for (const button of root.querySelectorAll<HTMLButtonElement>('button[title="新建文档"]')) {
    button.setAttribute(CREATE_SCOPE_ATTR, "node");
    button.title = "新建";
    const row = button.closest<HTMLElement>("[data-knowledge-tree-node-id]");
    const title = row?.querySelector<HTMLButtonElement>('button[title]:not([data-nowen-create-scope])')?.title;
    button.setAttribute("aria-label", title ? `在“${title}”下新建` : "在当前节点下新建");
  }
}

function emitTreeChanged(): void {
  window.dispatchEvent(new CustomEvent(KNOWLEDGE_TREE_CHANGED_EVENT, {
    detail: { reason: "node-created-plus-menu" },
  }));
}

export function KnowledgeTreePanel(props: KnowledgeTreePanelProps) {
  const actions = useAppActions();
  const rootRef = useRef<HTMLDivElement>(null);
  const creatingRef = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mark = () => markCreateButtons(root);
    mark();
    const observer = new MutationObserver(mark);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const activateCreatedNote = useCallback(async (noteId: string) => {
    const note = await api.getNote(noteId);
    actions.setActiveNote(note);
    actions.setSelectedNotebook(note.notebookId);
    actions.setSelectedTag(null);
    actions.setViewMode("notebook");
    actions.openNoteTab({
      id: note.id,
      title: note.title,
      notebookId: note.notebookId,
      workspaceId: note.workspaceId,
      contentFormat: note.contentFormat,
      isLocked: note.isLocked,
      isTrashed: note.isTrashed,
      updatedAt: note.updatedAt,
    });
    actions.setMobileView("editor");
    if (props.variant === "mobile") actions.setMobileSidebar(false);
  }, [actions, props.variant]);

  const createFromPlus = useCallback(async (parentId: string | null) => {
    if (creatingRef.current) return;
    creatingRef.current = true;
    try {
      const kind = await choose({
        title: parentId ? "在当前节点下新建" : "在根目录新建",
        description: "选择要创建的内容类型",
        choices: [
          { value: "note", label: "富文本文档" },
          { value: "markdown", label: "Markdown 文档" },
          { value: "folder", label: "文件夹" },
        ],
      });
      if (kind !== "note" && kind !== "markdown" && kind !== "folder") return;

      const createKind = kind as KnowledgeTreeInlineCreateKind;
      const rawTitle = await prompt({
        title: kind === "folder" ? "新建文件夹" : kind === "markdown" ? "新建 Markdown 文档" : "新建富文本文档",
        defaultValue: defaultInlineCreateTitle(createKind),
        confirmText: "创建",
      });
      if (rawTitle == null) return;
      const title = normalizeInlineCreateTitle(rawTitle);
      if (!title) {
        toast.error("名称不能为空");
        return;
      }

      const created = await knowledgeTreeApi.create({
        parentId,
        nodeType: createKind,
        title,
      });
      emitTreeChanged();
      actions.refreshNotebooks();
      actions.refreshNotes();

      if (kind === "folder") {
        toast.success("已创建文件夹");
        return;
      }
      await activateCreatedNote(created.resourceId);
    } catch (error: any) {
      toast.error(error?.message || "创建失败，请重试");
    } finally {
      creatingRef.current = false;
    }
  }, [actions, activateCreatedNote]);

  const handleClickCapture = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>(`button[${CREATE_SCOPE_ATTR}]`);
    if (!button || !rootRef.current?.contains(button)) return;

    event.preventDefault();
    event.stopPropagation();
    const scope = button.getAttribute(CREATE_SCOPE_ATTR);
    const parentId = scope === "node"
      ? button.closest<HTMLElement>("[data-knowledge-tree-node-id]")?.dataset.knowledgeTreeNodeId || null
      : null;
    void createFromPlus(parentId);
  }, [createFromPlus]);

  return (
    <div ref={rootRef} className="contents" onClickCapture={handleClickCapture}>
      <KnowledgeTreePanelBase {...props} />
    </div>
  );
}

export default KnowledgeTreePanel;

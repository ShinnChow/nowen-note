import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileCode, FileText, Folder } from "lucide-react";

import KnowledgeTreePanelBase, {
  FOCUS_KNOWLEDGE_TREE_EVENT,
  KNOWLEDGE_TREE_CHANGED_EVENT,
  type KnowledgeTreePanelProps,
} from "./KnowledgeTreePanel";
import { api } from "@/lib/api";
import {
  defaultInlineCreateTitle,
  type KnowledgeTreeInlineCreateKind,
} from "@/lib/knowledgeTreeInlineCreate";
import { knowledgeTreeApi } from "@/lib/knowledgeTreeApi";
import { toast } from "@/lib/toast";
import { useAppActions } from "@/store/AppContext";

export { FOCUS_KNOWLEDGE_TREE_EVENT, KNOWLEDGE_TREE_CHANGED_EVENT };
export type { KnowledgeTreePanelProps };

const CREATE_SCOPE_ATTR = "data-nowen-create-scope";
const CREATE_MENU_WIDTH = 184;
const CREATE_MENU_HEIGHT = 116;

const CREATE_ITEMS = [
  { kind: "note", label: "富文本文档", icon: FileText },
  { kind: "markdown", label: "Markdown 文档", icon: FileCode },
  { kind: "folder", label: "文件夹", icon: Folder },
] as const;

interface CreateMenuState {
  parentId: string | null;
  anchor: DOMRect;
}

function markCreateButtons(root: HTMLElement): void {
  for (const button of root.querySelectorAll<HTMLButtonElement>('button[title="新建根文件夹"]')) {
    button.setAttribute(CREATE_SCOPE_ATTR, "root");
    button.title = "新建";
    button.setAttribute("aria-label", "在根目录新建");
    button.setAttribute("aria-haspopup", "menu");
  }
  for (const button of root.querySelectorAll<HTMLButtonElement>('button[title="新建文档"]')) {
    button.setAttribute(CREATE_SCOPE_ATTR, "node");
    button.title = "新建";
    const row = button.closest<HTMLElement>("[data-knowledge-tree-node-id]");
    const title = row?.querySelector<HTMLButtonElement>('button[title]:not([data-nowen-create-scope])')?.title;
    button.setAttribute("aria-label", title ? `在“${title}”下新建` : "在当前节点下新建");
    button.setAttribute("aria-haspopup", "menu");
  }
}

function emitTreeChanged(): void {
  window.dispatchEvent(new CustomEvent(KNOWLEDGE_TREE_CHANGED_EVENT, {
    detail: { reason: "node-created-plus-menu" },
  }));
}

function menuPosition(anchor: DOMRect): React.CSSProperties {
  const viewportWidth = typeof window === "undefined" ? 1024 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 768 : window.innerHeight;
  const below = anchor.bottom + 6;
  const top = below + CREATE_MENU_HEIGHT <= viewportHeight - 8
    ? below
    : Math.max(8, anchor.top - CREATE_MENU_HEIGHT - 6);
  const left = Math.min(
    Math.max(8, anchor.right - CREATE_MENU_WIDTH),
    Math.max(8, viewportWidth - CREATE_MENU_WIDTH - 8),
  );
  return { top, left, width: CREATE_MENU_WIDTH };
}

export function KnowledgeTreePanel(props: KnowledgeTreePanelProps) {
  const actions = useAppActions();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const creatingRef = useRef(false);
  const [createMenu, setCreateMenu] = useState<CreateMenuState | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mark = () => markCreateButtons(root);
    mark();
    const observer = new MutationObserver(mark);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!createMenu) return;

    const closeFromPointer = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && menuRef.current?.contains(target)) return;
      setCreateMenu(null);
    };
    const closeFromKeyboard = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setCreateMenu(null);
    };
    const closeFromViewport = () => setCreateMenu(null);

    window.addEventListener("pointerdown", closeFromPointer, true);
    window.addEventListener("keydown", closeFromKeyboard, true);
    window.addEventListener("resize", closeFromViewport);
    window.addEventListener("scroll", closeFromViewport, true);
    return () => {
      window.removeEventListener("pointerdown", closeFromPointer, true);
      window.removeEventListener("keydown", closeFromKeyboard, true);
      window.removeEventListener("resize", closeFromViewport);
      window.removeEventListener("scroll", closeFromViewport, true);
    };
  }, [createMenu]);

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

  const createFromMenu = useCallback(async (
    parentId: string | null,
    kind: KnowledgeTreeInlineCreateKind,
  ) => {
    if (creatingRef.current) return;
    creatingRef.current = true;
    setCreateMenu(null);
    try {
      const created = await knowledgeTreeApi.create({
        parentId,
        nodeType: kind,
        title: defaultInlineCreateTitle(kind),
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
    const anchor = button.getBoundingClientRect();
    setCreateMenu((current) => current?.parentId === parentId ? null : { parentId, anchor });
  }, []);

  const dropdown = createMenu && typeof document !== "undefined"
    ? createPortal(
      <div
        ref={menuRef}
        role="menu"
        aria-label={createMenu.parentId ? "在当前节点下新建" : "在根目录新建"}
        className="fixed z-[420] overflow-hidden rounded-lg border border-app-border bg-app-bg p-1 shadow-xl"
        style={menuPosition(createMenu.anchor)}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {CREATE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.kind}
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-tx-secondary transition-colors hover:bg-app-hover hover:text-tx-primary focus:bg-app-hover focus:text-tx-primary focus:outline-none"
              onClick={() => void createFromMenu(createMenu.parentId, item.kind)}
            >
              <Icon
                size={15}
                className={item.kind === "folder"
                  ? "text-amber-500"
                  : item.kind === "markdown"
                    ? "text-emerald-500"
                    : "text-accent-primary"}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>,
      document.body,
    )
    : null;

  return (
    <>
      <div ref={rootRef} className="contents" onClickCapture={handleClickCapture}>
        <KnowledgeTreePanelBase {...props} />
      </div>
      {dropdown}
    </>
  );
}

export default KnowledgeTreePanel;

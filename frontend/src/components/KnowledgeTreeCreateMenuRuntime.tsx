import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileCode, Files, FileText, FileType2, Folder, Link2 } from "lucide-react";

import KnowledgeTreePanelBase, {
  FOCUS_KNOWLEDGE_TREE_EVENT,
  KNOWLEDGE_TREE_CHANGED_EVENT,
  type KnowledgeTreeImportRequest,
  type KnowledgeTreeInlineCreateRequest,
  type KnowledgeTreePanelProps,
} from "./KnowledgeTreePanel";
import { type KnowledgeTreeInlineCreateKind } from "@/lib/knowledgeTreeInlineCreate";
import { cn } from "@/lib/utils";
import { useApp, useAppActions } from "@/store/AppContext";

export { FOCUS_KNOWLEDGE_TREE_EVENT, KNOWLEDGE_TREE_CHANGED_EVENT };
export type { KnowledgeTreePanelProps };

const CREATE_SCOPE_ATTR = "data-nowen-create-scope";
const ALL_NOTES_HOST_ATTR = "data-knowledge-tree-all-notes-host";
const CREATE_MENU_WIDTH = 184;
const CREATE_MENU_HEIGHT = 252;

const CREATE_ITEMS = [
  { kind: "note", label: "富文本文档", icon: FileText },
  { kind: "markdown", label: "Markdown 文档", icon: FileCode },
  { kind: "folder", label: "文件夹", icon: Folder },
] as const;

const IMPORT_ITEMS = [
  { kind: "markdown", label: "导入 Markdown 文件", icon: FileCode },
  { kind: "word", label: "导入 Word 文档", icon: FileType2 },
  { kind: "wechat", label: "导入公众号文章", icon: Link2 },
] as const;

export interface KnowledgeTreeCreateMenuState {
  parentId: string | null;
  anchor: DOMRect;
}

interface KnowledgeTreeCreateDropdownProps {
  menu: KnowledgeTreeCreateMenuState | null;
  onClose: () => void;
  onCreate: (parentId: string | null, kind: KnowledgeTreeInlineCreateKind) => void;
  onImport: (parentId: string | null, kind: KnowledgeTreeImportRequest["kind"]) => void;
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

function ensureAllNotesHost(root: HTMLElement): HTMLElement | null {
  const panel = root.querySelector<HTMLElement>('[data-nowen-knowledge-tree="embedded"]');
  if (!panel) return null;
  const scroll = panel.querySelector<HTMLElement>('[data-swipe-blocker="knowledge-tree-scroll"]');
  if (!scroll || scroll.parentElement !== panel) return null;

  let host = panel.querySelector<HTMLElement>(`[${ALL_NOTES_HOST_ATTR}]`);
  if (!host) {
    host = document.createElement("div");
    host.setAttribute(ALL_NOTES_HOST_ATTR, "");
    host.className = "shrink-0 px-2 pb-1.5";
    panel.insertBefore(host, scroll);
  }
  return host;
}

function AllNotesEntry({ variant }: { variant: "desktop" | "mobile" }) {
  const { state } = useApp();
  const actions = useAppActions();
  const active = state.viewMode === "all"
    && state.selectedNotebookId === null
    && state.selectedTagIds.length === 0;
  const allNotesCount = useMemo(() => {
    const countedNotebooks = state.notebooks.filter(
      (notebook) => typeof notebook.noteCount === "number",
    );
    if (countedNotebooks.length === state.notebooks.length) {
      return countedNotebooks.reduce(
        (total, notebook) => total + Math.max(0, notebook.noteCount || 0),
        0,
      );
    }
    return active ? state.notes.length : null;
  }, [active, state.notebooks, state.notes.length]);

  const openAllNotes = useCallback(() => {
    actions.setSelectedNotebook(null);
    actions.clearSelectedTags();
    actions.setSearchQuery("");
    actions.setViewMode("all");
    actions.setMobileView("list");
    if (variant === "desktop" && state.noteListCollapsed) {
      actions.toggleNoteListCollapsed();
    }
    if (variant === "mobile") actions.setMobileSidebar(false);
  }, [actions, state.noteListCollapsed, variant]);

  return (
    <button
      type="button"
      onClick={openAllNotes}
      className={cn(
        "group flex h-9 w-full items-center gap-2 rounded-lg border px-2.5 text-left text-xs font-medium transition-colors",
        active
          ? "border-accent-primary/15 bg-accent-primary/10 text-accent-primary"
          : "border-transparent text-tx-secondary hover:bg-app-hover hover:text-tx-primary",
      )}
      aria-current={active ? "page" : undefined}
      aria-label={allNotesCount === null ? "查看所有笔记" : `查看所有笔记，共 ${allNotesCount} 条`}
      data-knowledge-tree-all-notes=""
    >
      <Files size={15} className="shrink-0 text-accent-primary" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">所有笔记</span>
      {allNotesCount !== null && (
        <span
          className={cn(
            "min-w-6 shrink-0 rounded-full px-1.5 text-center text-[10px] leading-5 tabular-nums",
            active ? "bg-accent-primary/10 text-accent-primary" : "bg-app-hover text-tx-tertiary",
          )}
          data-knowledge-tree-all-notes-count=""
        >
          {allNotesCount}
        </span>
      )}
    </button>
  );
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

export function KnowledgeTreeCreateDropdown({
  menu,
  onClose,
  onCreate,
  onImport,
}: KnowledgeTreeCreateDropdownProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const closeFromPointer = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && menuRef.current?.contains(target)) return;
      onClose();
    };
    const closeFromKeyboard = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("pointerdown", closeFromPointer, true);
    window.addEventListener("keydown", closeFromKeyboard, true);
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", onClose, true);
    return () => {
      window.removeEventListener("pointerdown", closeFromPointer, true);
      window.removeEventListener("keydown", closeFromKeyboard, true);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [menu, onClose]);

  if (!menu || typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={menu.parentId ? "在当前节点下新建" : "在根目录新建"}
      className="fixed z-[420] overflow-hidden rounded-lg border border-app-border bg-app-bg p-1 shadow-xl"
      style={menuPosition(menu.anchor)}
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
            onClick={() => onCreate(menu.parentId, item.kind)}
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
      <div className="my-1 border-t border-app-border" />
      {IMPORT_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.kind}
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-tx-secondary transition-colors hover:bg-app-hover hover:text-tx-primary focus:bg-app-hover focus:text-tx-primary focus:outline-none"
            onClick={() => onImport(menu.parentId, item.kind)}
          >
            <Icon
              size={15}
              className={item.kind === "markdown"
                ? "text-emerald-500"
                : item.kind === "word"
                  ? "text-violet-500"
                  : "text-sky-500"}
            />
            <span>{item.label}</span>
          </button>
        );
      })}
      <p className="border-t border-app-border px-2.5 pb-1 pt-2 text-[10px] text-tx-tertiary">
        也可将 .md 文件拖拽到目录树导入
      </p>
    </div>,
    document.body,
  );
}

export function KnowledgeTreePanel(props: KnowledgeTreePanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const requestCounterRef = useRef(0);
  const [createMenu, setCreateMenu] = useState<KnowledgeTreeCreateMenuState | null>(null);
  const [createRequest, setCreateRequest] = useState<KnowledgeTreeInlineCreateRequest | undefined>();
  const [importRequest, setImportRequest] = useState<KnowledgeTreeImportRequest | undefined>();
  const [allNotesHost, setAllNotesHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const syncRuntimeEnhancements = () => {
      markCreateButtons(root);
      const host = ensureAllNotesHost(root);
      setAllNotesHost((current) => current === host ? current : host);
    };
    syncRuntimeEnhancements();
    const observer = new MutationObserver(syncRuntimeEnhancements);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const requestInlineCreate = useCallback((
    parentId: string | null,
    kind: KnowledgeTreeInlineCreateKind,
  ) => {
    setCreateMenu(null);
    requestCounterRef.current += 1;
    setCreateRequest({
      requestId: requestCounterRef.current,
      parentId,
      kind,
    });
  }, []);

  const requestImport = useCallback((
    parentId: string | null,
    kind: KnowledgeTreeImportRequest["kind"],
  ) => {
    setCreateMenu(null);
    requestCounterRef.current += 1;
    setImportRequest({
      requestId: requestCounterRef.current,
      parentId,
      kind,
    });
  }, []);

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

  const variant = props.variant ?? "desktop";

  return (
    <>
      <div ref={rootRef} className="contents" onClickCapture={handleClickCapture}>
        <KnowledgeTreePanelBase {...props} createRequest={createRequest} importRequest={importRequest} />
      </div>
      {allNotesHost && createPortal(<AllNotesEntry variant={variant} />, allNotesHost)}
      <KnowledgeTreeCreateDropdown
        menu={createMenu}
        onClose={() => setCreateMenu(null)}
        onCreate={requestInlineCreate}
        onImport={requestImport}
      />
    </>
  );
}

export default KnowledgeTreePanel;

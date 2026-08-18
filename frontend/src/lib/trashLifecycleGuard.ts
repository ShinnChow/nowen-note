import { api } from "./api";
import { toast } from "./toast";
import { getLatestContextMenuState } from "../hooks/useContextMenu";

type TrashListNote = {
  id: string;
  title?: string;
  isTrashed?: number;
};

const trashedNoteIds = new Set<string>();
let installed = false;
let observer: MutationObserver | null = null;
let scheduledFrame: number | null = null;
let lastNoticeNoteId = "";
let lastNoticeAt = 0;

function captureTrashState(rows: unknown): void {
  if (!Array.isArray(rows)) return;
  for (const row of rows as TrashListNote[]) {
    if (!row || typeof row.id !== "string" || !row.id) continue;
    if (row.isTrashed === 1) trashedNoteIds.add(row.id);
    else if (row.isTrashed === 0) trashedNoteIds.delete(row.id);
  }
  scheduleReconcile();
}

function findNoteCard(titleElement: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = titleElement.parentElement;
  while (current && current !== document.body) {
    // NoteCard 根节点自身带 group；标题内部目前没有其它 group。
    if (current.classList.contains("group")) return current;
    current = current.parentElement;
  }
  return null;
}

function reconcileCards(): void {
  const titles = Array.from(document.querySelectorAll<HTMLElement>(".note-card-title"));
  for (const title of titles) {
    const titleRow = title.parentElement;
    const noteId = titleRow?.dataset.nowenNoteId || "";
    if (!noteId) continue;

    const card = findNoteCard(title);
    if (!card) continue;
    if (trashedNoteIds.has(noteId)) {
      card.dataset.nowenTrashedNoteId = noteId;
    } else {
      delete card.dataset.nowenTrashedNoteId;
      if (card.dataset.nowenTrashSelected === "1") {
        delete card.dataset.nowenTrashSelected;
        card.classList.remove("bg-accent-primary/10", "border-accent-primary/40", "shadow-sm");
      }
    }
  }
}

function reconcileInjectedIconMenu(): void {
  const menuState = getLatestContextMenuState();
  const shouldHide =
    menuState.isOpen
    && menuState.targetType === "note"
    && typeof menuState.targetId === "string"
    && trashedNoteIds.has(menuState.targetId);

  for (const host of Array.from(document.querySelectorAll<HTMLElement>("[data-nowen-note-icon-menu-host]"))) {
    host.style.display = shouldHide ? "none" : "";
    host.setAttribute("aria-hidden", shouldHide ? "true" : "false");
  }
}

function reconcile(): void {
  scheduledFrame = null;
  reconcileCards();
  reconcileInjectedIconMenu();
}

function scheduleReconcile(): void {
  if (typeof window === "undefined" || scheduledFrame !== null) return;
  scheduledFrame = window.requestAnimationFrame(reconcile);
}

function markTrashSelection(card: HTMLElement): void {
  for (const selected of Array.from(document.querySelectorAll<HTMLElement>("[data-nowen-trash-selected='1']"))) {
    if (selected === card) continue;
    delete selected.dataset.nowenTrashSelected;
    selected.classList.remove("bg-accent-primary/10", "border-accent-primary/40", "shadow-sm");
  }
  card.dataset.nowenTrashSelected = "1";
  // 这些类本来就在 NoteCard 的选中态中，CSS 一定已被 Tailwind 产出。
  card.classList.add("bg-accent-primary/10", "border-accent-primary/40", "shadow-sm");
}

function notifyTrashSelection(noteId: string): void {
  const now = Date.now();
  if (lastNoticeNoteId === noteId && now - lastNoticeAt < 1800) return;
  lastNoticeNoteId = noteId;
  lastNoticeAt = now;
  toast.info("该笔记位于回收站，恢复后即可重新查看和编辑");
}

function handleDocumentClick(event: MouseEvent): void {
  // Ctrl/Cmd/Shift 点击仍交给 NoteList 自己处理多选；多选分支本来就不会打开笔记。
  if (event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (!(event.target instanceof Element)) return;

  const card = event.target.closest<HTMLElement>("[data-nowen-trashed-note-id]");
  if (!card) return;

  const noteId = card.dataset.nowenTrashedNoteId || "";
  if (!noteId || !trashedNoteIds.has(noteId)) return;

  // 在 React NoteCard 的 onClick 之前阻断事件。这样不会进入 handleSelectNote，
  // 也就不会请求普通 GET /notes/:id，更不会启动附件 access-url priming。
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  markTrashSelection(card);
  notifyTrashSelection(noteId);
}

function startDomGuard(): void {
  if (!document.body) return;
  document.addEventListener("click", handleDocumentClick, true);
  observer = new MutationObserver(scheduleReconcile);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    // 只关注 NoteIconBridge 产生的稳定 noteId 身份；守卫自己的 data-* 不触发回调。
    attributeFilter: ["data-nowen-note-id"],
  });
  scheduleReconcile();
}

/**
 * 回收站只允许恢复/永久删除，不属于普通笔记编辑生命周期。
 *
 * 后端 resolveNotePermission 会故意隐藏 tombstone，因此不能通过放宽 ACL 修复。
 * 这里在 UI 边界阻止已删除笔记进入正常加载链路，并屏蔽 NoteIconBridge 为
 * 普通笔记动态补充的“设置图标”菜单。
 */
export function installTrashLifecycleGuard(): void {
  if (installed || typeof window === "undefined" || typeof document === "undefined") return;
  installed = true;

  // NoteIconBridge 也会包装 getNotes；这里继续链式包装，不改变 API 返回值。
  const apiAny = api as any;
  if (!apiAny.__trashLifecycleGuardInstalled) {
    apiAny.__trashLifecycleGuardInstalled = true;
    const originalGetNotes = typeof apiAny.getNotes === "function" ? apiAny.getNotes.bind(apiAny) : null;
    if (originalGetNotes) {
      apiAny.getNotes = async (...args: unknown[]) => {
        const rows = await originalGetNotes(...args);
        captureTrashState(rows);
        return rows;
      };
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startDomGuard, { once: true });
  } else {
    startDomGuard();
  }
}

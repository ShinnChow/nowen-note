from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    text = file_path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one marker, found {count}: {old[:100]!r}")
    file_path.write_text(text.replace(old, new, 1), encoding="utf-8")


Path("frontend/src/lib/knowledgeTreePassword.ts").write_text(r'''import type { KnowledgeTreeNode } from "@/lib/knowledgeTreeApi";

const SESSION_KEY = "nowen-knowledge-tree-folder-unlock-tokens";
export const KNOWLEDGE_TREE_PASSWORD_SESSION_CHANGED_EVENT = "nowen:knowledge-tree-password-session-changed";
export const KNOWLEDGE_TREE_PASSWORD_LOCKED_EVENT = "nowen:knowledge-tree-password-locked";
export const KNOWLEDGE_TREE_PASSWORD_LOCK_BROADCAST_KEY = "nowen:knowledge-tree-password-lock-broadcast";

export type KnowledgeTreeFolderLockReason =
  | "idle"
  | "background"
  | "expired"
  | "manual"
  | "account-changed"
  | "remote";

export interface FolderUnlockSessionSnapshot {
  folderIds: Set<string>;
  earliestExpiresAt: number | null;
}

function emitSessionChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(KNOWLEDGE_TREE_PASSWORD_SESSION_CHANGED_EVENT));
  }
}

function emitLocked(reason: KnowledgeTreeFolderLockReason, folderIds: string[]): void {
  if (typeof window === "undefined" || folderIds.length === 0) return;
  window.dispatchEvent(new CustomEvent(KNOWLEDGE_TREE_PASSWORD_LOCKED_EVENT, {
    detail: { reason, folderIds },
  }));
}

function tokenPayload(token: string): { userId?: string; exp?: number } | null {
  try {
    const encoded = token.split(".")[1];
    if (!encoded) return null;
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as { userId?: string; exp?: number };
  } catch {
    return null;
  }
}

function readRawFolderUnlockTokenMap(): Record<string, string> {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter((entry): entry is [string, string] => (
        typeof entry[0] === "string" && typeof entry[1] === "string" && !!entry[1]
      )),
    );
  } catch {
    return {};
  }
}

function loadFolderUnlockTokenMap(): Record<string, string> {
  const value = readRawFolderUnlockTokenMap();
  try {
    const currentUserId = tokenPayload(localStorage.getItem("nowen-token") || "")?.userId;
    const now = Math.floor(Date.now() / 1000);
    if (!currentUserId) return {};
    return Object.fromEntries(
      Object.entries(value).filter((entry): entry is [string, string] => {
        const payload = tokenPayload(entry[1]);
        return payload?.userId === currentUserId && (!payload.exp || payload.exp > now);
      }),
    );
  } catch {
    return {};
  }
}

function writeFolderUnlockTokenMap(next: Record<string, string>): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {
    // 会话存储不可用时仍允许当前组件维持解锁状态。
  }
}

function broadcastLock(reason: KnowledgeTreeFolderLockReason): void {
  try {
    const nonce = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    localStorage.setItem(KNOWLEDGE_TREE_PASSWORD_LOCK_BROADCAST_KEY, JSON.stringify({
      reason,
      at: Date.now(),
      nonce,
    }));
  } catch {
    // 隐私模式或受限 WebView 中无法广播时，当前窗口仍会正常锁定。
  }
}

export function loadUnlockedFolderIds(): Set<string> {
  return new Set(Object.keys(loadFolderUnlockTokenMap()));
}

export function getFolderUnlockSessionSnapshot(): FolderUnlockSessionSnapshot {
  const map = loadFolderUnlockTokenMap();
  let earliestExpiresAt: number | null = null;
  for (const token of Object.values(map)) {
    const exp = tokenPayload(token)?.exp;
    if (!exp) continue;
    const expiresAt = exp * 1000;
    earliestExpiresAt = earliestExpiresAt === null
      ? expiresAt
      : Math.min(earliestExpiresAt, expiresAt);
  }
  return {
    folderIds: new Set(Object.keys(map)),
    earliestExpiresAt,
  };
}

export function loadFolderUnlockTokens(): string[] {
  return Object.values(loadFolderUnlockTokenMap());
}

export function folderUnlockRequestHeaders(): Record<string, string> {
  const tokens = loadFolderUnlockTokens();
  return tokens.length > 0 ? { "X-Folder-Unlock-Tokens": tokens.join(",") } : {};
}

export function rememberUnlockedFolder(nodeId: string, unlockToken: string): Set<string> {
  const next = loadFolderUnlockTokenMap();
  next[nodeId] = unlockToken;
  writeFolderUnlockTokenMap(next);
  emitSessionChanged();
  return new Set(Object.keys(next));
}

export function forgetUnlockedFolder(nodeId: string): Set<string> {
  const next = loadFolderUnlockTokenMap();
  delete next[nodeId];
  writeFolderUnlockTokenMap(next);
  emitSessionChanged();
  return new Set(Object.keys(next));
}

export function clearFolderUnlockTokens(options: {
  reason?: KnowledgeTreeFolderLockReason;
  broadcast?: boolean;
} = {}): void {
  const folderIds = Object.keys(readRawFolderUnlockTokenMap());
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // 会话存储不可用时只通知当前界面重新读取状态。
  }
  const reason = options.reason || "manual";
  emitSessionChanged();
  emitLocked(reason, folderIds);
  if (options.broadcast) broadcastLock(reason);
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
''', encoding="utf-8")

Path("frontend/src/lib/knowledgeTreeAutoLock.ts").write_text(r'''import type { FolderAutoLockMinutes } from "@/lib/userPreferenceAccountCache";
import {
  clearFolderUnlockTokens,
  getFolderUnlockSessionSnapshot,
  KNOWLEDGE_TREE_PASSWORD_LOCK_BROADCAST_KEY,
  KNOWLEDGE_TREE_PASSWORD_SESSION_CHANGED_EVENT,
  type KnowledgeTreeFolderLockReason,
} from "@/lib/knowledgeTreePassword";

export const FOLDER_BACKGROUND_LOCK_DELAY_MS = 5 * 60 * 1000;
export const FOLDER_AUTO_LOCK_OPTIONS: ReadonlyArray<{
  value: FolderAutoLockMinutes;
  label: string;
}> = [
  { value: 0, label: "仅关闭应用或会话时" },
  { value: 5, label: "闲置 5 分钟" },
  { value: 15, label: "闲置 15 分钟（推荐）" },
  { value: 30, label: "闲置 30 分钟" },
  { value: 60, label: "闲置 1 小时" },
];

export interface KnowledgeTreeAutoLockOptions {
  idleMinutes: FolderAutoLockMinutes;
  lockOnBackground: boolean;
}

export function shouldLockAfterIdle(
  lastActivityAt: number,
  now: number,
  idleMinutes: FolderAutoLockMinutes,
): boolean {
  return idleMinutes > 0 && now - lastActivityAt >= idleMinutes * 60 * 1000;
}

export function shouldLockAfterBackground(backgroundAt: number, now: number): boolean {
  return now - backgroundAt >= FOLDER_BACKGROUND_LOCK_DELAY_MS;
}

export function installKnowledgeTreeAutoLock(options: KnowledgeTreeAutoLockOptions): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") return () => {};

  let disposed = false;
  let lastActivityAt = Date.now();
  let backgroundAt: number | null = null;
  let deadlineTimer: number | null = null;
  let backgroundTimer: number | null = null;
  let nativeListener: { remove: () => Promise<void> } | null = null;

  const clearTimer = (timer: number | null) => {
    if (timer !== null) window.clearTimeout(timer);
  };

  const cancelTimers = () => {
    clearTimer(deadlineTimer);
    clearTimer(backgroundTimer);
    deadlineTimer = null;
    backgroundTimer = null;
  };

  const lock = (reason: KnowledgeTreeFolderLockReason, broadcast = true) => {
    const snapshot = getFolderUnlockSessionSnapshot();
    if (snapshot.folderIds.size === 0 && reason !== "expired") return;
    cancelTimers();
    backgroundAt = null;
    lastActivityAt = Date.now();
    clearFolderUnlockTokens({ reason, broadcast });
  };

  const scheduleBackground = () => {
    clearTimer(backgroundTimer);
    backgroundTimer = null;
    if (!options.lockOnBackground || backgroundAt === null) return;
    if (getFolderUnlockSessionSnapshot().folderIds.size === 0) return;
    const remaining = FOLDER_BACKGROUND_LOCK_DELAY_MS - (Date.now() - backgroundAt);
    if (remaining <= 0) {
      lock("background");
      return;
    }
    backgroundTimer = window.setTimeout(() => lock("background"), remaining);
  };

  const scheduleDeadline = () => {
    clearTimer(deadlineTimer);
    deadlineTimer = null;
    const snapshot = getFolderUnlockSessionSnapshot();
    if (snapshot.folderIds.size === 0) return;

    const idleDeadline = options.idleMinutes > 0
      ? lastActivityAt + options.idleMinutes * 60 * 1000
      : Number.POSITIVE_INFINITY;
    const expiryDeadline = snapshot.earliestExpiresAt ?? Number.POSITIVE_INFINITY;
    const deadline = Math.min(idleDeadline, expiryDeadline);
    if (!Number.isFinite(deadline)) return;

    const reason: KnowledgeTreeFolderLockReason = expiryDeadline <= idleDeadline ? "expired" : "idle";
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      lock(reason);
      return;
    }
    deadlineTimer = window.setTimeout(() => lock(reason), remaining);
  };

  const scheduleAll = () => {
    scheduleDeadline();
    scheduleBackground();
  };

  const recordActivity = () => {
    if (backgroundAt !== null) return;
    lastActivityAt = Date.now();
    scheduleDeadline();
  };

  const enterBackground = () => {
    if (!options.lockOnBackground || getFolderUnlockSessionSnapshot().folderIds.size === 0) return;
    if (backgroundAt === null) backgroundAt = Date.now();
    scheduleBackground();
  };

  const enterForeground = () => {
    if (backgroundAt !== null && shouldLockAfterBackground(backgroundAt, Date.now())) {
      lock("background");
      return;
    }
    backgroundAt = null;
    recordActivity();
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") enterBackground();
    else enterForeground();
  };

  const onSessionChanged = () => {
    const snapshot = getFolderUnlockSessionSnapshot();
    if (snapshot.folderIds.size === 0) {
      cancelTimers();
      backgroundAt = null;
      return;
    }
    lastActivityAt = Date.now();
    if (document.visibilityState === "hidden") enterBackground();
    scheduleAll();
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key !== KNOWLEDGE_TREE_PASSWORD_LOCK_BROADCAST_KEY || !event.newValue) return;
    clearFolderUnlockTokens({ reason: "remote", broadcast: false });
  };

  const onAccountChanged = () => lock("account-changed", false);
  const activityEvents: Array<keyof WindowEventMap> = [
    "pointerdown",
    "keydown",
    "touchstart",
    "wheel",
    "scroll",
  ];

  activityEvents.forEach((eventName) => {
    window.addEventListener(eventName, recordActivity, { passive: true });
  });
  window.addEventListener("blur", enterBackground);
  window.addEventListener("focus", enterForeground);
  window.addEventListener("storage", onStorage);
  window.addEventListener("nowen:token-changed", onAccountChanged);
  window.addEventListener(KNOWLEDGE_TREE_PASSWORD_SESSION_CHANGED_EVENT, onSessionChanged);
  document.addEventListener("visibilitychange", onVisibilityChange);

  void import("@capacitor/app")
    .then(async ({ App }) => {
      const listener = await App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) enterForeground();
        else enterBackground();
      });
      if (disposed) await listener.remove();
      else nativeListener = listener;
    })
    .catch(() => {
      // Web / Electron 环境通过 visibility、blur 和 focus 覆盖生命周期。
    });

  scheduleAll();

  return () => {
    disposed = true;
    cancelTimers();
    activityEvents.forEach((eventName) => {
      window.removeEventListener(eventName, recordActivity);
    });
    window.removeEventListener("blur", enterBackground);
    window.removeEventListener("focus", enterForeground);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("nowen:token-changed", onAccountChanged);
    window.removeEventListener(KNOWLEDGE_TREE_PASSWORD_SESSION_CHANGED_EVENT, onSessionChanged);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    if (nativeListener) void nativeListener.remove();
  };
}
''', encoding="utf-8")

Path("frontend/src/components/FolderAutoLockSettings.tsx").write_text(r'''import React, { useEffect, useState } from "react";
import { Clock3, LockKeyhole, Monitor, Smartphone } from "lucide-react";

import {
  useUserPreferences,
  type FolderAutoLockMinutes,
} from "@/hooks/useUserPreferences";
import {
  FOLDER_AUTO_LOCK_OPTIONS,
  FOLDER_BACKGROUND_LOCK_DELAY_MS,
} from "@/lib/knowledgeTreeAutoLock";
import {
  clearFolderUnlockTokens,
  KNOWLEDGE_TREE_PASSWORD_SESSION_CHANGED_EVENT,
  loadUnlockedFolderIds,
} from "@/lib/knowledgeTreePassword";
import { toast } from "@/lib/toast";

export default function FolderAutoLockSettings() {
  const { prefs, setPref } = useUserPreferences();
  const [unlockedCount, setUnlockedCount] = useState(() => loadUnlockedFolderIds().size);

  useEffect(() => {
    const sync = () => setUnlockedCount(loadUnlockedFolderIds().size);
    window.addEventListener(KNOWLEDGE_TREE_PASSWORD_SESSION_CHANGED_EVENT, sync);
    return () => window.removeEventListener(KNOWLEDGE_TREE_PASSWORD_SESSION_CHANGED_EVENT, sync);
  }, []);

  const lockNow = () => {
    clearFolderUnlockTokens({ reason: "manual", broadcast: true });
    toast.success("已锁定所有密码文件夹");
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <LockKeyhole className="h-4 w-4 text-indigo-500" />
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">密码文件夹自动锁定</h3>
      </div>
      <p className="max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
        该设置跟随账号同步，在 Web、桌面端和手机端使用相同策略。服务端解锁令牌仍保留 12 小时绝对有效期上限。
      </p>

      <div className="max-w-2xl space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-700 dark:bg-zinc-800/40">
        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            <Clock3 size={15} />闲置多久后自动锁定
          </span>
          <select
            value={prefs.folderAutoLockMinutes}
            onChange={(event) => setPref(
              "folderAutoLockMinutes",
              Number(event.target.value) as FolderAutoLockMinutes,
            )}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {FOLDER_AUTO_LOCK_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <span className="block text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            鼠标、键盘、触摸和滚动会重新计时；正在编辑时不会因持续操作而突然锁定。
          </span>
        </label>

        <button
          type="button"
          role="switch"
          aria-checked={prefs.folderLockOnBackground}
          onClick={() => setPref("folderLockOnBackground", !prefs.folderLockOnBackground)}
          className="flex w-full items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-left dark:border-zinc-700 dark:bg-zinc-900"
        >
          <span className="min-w-0">
            <span className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              <Monitor size={15} /><Smartphone size={14} />切到后台后自动锁定
            </span>
            <span className="mt-1 block text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              页面隐藏、桌面窗口失焦或手机应用进入后台超过 {FOLDER_BACKGROUND_LOCK_DELAY_MS / 60000} 分钟后锁定。
            </span>
          </span>
          <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            prefs.folderLockOnBackground ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-600"
          }`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              prefs.folderLockOnBackground ? "translate-x-5" : "translate-x-0.5"
            }`} />
          </span>
        </button>

        <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-700 dark:bg-zinc-900">
          <div>
            <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              当前会话已解锁 {unlockedCount} 个密码文件夹
            </div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              立即锁定会同步通知同一账号已打开的其他 Web 标签页和桌面窗口。
            </div>
          </div>
          <button
            type="button"
            onClick={lockNow}
            disabled={unlockedCount === 0}
            className="shrink-0 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
          >
            立即全部锁定
          </button>
        </div>
      </div>
    </section>
  );
}
''', encoding="utf-8")

replace_once(
    "frontend/src/lib/userPreferenceAccountCache.ts",
    'export type EditorMode = "md" | "tiptap";\n',
    'export type EditorMode = "md" | "tiptap";\nexport type FolderAutoLockMinutes = 0 | 5 | 15 | 30 | 60;\n',
)
replace_once(
    "frontend/src/lib/userPreferenceAccountCache.ts",
    '  lockOnOpen: boolean;\n  readingDensity: ReadingDensity;\n',
    '  lockOnOpen: boolean;\n  folderAutoLockMinutes: FolderAutoLockMinutes;\n  folderLockOnBackground: boolean;\n  readingDensity: ReadingDensity;\n',
)
replace_once(
    "frontend/src/lib/userPreferenceAccountCache.ts",
    '  lockOnOpen: false,\n  readingDensity: "cozy",\n',
    '  lockOnOpen: false,\n  folderAutoLockMinutes: 15,\n  folderLockOnBackground: true,\n  readingDensity: "cozy",\n',
)
replace_once(
    "frontend/src/lib/userPreferenceAccountCache.ts",
    '    lockOnOpen: typeof raw.lockOnOpen === "boolean"\n      ? raw.lockOnOpen\n      : fallback.lockOnOpen,\n    readingDensity: raw.readingDensity === "compact" || raw.readingDensity === "cozy"\n',
    '    lockOnOpen: typeof raw.lockOnOpen === "boolean"\n      ? raw.lockOnOpen\n      : fallback.lockOnOpen,\n    folderAutoLockMinutes:\n      raw.folderAutoLockMinutes === 0 ||\n      raw.folderAutoLockMinutes === 5 ||\n      raw.folderAutoLockMinutes === 15 ||\n      raw.folderAutoLockMinutes === 30 ||\n      raw.folderAutoLockMinutes === 60\n        ? raw.folderAutoLockMinutes\n        : fallback.folderAutoLockMinutes,\n    folderLockOnBackground: typeof raw.folderLockOnBackground === "boolean"\n      ? raw.folderLockOnBackground\n      : fallback.folderLockOnBackground,\n    readingDensity: raw.readingDensity === "compact" || raw.readingDensity === "cozy"\n',
)

replace_once(
    "frontend/src/hooks/useUserPreferences.tsx",
    'import { api } from "@/lib/api";\n',
    'import { api } from "@/lib/api";\nimport { installKnowledgeTreeAutoLock } from "@/lib/knowledgeTreeAutoLock";\n',
)
replace_once(
    "frontend/src/hooks/useUserPreferences.tsx",
    '  EditorMode,\n  MarkdownViewMode,\n',
    '  EditorMode,\n  FolderAutoLockMinutes,\n  MarkdownViewMode,\n',
)
replace_once(
    "frontend/src/hooks/useUserPreferences.tsx",
    '  useEffect(() => {\n    const cls = "density-compact";\n    document.body.classList.toggle(cls, prefs.readingDensity === "compact");\n  }, [prefs.readingDensity]);\n\n',
    '  useEffect(() => {\n    const cls = "density-compact";\n    document.body.classList.toggle(cls, prefs.readingDensity === "compact");\n  }, [prefs.readingDensity]);\n\n  // 密码文件夹的闲置/后台锁定策略由账号偏好统一驱动。该 Provider 同时服务\n  // Web、Electron 和 Capacitor，因此三端共享同一套生命周期与同步行为。\n  useEffect(() => installKnowledgeTreeAutoLock({\n    idleMinutes: prefs.folderAutoLockMinutes,\n    lockOnBackground: prefs.folderLockOnBackground,\n  }), [prefs.folderAutoLockMinutes, prefs.folderLockOnBackground]);\n\n',
)

replace_once(
    "frontend/src/components/SecuritySettings.tsx",
    'import QRCode from "@/components/ui/QRCode";\n',
    'import QRCode from "@/components/ui/QRCode";\nimport FolderAutoLockSettings from "@/components/FolderAutoLockSettings";\n',
)
replace_once(
    "frontend/src/components/SecuritySettings.tsx",
    '      {!isDemo && <TwoFactorSection key={`2fa-${currentUserId}`} />}\n      <SessionsSection key={`sess-${currentUserId}`} />\n',
    '      {!isDemo && <TwoFactorSection key={`2fa-${currentUserId}`} />}\n      <FolderAutoLockSettings key={`folder-lock-${currentUserId}`} />\n      <SessionsSection key={`sess-${currentUserId}`} />\n',
)

replace_once(
    "backend/src/routes/user-preferences-sync.ts",
    'type EditorMode = "md" | "tiptap";\n',
    'type EditorMode = "md" | "tiptap";\ntype FolderAutoLockMinutes = 0 | 5 | 15 | 30 | 60;\n',
)
replace_once(
    "backend/src/routes/user-preferences-sync.ts",
    '  lockOnOpen: boolean;\n  showNotesInNotebookTree: boolean;\n',
    '  lockOnOpen: boolean;\n  folderAutoLockMinutes: FolderAutoLockMinutes;\n  folderLockOnBackground: boolean;\n  showNotesInNotebookTree: boolean;\n',
)
replace_once(
    "backend/src/routes/user-preferences-sync.ts",
    '  lockOnOpen: false,\n  showNotesInNotebookTree: false,\n',
    '  lockOnOpen: false,\n  folderAutoLockMinutes: 15,\n  folderLockOnBackground: true,\n  showNotesInNotebookTree: false,\n',
)
replace_once(
    "backend/src/routes/user-preferences-sync.ts",
    '    case "lockOnOpen":\n    case "showNotesInNotebookTree":\n',
    '    case "lockOnOpen":\n    case "folderLockOnBackground":\n    case "showNotesInNotebookTree":\n',
)
replace_once(
    "backend/src/routes/user-preferences-sync.ts",
    '    case "readingDensity":\n      return (value === "cozy" || value === "compact" ? value : fallback) as SyncedUserPreferences[K];\n',
    '    case "folderAutoLockMinutes":\n      return (\n        value === 0 || value === 5 || value === 15 || value === 30 || value === 60\n          ? value\n          : fallback\n      ) as SyncedUserPreferences[K];\n    case "readingDensity":\n      return (value === "cozy" || value === "compact" ? value : fallback) as SyncedUserPreferences[K];\n',
)

replace_once(
    "backend/tests/user-preferences.test.ts",
    '    noteTitleAsAppTitle: true,\n    showNotesInNotebookTree: true,\n    markdownDefaultViewMode: "split",\n',
    '    noteTitleAsAppTitle: true,\n    folderAutoLockMinutes: 30,\n    folderLockOnBackground: false,\n    showNotesInNotebookTree: true,\n    markdownDefaultViewMode: "split",\n',
)
replace_once(
    "backend/tests/user-preferences.test.ts",
    '  assert.equal(put.json.noteTitleAsAppTitle, true);\n  assert.equal(put.json.showNotesInNotebookTree, true);\n',
    '  assert.equal(put.json.noteTitleAsAppTitle, true);\n  assert.equal(put.json.folderAutoLockMinutes, 30);\n  assert.equal(put.json.folderLockOnBackground, false);\n  assert.equal(put.json.showNotesInNotebookTree, true);\n',
)
replace_once(
    "backend/tests/user-preferences.test.ts",
    '  assert.equal(get.json.noteTitleAsAppTitle, true);\n  assert.equal(get.json.showNotesInNotebookTree, true);\n',
    '  assert.equal(get.json.noteTitleAsAppTitle, true);\n  assert.equal(get.json.folderAutoLockMinutes, 30);\n  assert.equal(get.json.folderLockOnBackground, false);\n  assert.equal(get.json.showNotesInNotebookTree, true);\n',
)
replace_once(
    "backend/tests/user-preferences.test.ts",
    'test("does not leak preferences across users", async () => {\n',
    'test("rejects unsupported folder auto-lock intervals", async () => {\n  const result = await requestJson("PATCH", "/user-preferences", {\n    folderAutoLockMinutes: 10,\n  });\n  assert.equal(result.status, 400);\n  assert.equal(result.json.code, "INVALID_USER_PREFERENCE");\n});\n\ntest("does not leak preferences across users", async () => {\n',
)

Path("frontend/src/lib/__tests__/knowledgeTreeAutoLock.test.ts").write_text(r'''// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  installKnowledgeTreeAutoLock,
  shouldLockAfterBackground,
  shouldLockAfterIdle,
} from "@/lib/knowledgeTreeAutoLock";
import {
  KNOWLEDGE_TREE_PASSWORD_LOCKED_EVENT,
  loadUnlockedFolderIds,
  rememberUnlockedFolder,
} from "@/lib/knowledgeTreePassword";
import { normalizeUserPreferences } from "@/lib/userPreferenceAccountCache";

function token(payload: Record<string, unknown>): string {
  const encoded = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `header.${encoded}.signature`;
}

describe("knowledge tree folder auto lock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-31T08:00:00.000Z"));
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("nowen-token", token({ userId: "user-1" }));
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("locks an unlocked folder after the configured idle interval", () => {
    rememberUnlockedFolder("folder-1", token({
      userId: "user-1",
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    }));
    const reasons: string[] = [];
    const listener = (event: Event) => reasons.push((event as CustomEvent).detail.reason);
    window.addEventListener(KNOWLEDGE_TREE_PASSWORD_LOCKED_EVENT, listener);

    const cleanup = installKnowledgeTreeAutoLock({ idleMinutes: 5, lockOnBackground: true });
    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(loadUnlockedFolderIds().size).toBe(0);
    expect(reasons).toContain("idle");
    cleanup();
    window.removeEventListener(KNOWLEDGE_TREE_PASSWORD_LOCKED_EVENT, listener);
  });

  it("locks after the app stays in the background for five minutes", () => {
    rememberUnlockedFolder("folder-2", token({
      userId: "user-1",
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    }));
    const cleanup = installKnowledgeTreeAutoLock({ idleMinutes: 60, lockOnBackground: true });

    window.dispatchEvent(new Event("blur"));
    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(loadUnlockedFolderIds().size).toBe(0);
    cleanup();
  });

  it("keeps the session unlocked in background when that option is disabled", () => {
    rememberUnlockedFolder("folder-3", token({
      userId: "user-1",
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    }));
    const cleanup = installKnowledgeTreeAutoLock({ idleMinutes: 60, lockOnBackground: false });

    window.dispatchEvent(new Event("blur"));
    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(loadUnlockedFolderIds().has("folder-3")).toBe(true);
    cleanup();
  });

  it("normalizes the synced account preference to safe supported values", () => {
    expect(normalizeUserPreferences({ folderAutoLockMinutes: 30 }).folderAutoLockMinutes).toBe(30);
    expect(normalizeUserPreferences({ folderAutoLockMinutes: 10 }).folderAutoLockMinutes).toBe(15);
    expect(normalizeUserPreferences({ folderLockOnBackground: false }).folderLockOnBackground).toBe(false);
  });

  it("exposes deterministic idle and background deadline helpers", () => {
    expect(shouldLockAfterIdle(0, 5 * 60 * 1000, 5)).toBe(true);
    expect(shouldLockAfterIdle(0, 60 * 60 * 1000, 0)).toBe(false);
    expect(shouldLockAfterBackground(0, 5 * 60 * 1000)).toBe(true);
  });
});
''', encoding="utf-8")

print("folder auto-lock implementation applied")

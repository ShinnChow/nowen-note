from pathlib import Path


def replace_once(source: str, anchor: str, replacement: str, label: str) -> str:
    if anchor not in source:
        raise RuntimeError(f"{label} anchor not found")
    return source.replace(anchor, replacement, 1)


# Frontend API
api_path = Path("frontend/src/lib/api.impl.ts")
api = api_path.read_text()
if "getOrCreateWorkspace:" not in api:
    anchor = '''    /** 检查今日日记是否存在（只读，不创建） */
    checkToday: (date?: string) => {
      const qs = date ? `?date=${encodeURIComponent(date)}` : "";
      return request<{ exists: boolean; noteId: string | null; title: string | null }>(`/journals/check${qs}`);
    },
'''
    addition = '''    /** 获取或创建当前工作区的共享日期日记 */
    getOrCreateWorkspace: async (workspaceId: string, localDate: string) => {
      const result = await request<{
        id: string;
        title: string;
        existed: boolean;
        canWrite: boolean;
        role: string;
        workspaceId: string;
        scope: "workspace";
        [key: string]: any;
      }>(`/journals/workspace/${encodeURIComponent(workspaceId)}/resolve`, {
        method: "POST",
        body: JSON.stringify({ localDate }),
      });
      if (typeof window !== "undefined" && result.canWrite) {
        window.dispatchEvent(new CustomEvent("nowen:knowledge-tree-changed", {
          detail: {
            reason: result.existed ? "workspace-journal-repaired" : "workspace-journal-created",
            workspaceId,
          },
        }));
      }
      return result;
    },
    /** 检查工作区共享日记是否存在；只读成员也可调用 */
    checkWorkspace: (workspaceId: string, date?: string) => {
      const qs = date ? `?date=${encodeURIComponent(date)}` : "";
      return request<{
        exists: boolean;
        noteId: string | null;
        title: string | null;
        canWrite: boolean;
        role: string;
        scope: "workspace";
        workspaceId: string;
      }>(`/journals/workspace/${encodeURIComponent(workspaceId)}/check${qs}`);
    },
'''
    api = replace_once(api, anchor, anchor + addition, "workspace journal frontend api")
    api_path.write_text(api)


# Daily journal UI
view_path = Path("frontend/src/components/daily-records/DailyJournalView.tsx")
view = view_path.read_text()

if 'from "@/lib/journalScope"' not in view:
    anchor = 'import { localDateRangeToUtcSqlBounds, parseServerTime } from "@/lib/dateTime";\n'
    addition = '''import {
  checkJournalForScope,
  getOrCreateJournalForScope,
  resolveJournalScope,
  type JournalScope,
} from "@/lib/journalScope";
'''
    view = replace_once(view, anchor, anchor + addition, "journal scope import")

if "journalScope: JournalScope;" not in view:
    view = replace_once(
        view,
        '''interface DailyJournalViewProps {
  selectedDate: string;
  onDateChange: (dateKey: string) => void;
  onWriteMoment: () => void;
}
''',
        '''interface DailyJournalViewProps {
  selectedDate: string;
  onDateChange: (dateKey: string) => void;
  onWriteMoment: () => void;
  journalScope: JournalScope;
  onJournalScopeChange: (scope: JournalScope) => void;
  activeWorkspaceId: string | null;
}
''',
        "daily journal props",
    )

if "  journalScope," not in view:
    view = replace_once(
        view,
        '''export default function DailyJournalView({
  selectedDate,
  onDateChange,
  onWriteMoment,
}: DailyJournalViewProps) {
''',
        '''export default function DailyJournalView({
  selectedDate,
  onDateChange,
  onWriteMoment,
  journalScope,
  onJournalScopeChange,
  activeWorkspaceId,
}: DailyJournalViewProps) {
''',
        "daily journal signature",
    )

if "journalCanWrite" not in view:
    anchor = '  const [journalNode, setJournalNode] = useState<KnowledgeTreeNode | null>(null);\n'
    view = replace_once(
        view,
        anchor,
        anchor + '  const [journalCanWrite, setJournalCanWrite] = useState(true);\n'
        + '  const [journalRole, setJournalRole] = useState<string>("owner");\n',
        "journal permission state",
    )

if "checkJournalForScope(selectedDate, journalScope)" not in view:
    view = replace_once(
        view,
        '      const [check, momentResult, treeResult] = await Promise.all([\n',
        '      const treeWorkspaceId = journalScope.kind === "workspace"\n'
        '        ? journalScope.workspaceId\n'
        '        : "personal";\n'
        '      const [check, momentResult, treeResult] = await Promise.all([\n',
        "scope load prefix",
    )
    view = replace_once(
        view,
        '        api.journals.checkToday(selectedDate),\n',
        '        checkJournalForScope(selectedDate, journalScope),\n',
        "scope check call",
    )
    view = replace_once(
        view,
        '        knowledgeTreeApi.listForWorkspace("personal").catch(() => ({ nodes: [] as KnowledgeTreeNode[] })),\n',
        '        knowledgeTreeApi.listForWorkspace(treeWorkspaceId).catch(() => ({ nodes: [] as KnowledgeTreeNode[] })),\n',
        "scope tree call",
    )
    view = replace_once(
        view,
        '      setMoments(momentResult.items || []);\n',
        '      setMoments(momentResult.items || []);\n'
        '      setJournalCanWrite(check.canWrite);\n'
        '      setJournalRole(\n'
        '        typeof check.role === "string"\n'
        '          ? check.role\n'
        '          : journalScope.kind === "workspace" ? "viewer" : "owner",\n'
        '      );\n',
        "scope permission state",
    )
    view = replace_once(
        view,
        '  }, [selectedDate]);\n\n  useEffect(() => {\n    void loadDay();\n  }, [loadDay, reloadToken]);\n',
        '  }, [journalScope, selectedDate]);\n\n  useEffect(() => {\n    void loadDay();\n  }, [loadDay, reloadToken]);\n',
        "scope load dependencies",
    )

if "getOrCreateJournalForScope(selectedDate, journalScope)" not in view:
    view = replace_once(
        view,
        '      const result = await api.journals.getOrCreateToday(selectedDate);\n',
        '      const result = await getOrCreateJournalForScope(selectedDate, journalScope);\n',
        "scope create call",
    )
    view = replace_once(
        view,
        '      setJournal(note);\n      openNote(note);\n      toast.success(result.existed ? "已打开该日日记" : "日记已创建");\n',
        '      setJournal(note);\n'
        '      setJournalCanWrite(result.canWrite);\n'
        '      openNote(note);\n'
        '      toast.success(result.existed\n'
        '        ? journalScope.kind === "workspace" ? "已打开工作区日记" : "已打开该日日记"\n'
        '        : journalScope.kind === "workspace" ? "工作区日记已创建" : "日记已创建");\n',
        "scope create result",
    )
    view = replace_once(
        view,
        '  }, [openNote, selectedDate]);\n',
        '  }, [journalScope, openNote, selectedDate]);\n',
        "scope create dependencies",
    )

if 'toast.info("当前工作区角色只能查看，无法创建子页面")' not in view:
    view = replace_once(
        view,
        '''  const createChildPage = useCallback(async () => {
    if (!journalNode) {
''',
        '''  const createChildPage = useCallback(async () => {
    if (!journalCanWrite) {
      toast.info("当前工作区角色只能查看，无法创建子页面");
      return;
    }
    if (!journalNode) {
''',
        "child permission guard",
    )
    view = replace_once(
        view,
        '      const node = await knowledgeTreeApi.createForWorkspace("personal", {\n',
        '      const targetWorkspaceId = journalScope.kind === "workspace"\n'
        '        ? journalScope.workspaceId\n'
        '        : "personal";\n'
        '      const node = await knowledgeTreeApi.createForWorkspace(targetWorkspaceId, {\n',
        "scope child creation",
    )
    view = replace_once(
        view,
        '  }, [journalNode, openNote]);\n',
        '  }, [journalCanWrite, journalNode, journalScope, openNote]);\n',
        "child dependencies",
    )

if 'data-journal-scope-switch=""' not in view:
    anchor = '        <main className="min-w-0 space-y-5">\n'
    switch = '''          {activeWorkspaceId && (
            <div
              data-journal-scope-switch=""
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-app-border bg-app-surface px-3 py-2.5"
            >
              <div>
                <div className="text-xs font-semibold text-tx-primary">日记作用域</div>
                <div className="mt-0.5 text-[11px] text-tx-tertiary">个人沉淀与工作区协作互不覆盖</div>
              </div>
              <div className="flex rounded-lg bg-app-hover/70 p-1">
                <button
                  type="button"
                  onClick={() => onJournalScopeChange(resolveJournalScope("personal"))}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium",
                    journalScope.kind === "personal"
                      ? "bg-app-surface text-accent-primary shadow-sm"
                      : "text-tx-tertiary hover:text-tx-primary",
                  )}
                >
                  个人日记
                </button>
                <button
                  type="button"
                  onClick={() => onJournalScopeChange(resolveJournalScope(activeWorkspaceId))}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium",
                    journalScope.kind === "workspace"
                      ? "bg-app-surface text-accent-primary shadow-sm"
                      : "text-tx-tertiary hover:text-tx-primary",
                  )}
                >
                  工作区日记
                </button>
              </div>
            </div>
          )}
'''
    view = replace_once(view, anchor, anchor + switch, "journal scope switch")

if '{journalScope.kind === "personal" && (' not in view:
    organize = '''              <button
                type="button"
                onClick={() => void organizeArchive()}
                disabled={organizingArchive}
                className="ml-auto flex items-center gap-1.5 rounded-lg border border-app-border px-2.5 py-1.5 text-xs font-medium text-tx-secondary hover:bg-app-hover hover:text-tx-primary disabled:opacity-60"
                title="将已有日记整理到个人日记 / 年 / 月目录"
              >
                {organizingArchive ? <Loader2 size={14} className="animate-spin" /> : <FolderTree size={14} />}
                <span className="hidden sm:inline">整理目录</span>
              </button>
'''
    view = replace_once(
        view,
        organize,
        '              {journalScope.kind === "personal" && (\n                <>\n'
        + organize
        + '                </>\n              )}\n',
        "personal organize button",
    )
    cleanup = '''              <button
                type="button"
                onClick={() => void cleanupLegacyArchive()}
                disabled={cleaningArchive || organizingArchive}
                className="flex items-center gap-1.5 rounded-lg border border-app-border px-2.5 py-1.5 text-xs font-medium text-tx-secondary hover:bg-app-hover hover:text-tx-primary disabled:opacity-60"
                title="预览并安全清理迁移后遗留的空旧目录"
              >
                {cleaningArchive ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span className="hidden lg:inline">清理空目录</span>
              </button>
'''
    view = replace_once(
        view,
        cleanup,
        '              {journalScope.kind === "personal" && (\n'
        + cleanup
        + '              )}\n',
        "personal cleanup button",
    )
    view = replace_once(
        view,
        '              {lastCleanupId && (\n',
        '              {journalScope.kind === "personal" && lastCleanupId && (\n',
        "personal restore button",
    )

if "工作区协作" not in view:
    anchor = '''              {isToday && (
                <span className="rounded-full bg-accent-primary/10 px-2 py-0.5 text-xs font-medium text-accent-primary">今天</span>
              )}
'''
    badge = '''              {journalScope.kind === "workspace" && (
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  journalCanWrite
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-300",
                )}>
                  {journalCanWrite ? "工作区协作" : `${journalRole} · 只读`}
                </span>
              )}
'''
    view = replace_once(view, anchor, anchor + badge, "workspace permission badge")

view = view.replace(
    '                    个人日记 / {selectedDateObject.getFullYear()}年 / {selectedDateObject.getFullYear()}年{String(selectedDateObject.getMonth() + 1).padStart(2, "0")}月 / {selectedDate}\n',
    '                    {journalScope.kind === "workspace" ? "工作区日记" : "个人日记"} / {selectedDateObject.getFullYear()}年 / {selectedDateObject.getFullYear()}年{String(selectedDateObject.getMonth() + 1).padStart(2, "0")}月 / {selectedDate}\n',
    1,
)

if "disabled={creating || !journalCanWrite}" not in view:
    view = replace_once(
        view,
        '''                    disabled={creating}
                    className="mt-4 flex items-center gap-1.5 rounded-lg bg-accent-primary px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
                  >
                    {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    创建该日日记
''',
        '''                    disabled={creating || !journalCanWrite}
                    className="mt-4 flex items-center gap-1.5 rounded-lg bg-accent-primary px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
                  >
                    {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    {journalCanWrite ? "创建该日日记" : "当前角色只能查看"}
''',
        "read-only journal create",
    )

if "disabled={!journalCanWrite}" not in view:
    view = replace_once(
        view,
        '              <button type="button" onClick={() => void createChildPage()} className="w-full rounded-xl border border-dashed border-app-border px-3 py-5 text-xs text-tx-tertiary hover:bg-app-hover">在该日日记下新建工作记录或专题页面</button>\n',
        '''              <button
                type="button"
                onClick={() => void createChildPage()}
                disabled={!journalCanWrite}
                className="w-full rounded-xl border border-dashed border-app-border px-3 py-5 text-xs text-tx-tertiary hover:bg-app-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {journalCanWrite ? "在该日日记下新建工作记录或专题页面" : "当前角色只能查看子页面"}
              </button>
''',
        "read-only child button",
    )

view_path.write_text(view)

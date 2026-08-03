import { readFileSync, writeFileSync } from "node:fs";

function replaceOnce(source, anchor, replacement, label) {
  if (!source.includes(anchor)) throw new Error(`${label} anchor not found`);
  return source.replace(anchor, replacement);
}

// Frontend API methods.
{
  const path = "frontend/src/lib/api.impl.ts";
  let source = readFileSync(path, "utf8");
  if (!source.includes("getOrCreateWorkspace:")) {
    const anchor = `    /** 检查今日日记是否存在（只读，不创建） */\n    checkToday: (date?: string) => {\n      const qs = date ? \`?date=\${encodeURIComponent(date)}\` : "";\n      return request<{ exists: boolean; noteId: string | null; title: string | null }>(\`/journals/check\${qs}\`);\n    },\n`;
    const addition = `    /** 获取或创建当前工作区的共享日期日记 */\n    getOrCreateWorkspace: async (workspaceId: string, localDate: string) => {\n      const result = await request<{\n        id: string;\n        title: string;\n        existed: boolean;\n        canWrite: boolean;\n        role: string;\n        workspaceId: string;\n        scope: "workspace";\n        [key: string]: any;\n      }>(\`/journals/workspace/\${encodeURIComponent(workspaceId)}/resolve\`, {\n        method: "POST",\n        body: JSON.stringify({ localDate }),\n      });\n      if (typeof window !== "undefined" && result.canWrite) {\n        window.dispatchEvent(new CustomEvent("nowen:knowledge-tree-changed", {\n          detail: { reason: result.existed ? "workspace-journal-repaired" : "workspace-journal-created", workspaceId },\n        }));\n      }\n      return result;\n    },\n    /** 检查工作区共享日记是否存在；只读成员也可调用 */\n    checkWorkspace: (workspaceId: string, date?: string) => {\n      const qs = date ? \`?date=\${encodeURIComponent(date)}\` : "";\n      return request<{\n        exists: boolean;\n        noteId: string | null;\n        title: string | null;\n        canWrite: boolean;\n        role: string;\n        scope: "workspace";\n        workspaceId: string;\n      }>(\`/journals/workspace/\${encodeURIComponent(workspaceId)}/check\${qs}\`);\n    },\n`;
    source = replaceOnce(source, anchor, `${anchor}${addition}`, "workspace journal frontend api");
  }
  writeFileSync(path, source);
}

// Daily journal scope-aware UI.
{
  const path = "frontend/src/components/daily-records/DailyJournalView.tsx";
  let source = readFileSync(path, "utf8");

  if (!source.includes('from "@/lib/journalScope"')) {
    const anchor = `import { localDateRangeToUtcSqlBounds, parseServerTime } from "@/lib/dateTime";\n`;
    const addition = `import {\n  checkJournalForScope,\n  getOrCreateJournalForScope,\n  resolveJournalScope,\n  type JournalScope,\n} from "@/lib/journalScope";\n`;
    source = replaceOnce(source, anchor, `${anchor}${addition}`, "journal scope import");
  }

  source = replaceOnce(
    source,
    `interface DailyJournalViewProps {\n  selectedDate: string;\n  onDateChange: (dateKey: string) => void;\n  onWriteMoment: () => void;\n}\n`,
    `interface DailyJournalViewProps {\n  selectedDate: string;\n  onDateChange: (dateKey: string) => void;\n  onWriteMoment: () => void;\n  journalScope: JournalScope;\n  onJournalScopeChange: (scope: JournalScope) => void;\n  activeWorkspaceId: string | null;\n}\n`,
    "daily journal props",
  );

  source = replaceOnce(
    source,
    `export default function DailyJournalView({\n  selectedDate,\n  onDateChange,\n  onWriteMoment,\n}: DailyJournalViewProps) {\n`,
    `export default function DailyJournalView({\n  selectedDate,\n  onDateChange,\n  onWriteMoment,\n  journalScope,\n  onJournalScopeChange,\n  activeWorkspaceId,\n}: DailyJournalViewProps) {\n`,
    "daily journal destructuring",
  );

  if (!source.includes("journalCanWrite")) {
    const anchor = `  const [journalNode, setJournalNode] = useState<KnowledgeTreeNode | null>(null);\n`;
    source = replaceOnce(
      source,
      anchor,
      `${anchor}  const [journalCanWrite, setJournalCanWrite] = useState(true);\n  const [journalRole, setJournalRole] = useState<string>("owner");\n`,
      "journal permission state",
    );
  }

  source = replaceOnce(
    source,
    `      const [check, momentResult, treeResult] = await Promise.all([\n        api.journals.checkToday(selectedDate),\n        api.getDiaryTimeline(undefined, 100, range || undefined),\n        knowledgeTreeApi.listForWorkspace("personal").catch(() => ({ nodes: [] as KnowledgeTreeNode[] })),\n      ]);\n\n      setMoments(momentResult.items || []);\n`,
    `      const treeWorkspaceId = journalScope.kind === "workspace"\n        ? journalScope.workspaceId\n        : "personal";\n      const [check, momentResult, treeResult] = await Promise.all([\n        checkJournalForScope(selectedDate, journalScope),\n        api.getDiaryTimeline(undefined, 100, range || undefined),\n        knowledgeTreeApi.listForWorkspace(treeWorkspaceId).catch(() => ({ nodes: [] as KnowledgeTreeNode[] })),\n      ]);\n\n      setMoments(momentResult.items || []);\n      setJournalCanWrite(check.canWrite);\n      setJournalRole(typeof check.role === "string" ? check.role : journalScope.kind === "workspace" ? "viewer" : "owner");\n`,
    "scope-aware load",
  );
  source = replaceOnce(
    source,
    `  }, [selectedDate]);\n\n  useEffect(() => {\n    void loadDay();\n  }, [loadDay, reloadToken]);\n`,
    `  }, [journalScope, selectedDate]);\n\n  useEffect(() => {\n    void loadDay();\n  }, [loadDay, reloadToken]);\n`,
    "load dependencies",
  );

  source = replaceOnce(
    source,
    `      const result = await api.journals.getOrCreateToday(selectedDate);\n      const note = await api.getNote(result.id);\n      setJournal(note);\n      openNote(note);\n      toast.success(result.existed ? "已打开该日日记" : "日记已创建");\n`,
    `      const result = await getOrCreateJournalForScope(selectedDate, journalScope);\n      const note = await api.getNote(result.id);\n      setJournal(note);\n      setJournalCanWrite(result.canWrite);\n      openNote(note);\n      toast.success(result.existed\n        ? journalScope.kind === "workspace" ? "已打开工作区日记" : "已打开该日日记"\n        : journalScope.kind === "workspace" ? "工作区日记已创建" : "日记已创建");\n`,
    "scope-aware create",
  );
  source = replaceOnce(
    source,
    `  }, [openNote, selectedDate]);\n`,
    `  }, [journalScope, openNote, selectedDate]);\n`,
    "create dependencies",
  );

  source = replaceOnce(
    source,
    `  const createChildPage = useCallback(async () => {\n    if (!journalNode) {\n      toast.info("请先创建日记，稍后再添加子页面");\n      return;\n    }\n`,
    `  const createChildPage = useCallback(async () => {\n    if (!journalCanWrite) {\n      toast.info("当前工作区角色只能查看，无法创建子页面");\n      return;\n    }\n    if (!journalNode) {\n      toast.info("请先创建日记，稍后再添加子页面");\n      return;\n    }\n`,
    "child permission guard",
  );
  source = replaceOnce(
    source,
    `      const node = await knowledgeTreeApi.createForWorkspace("personal", {\n`,
    `      const targetWorkspaceId = journalScope.kind === "workspace"\n        ? journalScope.workspaceId\n        : "personal";\n      const node = await knowledgeTreeApi.createForWorkspace(targetWorkspaceId, {\n`,
    "scope-aware child creation",
  );
  source = replaceOnce(
    source,
    `  }, [journalNode, openNote]);\n`,
    `  }, [journalCanWrite, journalNode, journalScope, openNote]);\n`,
    "child dependencies",
  );

  if (!source.includes('data-journal-scope-switch=""')) {
    const anchor = `        <main className="min-w-0 space-y-5">\n`;
    const scopeSwitch = `          {activeWorkspaceId && (\n            <div\n              data-journal-scope-switch=""\n              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-app-border bg-app-surface px-3 py-2.5"\n            >\n              <div>\n                <div className="text-xs font-semibold text-tx-primary">日记作用域</div>\n                <div className="mt-0.5 text-[11px] text-tx-tertiary">个人沉淀与工作区协作互不覆盖</div>\n              </div>\n              <div className="flex rounded-lg bg-app-hover/70 p-1">\n                <button\n                  type="button"\n                  onClick={() => onJournalScopeChange(resolveJournalScope("personal"))}\n                  className={cn(\n                    "rounded-md px-3 py-1.5 text-xs font-medium",\n                    journalScope.kind === "personal"\n                      ? "bg-app-surface text-accent-primary shadow-sm"\n                      : "text-tx-tertiary hover:text-tx-primary",\n                  )}\n                >\n                  个人日记\n                </button>\n                <button\n                  type="button"\n                  onClick={() => onJournalScopeChange(resolveJournalScope(activeWorkspaceId))}\n                  className={cn(\n                    "rounded-md px-3 py-1.5 text-xs font-medium",\n                    journalScope.kind === "workspace"\n                      ? "bg-app-surface text-accent-primary shadow-sm"\n                      : "text-tx-tertiary hover:text-tx-primary",\n                  )}\n                >\n                  工作区日记\n                </button>\n              </div>\n            </div>\n          )}\n`;
    source = replaceOnce(source, anchor, `${anchor}${scopeSwitch}`, "journal scope switch");
  }

  const managementStart = `              <button\n                type="button"\n                onClick={() => void organizeArchive()}\n`;
  if (!source.includes('{journalScope.kind === "personal" && (\n                <>')) {
    source = replaceOnce(
      source,
      managementStart,
      `              {journalScope.kind === "personal" && (\n                <>\n${managementStart}`,
      "personal management start",
    );
    const managementEnd = `              {lastCleanupId && (\n                <button\n                  type="button"\n                  onClick={() => void restoreLegacyArchiveCleanup()}\n                  disabled={restoringCleanup}\n                  className="flex items-center gap-1.5 rounded-lg border border-app-border px-2.5 py-1.5 text-xs font-medium text-accent-primary hover:bg-accent-primary/10 disabled:opacity-60"\n                  title="撤销上一次旧目录清理"\n                >\n                  {restoringCleanup ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />}\n                  <span className="hidden lg:inline">撤销清理</span>\n                </button>\n              )}\n`;
    source = replaceOnce(
      source,
      managementEnd,
      `${managementEnd}                </>\n              )}\n`,
      "personal management end",
    );
  }

  source = replaceOnce(
    source,
    `              {isToday && (\n                <span className="rounded-full bg-accent-primary/10 px-2 py-0.5 text-xs font-medium text-accent-primary">今天</span>\n              )}\n`,
    `              {isToday && (\n                <span className="rounded-full bg-accent-primary/10 px-2 py-0.5 text-xs font-medium text-accent-primary">今天</span>\n              )}\n              {journalScope.kind === "workspace" && (\n                <span className={cn(\n                  "rounded-full px-2 py-0.5 text-xs font-medium",\n                  journalCanWrite\n                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"\n                    : "bg-amber-500/10 text-amber-700 dark:text-amber-300",\n                )}>\n                  {journalCanWrite ? "工作区协作" : `${journalRole} · 只读`}\n                </span>\n              )}\n`,
    "workspace permission badge",
  );

  source = replaceOnce(
    source,
    `                    个人日记 / {selectedDateObject.getFullYear()}年 / {selectedDateObject.getFullYear()}年{String(selectedDateObject.getMonth() + 1).padStart(2, "0")}月 / {selectedDate}\n`,
    `                    {journalScope.kind === "workspace" ? "工作区日记" : "个人日记"} / {selectedDateObject.getFullYear()}年 / {selectedDateObject.getFullYear()}年{String(selectedDateObject.getMonth() + 1).padStart(2, "0")}月 / {selectedDate}\n`,
    "scope path label",
  );

  source = replaceOnce(
    source,
    `                    disabled={creating}\n                    className="mt-4 flex items-center gap-1.5 rounded-lg bg-accent-primary px-4 py-2 text-xs font-medium text-white disabled:opacity-60"\n                  >\n                    {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}\n                    创建该日日记\n`,
    `                    disabled={creating || !journalCanWrite}\n                    className="mt-4 flex items-center gap-1.5 rounded-lg bg-accent-primary px-4 py-2 text-xs font-medium text-white disabled:opacity-60"\n                  >\n                    {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}\n                    {journalCanWrite ? "创建该日日记" : "当前角色只能查看"}\n`,
    "read-only create button",
  );

  source = replaceOnce(
    source,
    `              <button type="button" onClick={() => void createChildPage()} className="w-full rounded-xl border border-dashed border-app-border px-3 py-5 text-xs text-tx-tertiary hover:bg-app-hover">在该日日记下新建工作记录或专题页面</button>\n`,
    `              <button\n                type="button"\n                onClick={() => void createChildPage()}\n                disabled={!journalCanWrite}\n                className="w-full rounded-xl border border-dashed border-app-border px-3 py-5 text-xs text-tx-tertiary hover:bg-app-hover disabled:cursor-not-allowed disabled:opacity-60"\n              >\n                {journalCanWrite ? "在该日日记下新建工作记录或专题页面" : "当前角色只能查看子页面"}\n              </button>\n`,
    "read-only child button",
  );

  writeFileSync(path, source);
}

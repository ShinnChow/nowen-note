import { readFileSync, writeFileSync } from "node:fs";

// Deterministic one-shot integration patch. Safe to run repeatedly.
const apiPath = "frontend/src/lib/api.impl.ts";
let apiSource = readFileSync(apiPath, "utf8");
const checkAnchor = `    checkToday: (date?: string) => {
      const qs = date ? \`?date=\${encodeURIComponent(date)}\` : "";
      return request<{ exists: boolean; noteId: string | null; title: string | null }>(\`/journals/check\${qs}\`);
    },
    /** 获取日记列表 */`;
const checkReplacement = `    checkToday: (date?: string) => {
      const qs = date ? \`?date=\${encodeURIComponent(date)}\` : "";
      return request<{ exists: boolean; noteId: string | null; title: string | null }>(\`/journals/check\${qs}\`);
    },
    /** 将已有日记迁移到真实的个人日记 / 年 / 月目录 */
    organizeArchive: () => request<{
      success: boolean;
      total: number;
      organized: number;
      moved: number;
      alreadyOrganized: number;
      skippedInvalidDate: number;
      skippedWorkspaceJournal: number;
      foldersCreated: number;
      foldersAdopted: number;
      foldersReused: number;
      rootNotebookId: string | null;
    }>("/journals/organize", { method: "POST" }),
    /** 获取日记列表 */`;
if (!apiSource.includes("organizeArchive: ()")) {
  if (!apiSource.includes(checkAnchor)) throw new Error("frontend journals API anchor not found");
  apiSource = apiSource.replace(checkAnchor, checkReplacement);
}
writeFileSync(apiPath, apiSource);

const viewPath = "frontend/src/components/daily-records/DailyJournalView.tsx";
let viewSource = readFileSync(viewPath, "utf8");
viewSource = viewSource.replace(
  "  FileText,\n  Link2,",
  "  FileText,\n  FolderTree,\n  Link2,",
);
viewSource = viewSource.replace(
  "  const [creatingChild, setCreatingChild] = useState(false);\n  const [reloadToken, setReloadToken] = useState(0);",
  "  const [creatingChild, setCreatingChild] = useState(false);\n  const [organizingArchive, setOrganizingArchive] = useState(false);\n  const [reloadToken, setReloadToken] = useState(0);",
);

const createCallbackAnchor = `  const createChildPage = useCallback(async () => {`;
const organizeCallback = `  const organizeArchive = useCallback(async () => {
    setOrganizingArchive(true);
    try {
      const result = await api.journals.organizeArchive();
      window.dispatchEvent(new CustomEvent("nowen:knowledge-tree-changed", {
        detail: { reason: "journal-archive-organized" },
      }));
      setReloadToken((value) => value + 1);
      const skipped = result.skippedInvalidDate + result.skippedWorkspaceJournal;
      const message = result.moved > 0
        ? \`已整理 \${result.moved} 篇日记，新建 \${result.foldersCreated} 个目录\`
        : result.organized > 0
          ? "全部日记已经位于正确目录"
          : "没有需要整理的日记";
      toast.success(skipped > 0 ? \`\${message}，跳过 \${skipped} 篇异常记录\` : message);
    } catch (error: any) {
      toast.error(error?.message || "整理日记目录失败");
    } finally {
      setOrganizingArchive(false);
    }
  }, []);

${createCallbackAnchor}`;
if (!viewSource.includes("const organizeArchive = useCallback")) {
  if (!viewSource.includes(createCallbackAnchor)) throw new Error("organize callback anchor not found");
  viewSource = viewSource.replace(createCallbackAnchor, organizeCallback);
}

const refreshButton = `              <button
                type="button"
                onClick={() => setReloadToken((value) => value + 1)}
                className="ml-auto rounded-lg p-2 text-tx-tertiary hover:bg-app-hover hover:text-tx-primary"
                title="刷新"
              >
                <RefreshCw size={15} />
              </button>`;
const toolbarButtons = `              <button
                type="button"
                onClick={() => void organizeArchive()}
                disabled={organizingArchive}
                className="ml-auto flex items-center gap-1.5 rounded-lg border border-app-border px-2.5 py-1.5 text-xs font-medium text-tx-secondary hover:bg-app-hover hover:text-tx-primary disabled:opacity-60"
                title="将已有日记整理到个人日记 / 年 / 月目录"
              >
                {organizingArchive ? <Loader2 size={14} className="animate-spin" /> : <FolderTree size={14} />}
                <span className="hidden sm:inline">整理目录</span>
              </button>
              <button
                type="button"
                onClick={() => setReloadToken((value) => value + 1)}
                className="rounded-lg p-2 text-tx-tertiary hover:bg-app-hover hover:text-tx-primary"
                title="刷新"
              >
                <RefreshCw size={15} />
              </button>`;
if (!viewSource.includes("整理目录</span>")) {
  if (!viewSource.includes(refreshButton)) throw new Error("journal toolbar anchor not found");
  viewSource = viewSource.replace(refreshButton, toolbarButtons);
}

const cardTitle = `                <div className="flex items-center gap-2 text-sm font-semibold text-tx-primary">
                  <BookOpen size={16} className="text-accent-primary" />
                  今日日记
                </div>`;
const cardTitleWithPath = `                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-tx-primary">
                    <BookOpen size={16} className="text-accent-primary" />
                    今日日记
                  </div>
                  <div className="mt-1 truncate text-[10px] text-tx-tertiary">
                    个人日记 / {selectedDateObject.getFullYear()}年 / {selectedDateObject.getFullYear()}年{String(selectedDateObject.getMonth() + 1).padStart(2, "0")}月 / {selectedDate}
                  </div>
                </div>`;
if (!viewSource.includes("个人日记 / {selectedDateObject.getFullYear()}年")) {
  if (!viewSource.includes(cardTitle)) throw new Error("journal card title anchor not found");
  viewSource = viewSource.replace(cardTitle, cardTitleWithPath);
}

for (const required of [
  "organizeArchive: ()",
  "const organizeArchive = useCallback",
  "journal-archive-organized",
  "整理目录</span>",
  "个人日记 / {selectedDateObject.getFullYear()}年",
]) {
  const target = required === "organizeArchive: ()" ? apiSource : viewSource;
  if (!target.includes(required)) throw new Error(`frontend patch missing: ${required}`);
}

writeFileSync(viewPath, viewSource);

import { readFileSync, writeFileSync } from "node:fs";

function replaceOnce(source, anchor, replacement, label) {
  if (!source.includes(anchor)) throw new Error(`${label} anchor not found`);
  return source.replace(anchor, replacement);
}

// Backend routes
{
  const path = "backend/src/routes/journals.ts";
  let source = readFileSync(path, "utf8");
  const importLine = 'import {\n  applyJournalArchiveCleanup,\n  previewJournalArchiveCleanup,\n  restoreJournalArchiveCleanup,\n} from "../services/journalArchiveCleanup.js";\n';
  if (!source.includes('from "../services/journalArchiveCleanup.js"')) {
    const anchor = '} from "../services/journalArchiveTree.js";\n';
    source = replaceOnce(source, anchor, `${anchor}${importLine}`, "journal cleanup import");
  }

  if (!source.includes('app.get("/cleanup-preview"')) {
    const anchor = '/**\n * 获取日记列表（按日期倒序）\n */\n';
    const endpoints = `/**\n * 预览迁移后可安全清理的旧空笔记本。\n *\n * 只有具备 journal_archive 移动历史、仍为空、没有子目录、共享、密码或 ACL 的\n * 个人笔记本才会进入候选列表。GET 只读，不产生删除副作用。\n */\napp.get("/cleanup-preview", (c) => {\n  const db = getDb();\n  const userId = c.req.header("X-User-Id") || "";\n  if (!userId) return c.json({ error: "未授权" }, 401);\n  return c.json(previewJournalArchiveCleanup({ db, userId }));\n});\n\n/**\n * 按最新预览执行安全清理。\n *\n * previewToken 用于防止预览后目录又新增内容时仍按旧状态删除。清理只软删除空笔记本，\n * 不移动或删除任何笔记，并返回 cleanupId 供撤销。\n */\napp.post("/cleanup", async (c) => {\n  const db = getDb();\n  const userId = c.req.header("X-User-Id") || "";\n  if (!userId) return c.json({ error: "未授权" }, 401);\n\n  const body = await c.req.json().catch(() => ({}));\n  const previewToken = typeof body?.previewToken === "string" ? body.previewToken.trim() : "";\n  const candidateIds = Array.isArray(body?.candidateIds)\n    ? body.candidateIds.filter((value: unknown): value is string => typeof value === "string" && value.length > 0)\n    : undefined;\n  if (!/^[0-9a-f]{64}$/i.test(previewToken)) {\n    return c.json({ error: "预览令牌无效" }, 400);\n  }\n  if (candidateIds && candidateIds.length > 100) {\n    return c.json({ error: "单次最多清理 100 个目录" }, 400);\n  }\n\n  try {\n    const result = applyJournalArchiveCleanup({ db, userId, previewToken, candidateIds });\n    return c.json({ success: true, ...result });\n  } catch (error: any) {\n    const message = String(error?.message || "");\n    if (message === "JOURNAL_ARCHIVE_CLEANUP_STALE_PREVIEW") {\n      return c.json({ error: "目录状态已经变化，请重新预览", code: message }, 409);\n    }\n    if (message === "JOURNAL_ARCHIVE_CLEANUP_INVALID_SELECTION") {\n      return c.json({ error: "清理范围包含不安全目录", code: message }, 400);\n    }\n    throw error;\n  }\n});\n\n/** 撤销一次日记旧目录清理。 */\napp.post("/cleanup/restore", async (c) => {\n  const db = getDb();\n  const userId = c.req.header("X-User-Id") || "";\n  if (!userId) return c.json({ error: "未授权" }, 401);\n  const body = await c.req.json().catch(() => ({}));\n  const cleanupId = typeof body?.cleanupId === "string" ? body.cleanupId.trim() : "";\n  if (!/^[0-9a-f-]{36}$/i.test(cleanupId)) {\n    return c.json({ error: "清理记录无效" }, 400);\n  }\n  try {\n    const result = restoreJournalArchiveCleanup({ db, userId, cleanupId });\n    return c.json({ success: true, ...result });\n  } catch (error: any) {\n    const message = String(error?.message || "");\n    if (message === "JOURNAL_ARCHIVE_CLEANUP_NOT_FOUND") {\n      return c.json({ error: "找不到可撤销的清理记录", code: message }, 404);\n    }\n    if (message.startsWith("JOURNAL_ARCHIVE_CLEANUP_PARENT_UNAVAILABLE")) {\n      return c.json({ error: "原父目录不可用，无法安全撤销", code: message }, 409);\n    }\n    throw error;\n  }\n});\n\n`;
    source = replaceOnce(source, anchor, `${endpoints}${anchor}`, "journal cleanup endpoints");
  }
  writeFileSync(path, source);
}

// Frontend API
{
  const path = "frontend/src/lib/api.impl.ts";
  let source = readFileSync(path, "utf8");
  if (!source.includes("previewArchiveCleanup:")) {
    const anchor = "    /** 获取日记列表 */\n";
    const methods = `    /** 预览迁移后可安全清理的旧空目录 */\n    previewArchiveCleanup: () => request<{\n      previewToken: string;\n      candidateCount: number;\n      blockedCount: number;\n      candidates: Array<{\n        id: string;\n        name: string;\n        parentId: string | null;\n        updatedAt: string;\n        evidenceCount: number;\n      }>;\n      blocked: Array<{\n        id: string;\n        name: string;\n        reasons: string[];\n      }>;\n    }>("/journals/cleanup-preview"),\n    /** 按预览令牌软删除已确认的空旧目录 */\n    cleanupArchive: (data: { previewToken: string; candidateIds?: string[] }) => request<{\n      success: boolean;\n      cleanupId: string;\n      cleaned: number;\n      alreadyDeleted: number;\n      cleanedNotebooks: Array<{ id: string; name: string }>;\n    }>("/journals/cleanup", { method: "POST", body: JSON.stringify(data) }),\n    /** 撤销一次旧目录清理 */\n    restoreArchiveCleanup: (cleanupId: string) => request<{\n      success: boolean;\n      cleanupId: string;\n      restored: number;\n      alreadyActive: number;\n      missing: number;\n      restoredNotebooks: Array<{ id: string; name: string }>;\n    }>("/journals/cleanup/restore", { method: "POST", body: JSON.stringify({ cleanupId }) }),\n`;
    source = replaceOnce(source, anchor, `${methods}${anchor}`, "frontend cleanup api");
  }
  writeFileSync(path, source);
}

// Daily journal UI
{
  const path = "frontend/src/components/daily-records/DailyJournalView.tsx";
  let source = readFileSync(path, "utf8");
  if (!source.includes("Trash2,")) {
    source = replaceOnce(
      source,
      "  Sparkles,\n} from \"lucide-react\";",
      "  Sparkles,\n  Trash2,\n  Undo2,\n} from \"lucide-react\";",
      "cleanup icons",
    );
  }
  if (!source.includes('confirm as confirmDialog')) {
    const anchor = 'import { api, getCurrentWorkspace, setCurrentWorkspace } from "@/lib/api";\n';
    source = replaceOnce(
      source,
      anchor,
      `${anchor}import { confirm as confirmDialog } from "@/components/ui/confirm";\n`,
      "cleanup confirm import",
    );
  }
  if (!source.includes("cleaningArchive")) {
    const anchor = "  const [organizingArchive, setOrganizingArchive] = useState(false);\n";
    const states = `  const [cleaningArchive, setCleaningArchive] = useState(false);\n  const [restoringCleanup, setRestoringCleanup] = useState(false);\n  const [lastCleanupId, setLastCleanupId] = useState<string | null>(() => {\n    if (typeof window === "undefined") return null;\n    try { return localStorage.getItem("nowen.journalArchive.lastCleanupId"); } catch { return null; }\n  });\n`;
    source = replaceOnce(source, anchor, `${anchor}${states}`, "cleanup state");
  }
  if (!source.includes("const cleanupLegacyArchive")) {
    const anchor = "  const createChildPage = useCallback(async () => {\n";
    const callbacks = `  const cleanupLegacyArchive = useCallback(async () => {\n    setCleaningArchive(true);\n    try {\n      const preview = await api.journals.previewArchiveCleanup();\n      if (preview.candidateCount === 0) {\n        toast.info(preview.blockedCount > 0\n          ? `没有可自动清理的目录，${preview.blockedCount} 个目录因仍有内容或权限配置而保留`\n          : "没有发现迁移后遗留的空目录");\n        return;\n      }\n\n      const visibleNames = preview.candidates.slice(0, 6).map((item) => `• ${item.name}`).join("\\n");\n      const remaining = preview.candidateCount > 6 ? `\\n• 以及另外 ${preview.candidateCount - 6} 个目录` : "";\n      const blocked = preview.blockedCount > 0\n        ? `\\n\\n另有 ${preview.blockedCount} 个目录因为仍有笔记、子目录、共享或安全配置而不会清理。`\n        : "";\n      const confirmed = await confirmDialog({\n        title: `清理 ${preview.candidateCount} 个旧空目录？`,\n        description: `${visibleNames}${remaining}${blocked}\\n\\n只会软删除经过迁移历史验证的空叶子目录，不会删除任何笔记。完成后可以撤销。`,\n        confirmText: "安全清理",\n        cancelText: "取消",\n        danger: true,\n      });\n      if (!confirmed) return;\n\n      const result = await api.journals.cleanupArchive({\n        previewToken: preview.previewToken,\n        candidateIds: preview.candidates.map((item) => item.id),\n      });\n      if (result.cleaned > 0) {\n        setLastCleanupId(result.cleanupId);\n        try { localStorage.setItem("nowen.journalArchive.lastCleanupId", result.cleanupId); } catch {}\n      }\n      window.dispatchEvent(new CustomEvent("nowen:knowledge-tree-changed", {\n        detail: { reason: "journal-archive-cleaned" },\n      }));\n      setReloadToken((value) => value + 1);\n      toast.success(result.cleaned > 0\n        ? `已安全清理 ${result.cleaned} 个旧空目录，可使用“撤销清理”恢复`\n        : "目录已经清理，无需重复操作");\n    } catch (error: any) {\n      if (error?.status === 409 || /状态已经变化|STALE_PREVIEW/i.test(String(error?.message || ""))) {\n        toast.info("目录状态已经变化，请重新点击清理并确认最新预览");\n      } else {\n        toast.error(error?.message || "清理旧日记目录失败");\n      }\n    } finally {\n      setCleaningArchive(false);\n    }\n  }, []);\n\n  const restoreLegacyArchiveCleanup = useCallback(async () => {\n    if (!lastCleanupId) return;\n    setRestoringCleanup(true);\n    try {\n      const result = await api.journals.restoreArchiveCleanup(lastCleanupId);\n      if (result.restored > 0 || result.alreadyActive > 0) {\n        setLastCleanupId(null);\n        try { localStorage.removeItem("nowen.journalArchive.lastCleanupId"); } catch {}\n      }\n      window.dispatchEvent(new CustomEvent("nowen:knowledge-tree-changed", {\n        detail: { reason: "journal-archive-cleanup-restored" },\n      }));\n      setReloadToken((value) => value + 1);\n      toast.success(result.restored > 0\n        ? `已恢复 ${result.restored} 个旧目录`\n        : "这些目录已经恢复");\n    } catch (error: any) {\n      toast.error(error?.message || "撤销目录清理失败");\n    } finally {\n      setRestoringCleanup(false);\n    }\n  }, [lastCleanupId]);\n\n`;
    source = replaceOnce(source, anchor, `${callbacks}${anchor}`, "cleanup callbacks");
  }
  if (!source.includes("void cleanupLegacyArchive()")) {
    const anchor = `              <button\n                type="button"\n                onClick={() => setReloadToken((value) => value + 1)}\n`;
    const buttons = `              <button\n                type="button"\n                onClick={() => void cleanupLegacyArchive()}\n                disabled={cleaningArchive || organizingArchive}\n                className="flex items-center gap-1.5 rounded-lg border border-app-border px-2.5 py-1.5 text-xs font-medium text-tx-secondary hover:bg-app-hover hover:text-tx-primary disabled:opacity-60"\n                title="预览并安全清理迁移后遗留的空旧目录"\n              >\n                {cleaningArchive ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}\n                <span className="hidden lg:inline">清理空目录</span>\n              </button>\n              {lastCleanupId && (\n                <button\n                  type="button"\n                  onClick={() => void restoreLegacyArchiveCleanup()}\n                  disabled={restoringCleanup}\n                  className="flex items-center gap-1.5 rounded-lg border border-app-border px-2.5 py-1.5 text-xs font-medium text-accent-primary hover:bg-accent-primary/10 disabled:opacity-60"\n                  title="撤销上一次旧目录清理"\n                >\n                  {restoringCleanup ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />}\n                  <span className="hidden lg:inline">撤销清理</span>\n                </button>\n              )}\n`;
    source = replaceOnce(source, anchor, `${buttons}${anchor}`, "cleanup buttons");
  }
  writeFileSync(path, source);
}

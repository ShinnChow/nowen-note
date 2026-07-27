import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

const SIYUAN_IMPORT_ENDPOINT = "/export/import/siyuan-package";
const NORMALIZED_INPUT_FLAG = "nowenSiyuanPackageNormalized";

export interface SiyuanZipInspection {
  isSiyuanWorkspace: boolean;
  syFileCount: number;
  rootName: string;
}

type FeedbackState = {
  id: number;
  tone: "working" | "success" | "error";
  title: string;
  detail: string;
  percent?: number;
  indeterminate?: boolean;
};

export function inspectSiyuanEntryNames(entryNames: string[]): SiyuanZipInspection {
  const files = entryNames
    .map((name) => String(name || "").replace(/\\/g, "/").replace(/^\/+/, ""))
    .filter(Boolean);
  const syFiles = files.filter((name) => /(^|\/)data\/[^/]+\/.+\.sy$/i.test(name) || /(^|\/)[^/]+\.sy$/i.test(name));
  const firstSegments = syFiles
    .map((name) => name.split("/").filter(Boolean)[0] || "")
    .filter((segment) => segment && segment.toLowerCase() !== "data");
  const sharedRoot = firstSegments.length > 0 && firstSegments.every((segment) => segment === firstSegments[0])
    ? firstSegments[0]
    : "";
  return {
    isSiyuanWorkspace: syFiles.length > 0,
    syFileCount: syFiles.length,
    rootName: sharedRoot,
  };
}

export function normalizeSiyuanPackageName(fileName: string, rootName = ""): string {
  if (/\.sy\.zip$/i.test(fileName)) return fileName;
  const safeRoot = rootName.trim().replace(/[\\/:*?"<>|]/g, "-");
  if (safeRoot) return `${safeRoot}.sy.zip`;
  const base = fileName.replace(/\.zip$/i, "").replace(/\.sy$/i, "") || "siyuan-workspace";
  return `${base}.sy.zip`;
}

export function isSiyuanImportRequest(input: RequestInfo | URL): boolean {
  const url = typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;
  try {
    return new URL(url, window.location.href).pathname.endsWith(SIYUAN_IMPORT_ENDPOINT);
  } catch {
    return url.includes(SIYUAN_IMPORT_ENDPOINT);
  }
}

async function inspectSiyuanWorkspaceZip(file: File): Promise<SiyuanZipInspection> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(file);
  return inspectSiyuanEntryNames(Object.keys(zip.files));
}

function isSharedImportInput(input: HTMLInputElement): boolean {
  const accept = String(input.accept || "").toLowerCase();
  return input.type === "file" && input.multiple && accept.includes(".md") && accept.includes(".zip");
}

function replaceInputFile(input: HTMLInputElement, file: File): void {
  if (typeof DataTransfer !== "undefined") {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    return;
  }
  const fallback = {
    0: file,
    length: 1,
    item: (index: number) => index === 0 ? file : null,
  } as unknown as FileList;
  Object.defineProperty(input, "files", { configurable: true, value: fallback });
}

function ProgressCard({ state }: { state: FeedbackState }) {
  const Icon = state.tone === "success" ? CheckCircle : state.tone === "error" ? AlertCircle : Loader2;
  const iconClass = state.tone === "success"
    ? "text-emerald-500"
    : state.tone === "error"
      ? "text-red-500"
      : "animate-spin text-emerald-500";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      className="fixed bottom-6 left-1/2 z-[100] w-[min(92vw,460px)] -translate-x-1/2 rounded-xl border border-zinc-200 bg-white p-4 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass}`} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{state.title}</div>
          <div className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{state.detail}</div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={state.indeterminate ? undefined : Math.round(state.percent || 0)}
            aria-valuetext={state.indeterminate ? "处理中" : undefined}
          >
            {state.indeterminate ? (
              <motion.div
                className="h-full w-2/5 rounded-full bg-emerald-500"
                initial={{ x: "-120%" }}
                animate={{ x: "300%" }}
                transition={{ duration: 1.25, ease: "easeInOut", repeat: Infinity }}
              />
            ) : (
              <motion.div
                className={`h-full rounded-full ${state.tone === "error" ? "bg-red-500" : "bg-emerald-500"}`}
                initial={false}
                animate={{ width: `${Math.max(0, Math.min(100, state.percent || 0))}%` }}
                transition={{ duration: 0.25 }}
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function SiyuanImportProgressBridge() {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const nextId = useRef(1);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    const clearHideTimer = () => {
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    };
    const show = (patch: Omit<FeedbackState, "id">) => {
      clearHideTimer();
      setFeedback({ id: nextId.current++, ...patch });
    };
    const hideLater = (delay: number) => {
      clearHideTimer();
      hideTimer.current = window.setTimeout(() => setFeedback(null), delay);
    };

    const onChangeCapture = (event: Event) => {
      const input = event.target instanceof HTMLInputElement ? event.target : null;
      if (!input || !isSharedImportInput(input)) return;
      if (input.dataset[NORMALIZED_INPUT_FLAG] === "1") {
        delete input.dataset[NORMALIZED_INPUT_FLAG];
        return;
      }
      const files = Array.from(input.files || []);
      if (files.length !== 1 || !/\.zip$/i.test(files[0].name) || /\.sy\.zip$/i.test(files[0].name)) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      const file = files[0];
      show({
        tone: "working",
        title: "正在检查思源导入包",
        detail: `正在读取 ${file.name} 的目录结构…`,
        percent: 18,
      });

      void (async () => {
        try {
          const inspection = await inspectSiyuanWorkspaceZip(file);
          if (inspection.isSiyuanWorkspace) {
            show({
              tone: "working",
              title: "已识别为思源工作空间",
              detail: `发现 ${inspection.syFileCount} 个 .sy 文档，正在准备导入列表…`,
              percent: 78,
            });
            const renamed = new File([file], normalizeSiyuanPackageName(file.name, inspection.rootName), {
              type: file.type || "application/zip",
              lastModified: file.lastModified,
            });
            replaceInputFile(input, renamed);
          }
          input.dataset[NORMALIZED_INPUT_FLAG] = "1";
          input.dispatchEvent(new Event("change", { bubbles: true }));
          show({
            tone: "success",
            title: inspection.isSiyuanWorkspace ? "思源导入包已就绪" : "文件读取完成",
            detail: inspection.isSiyuanWorkspace
              ? "请确认导入格式与目标目录，然后点击导入按钮。"
              : "已按通用 ZIP 导入流程继续处理。",
            percent: 100,
          });
          hideLater(1400);
        } catch (error) {
          input.dataset[NORMALIZED_INPUT_FLAG] = "1";
          input.dispatchEvent(new Event("change", { bubbles: true }));
          show({
            tone: "error",
            title: "思源导入包检查失败",
            detail: error instanceof Error ? error.message : String(error),
            percent: 100,
          });
          hideLater(4000);
        }
      })();
    };

    const originalFetch = window.fetch.bind(window);
    const patchedFetch: typeof window.fetch = async (input, init) => {
      if (!isSiyuanImportRequest(input)) return originalFetch(input, init);
      show({
        tone: "working",
        title: "正在导入思源笔记",
        detail: "正在上传数据包，请不要关闭页面…",
        indeterminate: true,
      });
      const processingTimer = window.setTimeout(() => {
        show({
          tone: "working",
          title: "正在解析并写入",
          detail: "服务器正在恢复目录、文档、排序、图标和附件…",
          indeterminate: true,
        });
      }, 900);
      try {
        const response = await originalFetch(input, init);
        window.clearTimeout(processingTimer);
        if (response.ok) {
          show({
            tone: "success",
            title: "思源笔记导入完成",
            detail: "内容树和笔记列表正在刷新。",
            percent: 100,
          });
          hideLater(2200);
        } else {
          show({
            tone: "error",
            title: "思源笔记导入失败",
            detail: `服务器返回 HTTP ${response.status}，页面会显示具体错误。`,
            percent: 100,
          });
          hideLater(5000);
        }
        return response;
      } catch (error) {
        window.clearTimeout(processingTimer);
        show({
          tone: "error",
          title: "思源笔记导入失败",
          detail: error instanceof Error ? error.message : String(error),
          percent: 100,
        });
        hideLater(5000);
        throw error;
      }
    };

    document.addEventListener("change", onChangeCapture, true);
    window.fetch = patchedFetch;
    return () => {
      document.removeEventListener("change", onChangeCapture, true);
      if (window.fetch === patchedFetch) window.fetch = originalFetch;
      clearHideTimer();
    };
  }, []);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>{feedback ? <ProgressCard key={feedback.id} state={feedback} /> : null}</AnimatePresence>,
    document.body,
  );
}

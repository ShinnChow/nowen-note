// office/word/DocxAttachmentPreview.tsx —— 把 /api/attachments/<id> 链接拉下来 → IR → 渲染
//
// 为什么单独抽一个组件而不是塞进 FileManager：
//   1. FileManager 已 2300+ 行，再塞解析/blob 释放逻辑会把它再拉宽 ~80 行，难维护
//   2. 解析失败、加载中、空态 这三种 UI 分支只跟 docx 自身相关，跟附件抽屉无关
//   3. 将来如果别处（比如 MarkdownEditor 链接拦截）也想嵌 docx 预览，可直接复用本组件
//
// 不做的事（避免过度设计）：
//   - 不做缩放滑块（需要亲手看细节可设置 scale prop）
//   - 不做错误重试按钮（解析失败=docx 兼容性问题，重试也无济于事；给"原文下载"链接兜底）
//   - 不做 IR JSON 调试侧栏（只负责渲染，不做解析验证）
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, AlertTriangle, Download, Upload } from "lucide-react";
import { parseDocx, type DocxIR } from "@/office";
import WordViewer from "./WordViewer";

interface Props {
  /** 完整的附件 URL（已经过 resolveAttachmentUrl 处理） */
  url: string;
  /** 用于错误提示展示文件名 */
  filename: string;
  /** 文档区域高度（抽屉里建议给个 min 值，让 WordViewer 的 absolute inset:0 有得撑） */
  heightClass?: string;
  /**
   * 上传新版本回调。给"用 Word/WPS 编辑后回传"的场景用。
   * 提供时组件右上角会出现一个"上传新版本"按钮：用户选 .docx → 触发回调，
   * 组件本身不做任何 API 调用——由调用方决定怎么删旧 / 写新 / 更新笔记 content。
   * 回调返回成功后组件会自动重新拉 url 解析（如果 url 同时变了走 useEffect；
   * 没变就靠调用方手动 setKey 强刷）。
   */
  onReplace?: (file: File) => Promise<void>;
}

export default function DocxAttachmentPreview({ url, filename, heightClass, onReplace }: Props) {
  const [ir, setIr] = useState<DocxIR | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string>("");

  // parseDocx 内部会为内联图片 createObjectURL，
  // 切文档/卸载时必须 revoke，否则 SPA 久了会泄露内存。
  const ownedBlobUrls = useRef<string[]>([]);
  const releaseBlobUrls = useCallback(() => {
    for (const u of ownedBlobUrls.current) URL.revokeObjectURL(u);
    ownedBlobUrls.current = [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrMsg("");
    setIr(null);
    releaseBlobUrls();

    (async () => {
      try {
        // /api/attachments/<id> 是公开端点，但浏览器同源 fetch 会自动带 cookie；
        // 服务端走 Content-Disposition: attachment，对 fetch 接收 ArrayBuffer 没影响。
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        if (cancelled) return;
        const result = await parseDocx(buf);
        if (cancelled) {
          // 解析过程中组件已卸载/切走 → 直接释放，避免泄露
          for (const u of result.resources?.blobUrls ?? []) URL.revokeObjectURL(u);
          return;
        }
        ownedBlobUrls.current = result.resources?.blobUrls ?? [];
        setIr(result);
      } catch (e: any) {
        if (!cancelled) setErrMsg(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // url 变了就重新拉、重新解析
  }, [url, releaseBlobUrls]);

  // 组件卸载时释放
  useEffect(() => releaseBlobUrls, [releaseBlobUrls]);

  // "上传新版本"流程：选文件 → 走 onReplace 回调 → 由外层决定如何删旧+上新。
  // 这里只负责 UI 状态（uploading）和最基础的 mime 校验，避免把附件 API 耦合进来。
  const [uploading, setUploading] = useState(false);
  const handlePickReplace = useCallback(() => {
    if (!onReplace) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        setUploading(true);
        await onReplace(file);
      } catch (err) {
        // 失败由 onReplace 内部 toast，组件这里只复位 state
        // eslint-disable-next-line no-console
        console.error("Replace docx failed:", err);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }, [onReplace]);

  const minH = heightClass ?? "min-h-[500px]";

  if (loading) {
    return (
      <div
        className={`relative w-full ${minH} flex items-center justify-center text-tx-tertiary`}
      >
        <Loader2 size={16} className="animate-spin mr-2" />
        正在解析 {filename}…
      </div>
    );
  }

  if (errMsg || !ir) {
    return (
      <div
        className={`relative w-full ${minH} flex flex-col items-center justify-center gap-2 text-tx-tertiary px-6 text-center`}
      >
        <AlertTriangle size={20} className="text-amber-500" />
        <div className="text-xs">无法预览此文档</div>
        {errMsg && (
          <div className="text-[10px] text-tx-tertiary/70 max-w-full break-all">
            {errMsg}
          </div>
        )}
        <a
          href={url}
          download={filename}
          className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] bg-app-surface border border-app-border hover:bg-app-hover text-tx-primary"
        >
          <Download size={11} />
          下载原文件
        </a>
      </div>
    );
  }

  return (
    // WordViewer 用 position:absolute / inset:0 撑满父级，所以这里必须 relative + 显式高度
    <div className={`relative w-full ${minH}`}>
      <WordViewer ir={ir} />
      {onReplace && (
        // 浮在右上角：让"用 Word 改完上传覆盖"成为一个明显入口。
        // 不放工具栏正中央：避免和未来真正的"内联编辑"按钮抢位。
        <button
          type="button"
          onClick={handlePickReplace}
          disabled={uploading}
          className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] bg-app-elevated/95 backdrop-blur border border-app-border shadow-sm hover:bg-app-hover text-tx-primary disabled:opacity-60 disabled:cursor-not-allowed"
          title="上传修改后的 .docx 覆盖原附件"
        >
          {uploading ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <Upload size={11} />
          )}
          {uploading ? "上传中…" : "上传新版本"}
        </button>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Capacitor } from "@capacitor/core";

import { resolveAttachmentUrl } from "@/lib/api";
import {
  acquireAttachmentRenderUrl,
  getAttachmentAccessSnapshot,
  getAttachmentRenderSource,
  invalidateOfflineAttachmentRenderUrl,
  subscribeAttachmentAccess,
} from "@/lib/noteAttachmentAccessBridge";

type ImageLoadState = {
  requestKey: string;
  renderSrc: string;
  loading: boolean;
  error: Error | null;
  preparingAndroidBlob: boolean;
  imageLoaded: boolean;
};

export type AttachmentImageRenderSource = {
  attachmentId: string | null;
  persistentSrc: string;
  resolvedSrc: string;
  renderSrc: string;
  renderKey: string;
  loading: boolean;
  error: Error | null;
  onLoad: () => void;
  onError: () => void;
};

/**
 * 图片渲染边界统一使用的运行时地址解析。
 *
 * 持久化地址始终保持 `/api/attachments/:id`；signed URL、离线 Object URL 与
 * Android fetch 生成的 blob URL 只在此 hook 生命周期内使用。
 */
export function useAttachmentImageRenderSource(
  rawSrc: string | null | undefined,
  options: { enabled?: boolean } = {},
): AttachmentImageRenderSource {
  const enabled = options.enabled !== false;
  useSyncExternalStore(
    subscribeAttachmentAccess,
    getAttachmentAccessSnapshot,
    getAttachmentAccessSnapshot,
  );

  const source = getAttachmentRenderSource(rawSrc);
  const resolvedSrc = rawSrc ? resolveAttachmentUrl(source.persistentSrc) : "";
  const needsAndroidBlob = enabled
    && Capacitor.getPlatform() === "android"
    && !!source.attachmentId
    && /^https?:/i.test(resolvedSrc);
  const requestKey = [
    enabled ? "enabled" : "disabled",
    rawSrc || "",
    source.attachmentId || "",
    resolvedSrc,
  ].join("\n");
  const [state, setState] = useState<ImageLoadState>({
    requestKey: "",
    renderSrc: "",
    loading: false,
    error: null,
    preparingAndroidBlob: false,
    imageLoaded: false,
  });

  useEffect(() => {
    const releaseRenderUrl = enabled && resolvedSrc
      ? acquireAttachmentRenderUrl(resolvedSrc)
      : () => undefined;
    let cancelled = false;
    let ownedBlobUrl: string | null = null;
    const abortController = typeof AbortController === "undefined" ? null : new AbortController();

    setState({
      requestKey,
      renderSrc: enabled ? resolvedSrc : "",
      loading: enabled && !!resolvedSrc,
      error: null,
      preparingAndroidBlob: needsAndroidBlob,
      imageLoaded: false,
    });

    if (needsAndroidBlob) {
      fetch(resolvedSrc, abortController ? { signal: abortController.signal } : undefined)
        .then((response) => {
          if (!response.ok) throw new Error(`fetch image failed: ${response.status}`);
          return response.blob();
        })
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob);
          if (cancelled) {
            URL.revokeObjectURL(objectUrl);
            return;
          }
          ownedBlobUrl = objectUrl;
          setState((current) => current.requestKey === requestKey ? {
            ...current,
            renderSrc: objectUrl,
            loading: true,
            error: null,
            preparingAndroidBlob: false,
            imageLoaded: false,
          } : current);
        })
        .catch((error: unknown) => {
          if (cancelled || (error instanceof DOMException && error.name === "AbortError")) return;
          const normalized = error instanceof Error ? error : new Error("图片加载失败");
          console.error("[attachment-image-render] Android blob fetch failed:", {
            attachmentId: source.attachmentId,
            originalSrc: rawSrc,
            resolvedSrc,
            error: normalized,
          });
          setState((current) => {
            if (current.requestKey !== requestKey) return current;
            if (current.imageLoaded) {
              return { ...current, preparingAndroidBlob: false };
            }
            return {
              ...current,
              loading: false,
              error: normalized,
              preparingAndroidBlob: false,
            };
          });
        });
    }

    return () => {
      cancelled = true;
      abortController?.abort();
      releaseRenderUrl();
      if (ownedBlobUrl) URL.revokeObjectURL(ownedBlobUrl);
    };
  }, [enabled, needsAndroidBlob, requestKey, resolvedSrc, source.attachmentId, rawSrc]);

  const activeState = state.requestKey === requestKey
    ? state
    : {
        requestKey,
        renderSrc: enabled ? resolvedSrc : "",
        loading: enabled && !!resolvedSrc,
        error: null,
        preparingAndroidBlob: needsAndroidBlob,
        imageLoaded: false,
      };
  const activeRenderSrc = activeState.renderSrc;

  const onLoad = useCallback(() => {
    setState((current) => (
      current.requestKey === requestKey && current.renderSrc === activeRenderSrc
        ? { ...current, loading: false, error: null, imageLoaded: true }
        : current
    ));
  }, [activeRenderSrc, requestKey]);

  const onError = useCallback(() => {
    const recoveredOfflineUrl = invalidateOfflineAttachmentRenderUrl(activeRenderSrc);
    if (recoveredOfflineUrl) {
      setState((current) => current.requestKey === requestKey
        ? { ...current, loading: true, error: null, imageLoaded: false }
        : current);
      return;
    }
    setState((current) => {
      if (current.requestKey !== requestKey || current.renderSrc !== activeRenderSrc) return current;
      // Android 的远程地址可能先触发 mixed-content 错误；blob fetch 尚在进行时不提前宣告失败。
      if (current.preparingAndroidBlob) return current;
      return {
        ...current,
        loading: false,
        error: new Error("图片加载失败"),
        imageLoaded: false,
      };
    });
  }, [activeRenderSrc, requestKey]);

  return {
    attachmentId: source.attachmentId,
    persistentSrc: source.persistentSrc,
    resolvedSrc,
    renderSrc: activeRenderSrc,
    renderKey: `${requestKey}\n${activeRenderSrc}`,
    loading: activeState.loading,
    error: activeState.error,
    onLoad,
    onError,
  };
}

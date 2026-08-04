import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";

interface PreviewImage {
  src: string;
  alt: string;
}

interface Point {
  x: number;
  y: number;
}

interface ImageTransform {
  scale: number;
  x: number;
  y: number;
}

interface GestureSnapshot {
  mode: "idle" | "pan" | "pinch";
  startPoint: Point;
  startOffset: Point;
  startCenter: Point;
  startDistance: number;
  startScale: number;
  pointerType: string;
  moved: boolean;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const TAP_MOVE_TOLERANCE_PX = 14;
const EMPTY_POINT: Point = { x: 0, y: 0 };
const INITIAL_TRANSFORM: ImageTransform = { scale: 1, x: 0, y: 0 };
const INITIAL_GESTURE: GestureSnapshot = {
  mode: "idle",
  startPoint: EMPTY_POINT,
  startOffset: EMPTY_POINT,
  startCenter: EMPTY_POINT,
  startDistance: 0,
  startScale: 1,
  pointerType: "",
  moved: false,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function distance(first: Point, second: Point): number {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function midpoint(first: Point, second: Point): Point {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

function isMobilePreviewEnvironment(): boolean {
  if (Capacitor.getPlatform() === "android") return true;
  return typeof window.matchMedia === "function"
    && window.matchMedia("(max-width: 767px) and (pointer: coarse)").matches;
}

function resolvePreviewImage(target: EventTarget | null): HTMLImageElement | null {
  if (!(target instanceof Element)) return null;
  const image = target.closest<HTMLImageElement>(".nowen-md-preview img");
  if (!image || !image.classList.contains("cursor-pointer")) return null;
  if (image.closest("[data-nowen-markdown-image-lightbox]")) return null;
  return image;
}

function imageSource(image: HTMLImageElement): string {
  return image.currentSrc || image.src || image.getAttribute("src") || "";
}

function isTouchLikePointer(event: React.PointerEvent<HTMLElement>): boolean {
  return event.pointerType === "touch"
    || (event.pointerType === "" && window.matchMedia("(pointer: coarse)").matches);
}

/**
 * Mobile-only lightbox for Markdown preview images.
 *
 * MarkdownPreview historically called window.open() for every image click. On Android
 * WebView that leaves Nowen Note and triggers the system "open Chrome" confirmation.
 * This bridge captures mobile image clicks before React's handler, keeps the preview
 * in-app, and provides pinch zoom, panning, reset, close, Escape and Android back-button
 * handling without changing desktop behavior.
 */
export default function MarkdownImagePreviewBridge() {
  const [preview, setPreview] = useState<PreviewImage | null>(null);
  const [transform, setTransform] = useState<ImageTransform>(INITIAL_TRANSFORM);
  const transformRef = useRef<ImageTransform>(INITIAL_TRANSFORM);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const pointersRef = useRef<Map<number, Point>>(new Map());
  const gestureRef = useRef<GestureSnapshot>(INITIAL_GESTURE);

  const updateTransform = useCallback((next: ImageTransform) => {
    transformRef.current = next;
    setTransform(next);
  }, []);

  const closePreview = useCallback(() => {
    pointersRef.current.clear();
    gestureRef.current = INITIAL_GESTURE;
    updateTransform(INITIAL_TRANSFORM);
    setPreview(null);
  }, [updateTransform]);

  const constrainOffset = useCallback((scale: number, x: number, y: number): Point => {
    if (scale <= MIN_SCALE) return EMPTY_POINT;

    const stage = stageRef.current?.getBoundingClientRect();
    const image = imageRef.current;
    if (!stage || !image) return { x, y };

    const maxX = Math.max(0, (image.clientWidth * scale - stage.width) / 2 + 24);
    const maxY = Math.max(0, (image.clientHeight * scale - stage.height) / 2 + 24);
    return {
      x: clamp(x, -maxX, maxX),
      y: clamp(y, -maxY, maxY),
    };
  }, []);

  const setScale = useCallback((requestedScale: number) => {
    const scale = clamp(requestedScale, MIN_SCALE, MAX_SCALE);
    const offset = constrainOffset(scale, transformRef.current.x, transformRef.current.y);
    updateTransform({ scale, ...offset });
  }, [constrainOffset, updateTransform]);

  useEffect(() => {
    const handleMarkdownImageClick = (event: MouseEvent) => {
      if (!isMobilePreviewEnvironment()) return;
      const image = resolvePreviewImage(event.target);
      if (!image) return;
      const src = imageSource(image);
      if (!src) return;

      // This capture listener runs before ReactMarkdown's onClick window.open() handler.
      event.preventDefault();
      event.stopPropagation();
      setPreview({ src, alt: image.alt || "" });
    };

    document.addEventListener("click", handleMarkdownImageClick, true);
    return () => document.removeEventListener("click", handleMarkdownImageClick, true);
  }, []);

  useEffect(() => {
    if (!preview) return;

    updateTransform(INITIAL_TRANSFORM);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closePreview();
    };
    window.addEventListener("keydown", handleKeyDown, true);

    let disposed = false;
    let removeBackButton: (() => void) | null = null;
    if (Capacitor.isNativePlatform()) {
      void CapacitorApp.addListener("backButton", closePreview)
        .then((handle) => {
          if (disposed) void handle.remove();
          else removeBackButton = () => void handle.remove();
        })
        .catch(() => {});
    }

    return () => {
      disposed = true;
      removeBackButton?.();
      window.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [preview, closePreview, updateTransform]);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest("button")) return;

    const point = { x: event.clientX, y: event.clientY };
    const pointers = pointersRef.current;
    pointers.set(event.pointerId, point);
    event.currentTarget.setPointerCapture?.(event.pointerId);

    if (pointers.size === 1) {
      gestureRef.current = {
        mode: "pan",
        startPoint: point,
        startOffset: { x: transformRef.current.x, y: transformRef.current.y },
        startCenter: point,
        startDistance: 0,
        startScale: transformRef.current.scale,
        pointerType: event.pointerType,
        moved: false,
      };
      return;
    }

    const [first, second] = Array.from(pointers.values());
    gestureRef.current = {
      mode: "pinch",
      startPoint: point,
      startOffset: { x: transformRef.current.x, y: transformRef.current.y },
      startCenter: midpoint(first, second),
      startDistance: Math.max(1, distance(first, second)),
      startScale: transformRef.current.scale,
      pointerType: event.pointerType,
      moved: true,
    };
  }, []);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const pointers = pointersRef.current;
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const gesture = gestureRef.current;
    if (pointers.size >= 2) {
      const [first, second] = Array.from(pointers.values());
      const center = midpoint(first, second);
      const nextScale = clamp(
        gesture.startScale * (distance(first, second) / Math.max(1, gesture.startDistance)),
        MIN_SCALE,
        MAX_SCALE,
      );
      const offset = constrainOffset(
        nextScale,
        gesture.startOffset.x + center.x - gesture.startCenter.x,
        gesture.startOffset.y + center.y - gesture.startCenter.y,
      );
      gestureRef.current.moved = true;
      updateTransform({ scale: nextScale, ...offset });
      return;
    }

    if (gesture.mode !== "pan") return;
    const dx = event.clientX - gesture.startPoint.x;
    const dy = event.clientY - gesture.startPoint.y;
    if (Math.hypot(dx, dy) > TAP_MOVE_TOLERANCE_PX) gestureRef.current.moved = true;
    if (transformRef.current.scale <= MIN_SCALE) return;

    const offset = constrainOffset(
      transformRef.current.scale,
      gesture.startOffset.x + dx,
      gesture.startOffset.y + dy,
    );
    updateTransform({ scale: transformRef.current.scale, ...offset });
  }, [constrainOffset, updateTransform]);

  const handlePointerEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const pointers = pointersRef.current;
    const wasLastPointer = pointers.size === 1 && pointers.has(event.pointerId);
    const gesture = gestureRef.current;
    pointers.delete(event.pointerId);
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // Android WebView may already have released the pointer after a cancelled gesture.
    }

    if (pointers.size === 1) {
      const remaining = Array.from(pointers.values())[0];
      gestureRef.current = {
        mode: "pan",
        startPoint: remaining,
        startOffset: { x: transformRef.current.x, y: transformRef.current.y },
        startCenter: remaining,
        startDistance: 0,
        startScale: transformRef.current.scale,
        pointerType: event.pointerType,
        moved: true,
      };
      return;
    }

    if (!wasLastPointer) return;
    gestureRef.current = INITIAL_GESTURE;
    if (
      isTouchLikePointer(event)
      && gesture.mode === "pan"
      && !gesture.moved
      && transformRef.current.scale <= MIN_SCALE
    ) {
      closePreview();
    }
  }, [closePreview]);

  if (!preview || typeof document === "undefined") return null;

  const english = document.documentElement.lang?.toLowerCase().startsWith("en") ?? false;
  const closeLabel = english ? "Close image preview" : "关闭图片预览";

  return createPortal(
    <div
      ref={stageRef}
      role="dialog"
      aria-modal="true"
      aria-label={english ? "Image preview" : "图片预览"}
      data-nowen-markdown-image-lightbox="1"
      className="fixed inset-0 z-[90] flex select-none items-center justify-center overflow-hidden bg-black/95"
      style={{ touchAction: "none" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onWheel={(event) => {
        event.preventDefault();
        setScale(transformRef.current.scale + (event.deltaY < 0 ? 0.25 : -0.25));
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closePreview();
      }}
    >
      <button
        type="button"
        title={closeLabel}
        aria-label={closeLabel}
        className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur transition-colors active:bg-white/20"
        style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
        onClick={(event) => {
          event.stopPropagation();
          closePreview();
        }}
      >
        <X size={24} />
      </button>

      <img
        ref={imageRef}
        src={preview.src}
        alt={preview.alt}
        draggable={false}
        className="max-h-[calc(100dvh-7rem)] max-w-[calc(100vw-1.5rem)] object-contain will-change-transform"
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
          transition: pointersRef.current.size ? "none" : "transform 120ms ease-out",
          touchAction: "none",
        }}
        onLoad={() => {
          const offset = constrainOffset(transformRef.current.scale, transformRef.current.x, transformRef.current.y);
          updateTransform({ scale: transformRef.current.scale, ...offset });
        }}
      />

      <div
        className="absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/50 p-1.5 text-white shadow-lg backdrop-blur"
        style={{ marginBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          title={english ? "Zoom out" : "缩小"}
          aria-label={english ? "Zoom out" : "缩小"}
          disabled={transform.scale <= MIN_SCALE}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors active:bg-white/20 disabled:opacity-35"
          onClick={() => setScale(transform.scale - 0.25)}
        >
          <ZoomOut size={20} />
        </button>
        <span className="min-w-14 text-center text-xs tabular-nums">{Math.round(transform.scale * 100)}%</span>
        <button
          type="button"
          title={english ? "Zoom in" : "放大"}
          aria-label={english ? "Zoom in" : "放大"}
          disabled={transform.scale >= MAX_SCALE}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors active:bg-white/20 disabled:opacity-35"
          onClick={() => setScale(transform.scale + 0.25)}
        >
          <ZoomIn size={20} />
        </button>
        {transform.scale > MIN_SCALE && (
          <button
            type="button"
            title={english ? "Reset zoom" : "重置缩放"}
            aria-label={english ? "Reset zoom" : "重置缩放"}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors active:bg-white/20"
            onClick={() => updateTransform(INITIAL_TRANSFORM)}
          >
            <RotateCcw size={19} />
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}

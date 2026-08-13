import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileViewControlsTarget {
  host: HTMLDivElement;
  sourceButton: HTMLButtonElement;
  previewButton: HTMLButtonElement;
  sourceActive: boolean;
  previewActive: boolean;
  sourceLabel: string;
  previewLabel: string;
}

const HOST_ATTR = "data-nowen-markdown-mobile-view-controls";
const ORIGINAL_GROUP_ATTR = "data-nowen-markdown-mobile-view-controls-source";
const originalGroupDisplay = new WeakMap<HTMLElement, string>();

function isCompactMarkdownViewport(): boolean {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(max-width: 767px)").matches;
}

function findModeButton(
  root: HTMLElement,
  iconClass: "lucide-file-code" | "lucide-eye",
): HTMLButtonElement | null {
  return Array.from(root.querySelectorAll<HTMLButtonElement>("button[aria-pressed]"))
    .find((button) => button.querySelector(`svg.${iconClass}`)) || null;
}

function ensureHost(compactToolbar: HTMLElement): HTMLDivElement {
  const existing = compactToolbar.querySelector<HTMLDivElement>(`[${HOST_ATTR}]`);
  if (existing) return existing;

  const host = document.createElement("div");
  host.setAttribute(HOST_ATTR, "true");
  host.className = "flex shrink-0 items-center gap-0.5 overflow-hidden rounded-md border border-app-border";

  const firstDivider = Array.from(compactToolbar.children).find((child) =>
    child instanceof HTMLElement
    && child.tagName === "DIV"
    && child.classList.contains("w-px")
    && child.classList.contains("h-5"),
  );
  compactToolbar.insertBefore(host, firstDivider || null);
  return host;
}

function restoreOriginalGroups(): void {
  document.querySelectorAll<HTMLElement>(`[${ORIGINAL_GROUP_ATTR}]`).forEach((group) => {
    const original = originalGroupDisplay.get(group) ?? "";
    if (original) group.style.display = original;
    else group.style.removeProperty("display");
    group.removeAttribute(ORIGINAL_GROUP_ATTR);
    originalGroupDisplay.delete(group);
  });
}

function resolveTarget(): MobileViewControlsTarget | null {
  if (!isCompactMarkdownViewport()) return null;

  const compactToolbar = document.querySelector<HTMLElement>('[data-markdown-mobile-toolbar="compact"]');
  const expandedToolbar = document.querySelector<HTMLElement>('[data-markdown-mobile-toolbar="expanded"]');
  if (!compactToolbar || !expandedToolbar) return null;

  const sourceButton = findModeButton(expandedToolbar, "lucide-file-code");
  const previewButton = findModeButton(expandedToolbar, "lucide-eye");
  if (!sourceButton || !previewButton) return null;

  // The canonical mobile buttons used to live inside the collapsed secondary toolbar.
  // Keep them as the single source of truth for handlers/state, but hide their old visual
  // container so expanding “more” does not show a duplicate pair.
  const originalGroup = sourceButton.parentElement;
  if (originalGroup instanceof HTMLElement && originalGroup === previewButton.parentElement) {
    if (!originalGroupDisplay.has(originalGroup)) {
      originalGroupDisplay.set(originalGroup, originalGroup.style.display || "");
    }
    originalGroup.setAttribute(ORIGINAL_GROUP_ATTR, "true");
    originalGroup.style.display = "none";
  }

  const host = ensureHost(compactToolbar);
  return {
    host,
    sourceButton,
    previewButton,
    sourceActive: sourceButton.getAttribute("aria-pressed") === "true",
    previewActive: previewButton.getAttribute("aria-pressed") === "true",
    sourceLabel: sourceButton.getAttribute("aria-label") || sourceButton.title || "源码",
    previewLabel: previewButton.getAttribute("aria-label") || previewButton.title || "预览",
  };
}

function sameTarget(a: MobileViewControlsTarget | null, b: MobileViewControlsTarget | null): boolean {
  if (!a || !b) return a === b;
  return a.host === b.host
    && a.sourceButton === b.sourceButton
    && a.previewButton === b.previewButton
    && a.sourceActive === b.sourceActive
    && a.previewActive === b.previewActive
    && a.sourceLabel === b.sourceLabel
    && a.previewLabel === b.previewLabel;
}

export default function MarkdownMobileViewControlsBridge() {
  const [target, setTarget] = useState<MobileViewControlsTarget | null>(null);

  useEffect(() => {
    let frame = 0;
    const reconcile = () => {
      frame = 0;
      const next = resolveTarget();
      setTarget((current) => sameTarget(current, next) ? current : next);
    };
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(reconcile);
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-pressed", "class"],
    });
    window.addEventListener("resize", schedule);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      document.querySelectorAll<HTMLElement>(`[${HOST_ATTR}]`).forEach((host) => host.remove());
      restoreOriginalGroups();
    };
  }, []);

  if (!target) return null;

  const buttonClass = (active: boolean) => cn(
    "flex h-7 w-7 items-center justify-center rounded-[5px] transition-colors",
    active
      ? "bg-accent-primary/10 text-accent-primary"
      : "text-tx-tertiary active:bg-app-hover",
  );

  return createPortal(
    <>
      <button
        type="button"
        className={buttonClass(target.sourceActive)}
        title={target.sourceLabel}
        aria-label={target.sourceLabel}
        aria-pressed={target.sourceActive}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => target.sourceButton.click()}
      >
        <FileCode size={14} />
      </button>
      <button
        type="button"
        className={buttonClass(target.previewActive)}
        title={target.previewLabel}
        aria-label={target.previewLabel}
        aria-pressed={target.previewActive}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => target.previewButton.click()}
      >
        <Eye size={14} />
      </button>
    </>,
    target.host,
  );
}

import { useEffect } from "react";

type TitleField = HTMLInputElement | HTMLTextAreaElement;

const MIRROR_SELECTOR = "[data-title-duplicate-mirror]";
const CARET_SELECTOR = "[data-nowen-title-duplicate-caret]";

function activeTitleField(): TitleField | null {
  const active = document.activeElement;
  return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement ? active : null;
}

function removeCaretProxy(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>(CARET_SELECTOR).forEach((node) => node.remove());
}

/**
 * TitleDuplicateAssistBridge renders duplicate-title text in a fixed mirror above the real field.
 * The real input caret is therefore painted underneath that mirror and can become invisible.
 *
 * Keep the original field as the source of truth and draw only a zero-width visual caret inside
 * the mirror at the field's current selectionStart. This does not change value, selection, focus,
 * composition or save behaviour.
 */
export function syncTitleDuplicateCaretProxy(root: ParentNode = document): boolean {
  removeCaretProxy(root);

  const mirror = root.querySelector<HTMLElement>(MIRROR_SELECTOR);
  const field = activeTitleField();
  if (!mirror || !field || !field.isConnected) return false;

  const selectionStart = field.selectionStart;
  const selectionEnd = field.selectionEnd;
  if (selectionStart == null || selectionEnd == null || selectionStart !== selectionEnd) return false;

  const textLayer = mirror.firstElementChild as HTMLElement | null;
  if (!textLayer) return false;
  const spans = Array.from(textLayer.children).filter(
    (child): child is HTMLSpanElement => child instanceof HTMLSpanElement,
  );
  if (spans.length < 2) return false;

  const prefix = spans[0];
  const suffix = spans[1];
  const prefixText = prefix.textContent || "";
  const suffixText = suffix.textContent || "";
  if (`${prefixText}${suffixText}` !== field.value) return false;

  const caret = document.createElement("span");
  caret.dataset.nowenTitleDuplicateCaret = "";
  caret.setAttribute("aria-hidden", "true");
  const computedCaretColor = window.getComputedStyle(field).caretColor;
  const caretColor = computedCaretColor && computedCaretColor !== "auto" && computedCaretColor !== "transparent"
    ? computedCaretColor
    : "#2563eb";
  Object.assign(caret.style, {
    display: "inline-block",
    width: "0",
    height: "1em",
    marginRight: "-2px",
    borderLeft: `2px solid ${caretColor}`,
    boxSizing: "border-box",
    verticalAlign: "-0.12em",
    pointerEvents: "none",
  });

  const position = Math.max(0, Math.min(selectionStart, field.value.length));
  if (position <= prefixText.length) {
    prefix.replaceChildren(
      document.createTextNode(prefixText.slice(0, position)),
      caret,
      document.createTextNode(prefixText.slice(position)),
    );
  } else {
    const suffixPosition = position - prefixText.length;
    suffix.replaceChildren(
      document.createTextNode(suffixText.slice(0, suffixPosition)),
      caret,
      document.createTextNode(suffixText.slice(suffixPosition)),
    );
  }
  return true;
}

export default function TitleDuplicateCaretBridge() {
  useEffect(() => {
    let frame: number | null = null;
    const schedule = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = null;
        syncTitleDuplicateCaretProxy();
      });
    };

    const onSelectionChange = () => schedule();
    const onFieldInteraction = (event: Event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        schedule();
      }
    };

    // The duplicate mirror can appear asynchronously after notebook-title candidates finish loading.
    // Watching only direct body children is enough because the mirror itself is appended to body,
    // and avoids observing our own caret insertion inside the mirror.
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true });

    document.addEventListener("selectionchange", onSelectionChange);
    document.addEventListener("pointerup", onFieldInteraction, true);
    document.addEventListener("keyup", onFieldInteraction, true);
    document.addEventListener("input", onFieldInteraction, true);
    document.addEventListener("focusin", onFieldInteraction, true);
    schedule();

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("selectionchange", onSelectionChange);
      document.removeEventListener("pointerup", onFieldInteraction, true);
      document.removeEventListener("keyup", onFieldInteraction, true);
      document.removeEventListener("input", onFieldInteraction, true);
      document.removeEventListener("focusin", onFieldInteraction, true);
      removeCaretProxy();
    };
  }, []);

  return null;
}

// @vitest-environment jsdom

import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";

import { markdownLivePreviewExtension } from "@/lib/markdownLivePreview";

const CALLOUTS = [
  { type: "NOTE", body: "Note正文", className: "border-blue-400/70" },
  { type: "TIP", body: "Tip正文", className: "border-emerald-400/70" },
  { type: "IMPORTANT", body: "Important正文", className: "border-violet-400/70" },
  { type: "WARNING", body: "Warning正文", className: "border-amber-400/80" },
  { type: "CAUTION", body: "Caution正文", className: "border-red-400/80" },
] as const;

beforeAll(() => {
  if (!(globalThis as any).ResizeObserver) {
    (globalThis as any).ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (!globalThis.requestAnimationFrame) {
    globalThis.requestAnimationFrame = (callback: FrameRequestCallback) =>
      globalThis.setTimeout(() => callback(Date.now()), 0) as unknown as number;
    globalThis.cancelAnimationFrame = (id: number) => globalThis.clearTimeout(id);
  }
  if (!globalThis.matchMedia) {
    globalThis.matchMedia = (() => ({
      matches: false,
      media: "",
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false,
    })) as typeof globalThis.matchMedia;
  }
});

afterEach(() => {
  document.body.innerHTML = "";
});

async function flushPreview() {
  await new Promise((resolve) => setTimeout(resolve, 60));
}

describe("Markdown live preview SiYuan Callouts", () => {
  it("renders all five Callout types while preserving the active Markdown source", async () => {
    const parent = document.createElement("div");
    document.body.appendChild(parent);

    // Plain paragraphs separate the blockquotes. This mirrors a real note and keeps
    // the active source Callout from sharing one semantic replacement range with all
    // inactive Callouts.
    const renderedSections = CALLOUTS.flatMap(({ type, body }, index) => [
      [
        `> [!${type}] ${type[0]}${type.slice(1).toLowerCase()}`,
        `> ${body}`,
      ].join("\n"),
      `分隔段落 ${index + 1}`,
    ]);
    const activeSource = "> [!TIP] 正在编辑\n> 这里保持 Markdown 源码";
    const doc = [...renderedSections, activeSource].join("\n\n");

    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc,
        selection: { anchor: doc.lastIndexOf("正在编辑") },
        extensions: [markdown(), markdownLivePreviewExtension],
      }),
    });

    await flushPreview();

    const blockquotes = Array.from(parent.querySelectorAll(".cm-live-preview-render blockquote"));
    expect(blockquotes).toHaveLength(CALLOUTS.length);
    CALLOUTS.forEach((expected, index) => {
      expect(blockquotes[index].className).toContain(expected.className);
      expect(blockquotes[index].textContent).toContain(expected.body);
      expect(blockquotes[index].textContent).not.toContain(`[!${expected.type}]`);
    });

    // CodeMirror may virtualize or split its DOM text, so the stable contract is the
    // editor state: the currently edited Callout must remain native Markdown.
    expect(view.state.doc.toString()).toContain(activeSource);
    expect(view.state.selection.main.from).toBe(doc.lastIndexOf("正在编辑"));

    view.destroy();
  });
});

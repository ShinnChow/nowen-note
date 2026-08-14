import { describe, expect, it } from "vitest";
import {
  hasMeaningfulClipboardHtml,
  shouldHandleAsMarkdownPaste,
} from "@/lib/pasteRouting";

describe("paste routing", () => {
  it("优先保留钉钉提供的富文本，而不是把数字列表误当作 Markdown 纯文本", () => {
    const html = `
      <h2 style="background-color:#b7d7ce">一、产品介绍说明</h2>
      <ul><li><strong>主光源：</strong>8 颗 6W 灯珠</li></ul>
    `;

    expect(hasMeaningfulClipboardHtml(html)).toBe(true);
    expect(shouldHandleAsMarkdownPaste(html, true)).toBe(false);
  });

  it("剪贴板只有 Markdown 纯文本时仍保留自动识别", () => {
    expect(shouldHandleAsMarkdownPaste("", true)).toBe(true);
    expect(shouldHandleAsMarkdownPaste("", false)).toBe(false);
  });

  it("只有剪贴板元信息的 HTML 空壳不会阻断 Markdown 识别", () => {
    const shell = '<html><head><meta charset="utf-8"></head><body></body></html>';

    expect(hasMeaningfulClipboardHtml(shell)).toBe(false);
    expect(shouldHandleAsMarkdownPaste(shell, true)).toBe(true);
  });
});

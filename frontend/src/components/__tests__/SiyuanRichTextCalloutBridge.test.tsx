// @vitest-environment jsdom

import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

import SiyuanRichTextCalloutBridge from "@/components/SiyuanRichTextCalloutBridge";

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("SiyuanRichTextCalloutBridge", () => {
  it("decorates Callouts inserted after the editor mounts", async () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(<SiyuanRichTextCalloutBridge />);
    });

    document.body.insertAdjacentHTML(
      "beforeend",
      '<div class="ProseMirror"><blockquote><p>[!TIP] Tip</p><p>正文</p></blockquote></div>',
    );

    await act(async () => {
      await Promise.resolve();
      callbacks.splice(0).forEach((callback) => callback(0));
    });

    expect(document.querySelector("blockquote")?.classList.contains("nowen-siyuan-callout")).toBe(true);

    await act(async () => {
      root.unmount();
    });
  });
});

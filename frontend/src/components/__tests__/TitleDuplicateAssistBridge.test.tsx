// @vitest-environment jsdom

import React, { act, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  activeNote: {
    id: "current",
    title: "ABCDEFGH当前",
    notebookId: "nb-1",
    isLocked: false,
    isTrashed: false,
  },
  getNotes: vi.fn(),
}));

vi.mock("@/store/AppContext", () => ({
  useApp: () => ({ state: { activeNote: mocks.activeNote, notesRefreshToken: 0 } }),
}));

vi.mock("@/lib/api", () => ({
  api: { getNotes: mocks.getNotes },
}));

vi.mock("@/lib/notePermissions", () => ({
  canWriteNote: () => true,
}));

import TitleDuplicateAssistBridge from "@/components/TitleDuplicateAssistBridge";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

function Harness() {
  const rootRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={rootRef}>
      <TitleDuplicateAssistBridge rootRef={rootRef} />
      <div data-mobile-editor-title="">
        <textarea defaultValue="ABCDEFGH当前" />
      </div>
    </div>
  );
}

describe("TitleDuplicateAssistBridge", () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    mocks.getNotes.mockResolvedValue([{
      id: "other",
      title: "ABCDEFGH历史",
      notebookId: "nb-1",
      isTrashed: 0,
    }]);
    vi.stubGlobal("ResizeObserver", class ResizeObserver {
      observe() {}
      disconnect() {}
      unobserve() {}
    });
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    document.querySelectorAll("[data-title-duplicate-mirror]").forEach((node) => node.remove());
    mocks.getNotes.mockReset();
    vi.unstubAllGlobals();
  });

  it("回车清理提示后，在仍聚焦的标题上再次点击会重建重复提示会话", async () => {
    await act(async () => root.render(<Harness />));
    await act(async () => Promise.resolve());

    const field = host.querySelector<HTMLTextAreaElement>("textarea")!;
    await act(async () => field.focus());
    expect(document.querySelector("[data-title-duplicate-mirror]")).not.toBeNull();

    await act(async () => {
      field.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    expect(document.activeElement).toBe(field);
    expect(document.querySelector("[data-title-duplicate-mirror]")).toBeNull();

    await act(async () => {
      field.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    });
    expect(document.querySelector("[data-title-duplicate-mirror]")).not.toBeNull();
  });
});

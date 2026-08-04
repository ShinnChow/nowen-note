import { describe, expect, it } from "vitest";
import { analyzeTiptapDocument } from "@/lib/tiptapAnalysis";

describe("analyzeTiptapDocument", () => {
  it("derives plain text, statistics and ProseMirror heading positions", () => {
    const result = analyzeTiptapDocument({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "开场 hello" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Second" }] },
      ],
    });

    expect(result.plainText).toBe("开场 hello\nSecond");
    expect(result.headings).toEqual([{ id: "h-0", level: 2, text: "Second", pos: 10 }]);
    expect(result.stats).toEqual({ chars: 15, charsNoSpace: 13, words: 4 });
  });

  it("keeps headings after legacy empty container nodes aligned with ProseMirror", () => {
    const result = analyzeTiptapDocument({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "上半部分" }] },
        // ProseMirror serializes an empty paragraph without a content property, but
        // the node still occupies two document positions.
        { type: "paragraph" },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                { type: "paragraph" },
              ],
            },
          ],
        },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "下半部分" }] },
      ],
    });

    expect(result.headings).toEqual([
      { id: "h-0", level: 1, text: "上半部分", pos: 0 },
      // First heading size: 7; empty paragraph: 2; bullet list: 6.
      { id: "h-1", level: 2, text: "下半部分", pos: 15 },
    ]);
  });

  it("still counts atom nodes as one position between headings", () => {
    const result = analyzeTiptapDocument({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "A" }] },
        { type: "image", attrs: { src: "/image.png" } },
        { type: "video", attrs: { src: "/video.mp4" } },
        { type: "mathBlock", attrs: { latex: "x^2" } },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "B" }] },
      ],
    });

    expect(result.headings).toEqual([
      { id: "h-0", level: 2, text: "A", pos: 0 },
      { id: "h-1", level: 2, text: "B", pos: 6 },
    ]);
  });
});

import { afterEach, describe, expect, it } from "vitest";

import {
  findKnowledgeTreeDropRow,
  hasExternalFilePayload,
  isMarkdownDropFile,
  markdownDropTitle,
  markdownFilesFromDataTransfer,
} from "@/lib/knowledgeTreeMarkdownDrop";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("knowledgeTreeMarkdownDrop", () => {
  it("accepts md and markdown files case-insensitively", () => {
    expect(isMarkdownDropFile({ name: "README.md" })).toBe(true);
    expect(isMarkdownDropFile({ name: "说明.MARKDOWN" })).toBe(true);
    expect(isMarkdownDropFile({ name: "notes.md.txt" })).toBe(false);
    expect(isMarkdownDropFile({ name: "archive.zip" })).toBe(false);
  });

  it("derives the note title from the file name", () => {
    expect(markdownDropTitle("产品需求.md")).toBe("产品需求");
    expect(markdownDropTitle("folder\\release.notes.MARKDOWN")).toBe("release.notes");
    expect(markdownDropTitle(".md")).toBe("未命名 Markdown");
  });

  it("detects an external file payload before the drop exposes File objects", () => {
    expect(hasExternalFilePayload({
      types: ["Files"] as unknown as DataTransfer["types"],
      items: [] as unknown as DataTransferItemList,
    })).toBe(true);
    expect(hasExternalFilePayload({
      types: ["text/plain"] as unknown as DataTransfer["types"],
      items: [] as unknown as DataTransferItemList,
    })).toBe(false);
  });

  it("keeps only Markdown files from a mixed drop", () => {
    const files = [
      new File(["# A"], "a.md", { type: "text/markdown" }),
      new File(["hello"], "b.txt", { type: "text/plain" }),
      new File(["# C"], "c.markdown", { type: "text/markdown" }),
    ];
    const selected = markdownFilesFromDataTransfer({
      files: files as unknown as FileList,
    });
    expect(selected.map((file) => file.name)).toEqual(["a.md", "c.markdown"]);
  });

  it("resolves a drop row only inside an embedded knowledge tree", () => {
    const tree = document.createElement("section");
    tree.dataset.nowenKnowledgeTree = "embedded";
    const row = document.createElement("div");
    row.dataset.knowledgeTreeNodeId = "folder-1";
    const label = document.createElement("span");
    row.appendChild(label);
    tree.appendChild(row);
    document.body.appendChild(tree);

    expect(findKnowledgeTreeDropRow(label)).toBe(row);

    const unrelated = document.createElement("div");
    unrelated.dataset.knowledgeTreeNodeId = "outside";
    document.body.appendChild(unrelated);
    expect(findKnowledgeTreeDropRow(unrelated)).toBeNull();
  });
});

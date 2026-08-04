import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relativeUrl: string) {
  return readFileSync(new URL(relativeUrl, import.meta.url), "utf8");
}

describe("startup chunking contract", () => {
  it("keeps heavy workspace routes behind exact lazy aliases", () => {
    const config = source("../../../vite.config.ts");

    for (const runtime of [
      "LazyEditorSplitViewRuntime.tsx",
      "LazyTaskCenterRuntime.tsx",
      "LazyMindMapEditorRuntime.tsx",
      "LazyDiaryCenterRuntime.tsx",
      "LazyFileManagerRuntime.tsx",
      "LazyShareManagementPageRuntime.tsx",
      "LazyNotebookShareJoinViewRuntime.tsx",
    ]) {
      expect(config).toContain(runtime);
    }
  });

  it("does not combine first-screen UI with archive and Markdown export vendors", () => {
    const config = source("../../../vite.config.ts");

    expect(config).toContain("'vendor-ui'");
    expect(config).toContain("'vendor-markdown'");
    expect(config).toContain("'vendor-archive'");
    expect(config).not.toContain("'vendor-lib'");
  });

  it("loads the editor body through React.lazy", () => {
    const runtime = source("../../components/EditorPaneRuntime.tsx");

    expect(runtime).toContain('React.lazy(() => import("./FormatAwareEditorPane"))');
    expect(runtime).toContain('React.lazy(() => import("./NoteSplitDialog"))');
    expect(runtime).not.toContain('import FormatAwareEditorPane from "./FormatAwareEditorPane"');
  });
});

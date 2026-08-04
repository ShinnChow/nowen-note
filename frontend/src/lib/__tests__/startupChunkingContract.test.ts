import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relativeUrl: string) {
  return readFileSync(new URL(relativeUrl, import.meta.url), "utf8");
}

describe("startup chunking contract", () => {
  it("keeps heavy workspace routes behind exact lazy aliases", () => {
    const config = source("../../../vite.config.ts");

    for (const runtime of [
      "LazyAIChatPanelRuntime.tsx",
      "LazySharedNoteViewRuntime.tsx",
      "LazySidebarRuntime.tsx",
      "LazyNavRailRuntime.tsx",
      "LazyNoteListRuntime.tsx",
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

  it("keeps AI and public sharing implementations outside the login chunk", () => {
    const aiRuntime = source("../../components/LazyAIChatPanelRuntime.tsx");
    const sharedRuntime = source("../../components/LazySharedNoteViewRuntime.tsx");

    expect(aiRuntime).toContain('React.lazy(() => import("./AIChatReliabilityShell"))');
    expect(sharedRuntime).toContain('React.lazy(() => import("./SharedNoteCommentDisplayRuntime"))');
  });

  it("does not statically import low-frequency feature centers from the entry module", () => {
    const main = source("../../main.tsx");
    const deferredMount = source("../../components/DeferredGlobalFeatureCentersMount.tsx");
    const deferredCenters = source("../../components/DeferredGlobalFeatureCenters.tsx");

    expect(main).toContain("<DeferredGlobalFeatureCentersMount />");
    expect(main).toContain('React.lazy(() => import("./App"))');
    expect(main).toContain('React.lazy(() => import("./components/PublicNotebookView"))');
    expect(main).not.toContain('import NoteImageExportCenter from "./components/NoteImageExportCenter"');
    expect(main).not.toContain('import DocxImportCenter from "./components/DocxImportCenter"');
    expect(deferredMount).toContain('import("./DeferredGlobalFeatureCenters")');
    expect(deferredMount).toContain("nowen:token-changed");
    expect(deferredCenters).toContain('import NoteImageExportCenter from "./NoteImageExportCenter"');
    expect(deferredCenters).toContain('import DocxImportCenter from "./DocxImportCenter"');
  });
});

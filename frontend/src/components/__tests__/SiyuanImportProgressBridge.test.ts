import { describe, expect, it } from "vitest";

import {
  inspectSiyuanEntryNames,
  isSiyuanImportRequest,
  normalizeSiyuanPackageName,
} from "@/components/SiyuanImportProgressBridge";

describe("SiyuanImportProgressBridge", () => {
  it("recognizes a SiYuan workspace by zip contents instead of the archive filename", () => {
    const inspection = inspectSiyuanEntryNames([
      "演示笔记/.siyuan/sort.json",
      "演示笔记/20260714132420-8dfzdrw.sy",
    ]);

    expect(inspection).toEqual({
      isSiyuanWorkspace: true,
      syFileCount: 1,
      rootName: "演示笔记",
    });
    expect(normalizeSiyuanPackageName("sy.zip", inspection.rootName)).toBe("演示笔记.sy.zip");
  });

  it("recognizes official data/<box>/<doc>.sy exports", () => {
    const inspection = inspectSiyuanEntryNames([
      "data/20240101000000-box/.siyuan/conf.json",
      "data/20240101000000-box/20260714132420-8dfzdrw.sy",
    ]);

    expect(inspection.isSiyuanWorkspace).toBe(true);
    expect(inspection.syFileCount).toBe(1);
    expect(inspection.rootName).toBe("");
    expect(normalizeSiyuanPackageName("backup.zip")).toBe("backup.sy.zip");
  });

  it("does not misclassify an ordinary Markdown zip", () => {
    expect(inspectSiyuanEntryNames([
      "notes/readme.md",
      "notes/assets/image.png",
    ])).toEqual({
      isSiyuanWorkspace: false,
      syFileCount: 0,
      rootName: "",
    });
  });

  it("matches only the server-side SiYuan package import endpoint", () => {
    expect(isSiyuanImportRequest("/api/export/import/siyuan-package?contentFormat=markdown")).toBe(true);
    expect(isSiyuanImportRequest("/api/export/import")).toBe(false);
    expect(isSiyuanImportRequest("/api/export/import/nowen-package")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { normalizeEmbeddableUrl, safeHtmlSchema } from "@/components/MarkdownPreview";

describe("MarkdownPreview issue 494 regressions", () => {
  it("keeps callout metadata when raw iframe HTML enables sanitization", () => {
    const globalAttributes = safeHtmlSchema.attributes?.["*"] || [];

    expect(globalAttributes).toEqual(expect.arrayContaining([
      "dataCalloutType",
      "dataCalloutTitle",
      "dataCalloutFold",
    ]));
  });

  it("decodes legacy double-escaped iframe query parameters", () => {
    const resolved = normalizeEmbeddableUrl(
      "https://pan.example.test/#/share?sid=kkrjkp7p&amp;p=XfN7xr",
    );

    expect(resolved?.url).toBe("https://pan.example.test/#/share?sid=kkrjkp7p&p=XfN7xr");
  });

  it("continues rejecting unsafe iframe protocols", () => {
    expect(normalizeEmbeddableUrl("javascript:alert(1)")).toBeNull();
  });
});

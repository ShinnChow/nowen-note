import assert from "node:assert/strict";
import test from "node:test";

import {
  createStaticAssetHeaders,
  isImmutableFrontendAsset,
  isStaticAssetNotModified,
} from "../src/lib/static-asset-response";

const stat = {
  size: 4_948_304,
  mtime: new Date("2026-08-04T09:00:00.000Z"),
  mtimeMs: Date.parse("2026-08-04T09:00:00.000Z"),
};

test("hashed Vite assets are immutable for one year", () => {
  assert.equal(
    isImmutableFrontendAsset("/assets/index-Bejiefi6.js", "/app/frontend/dist/assets/index-Bejiefi6.js"),
    true,
  );
  const headers = createStaticAssetHeaders(
    "/assets/index-Bejiefi6.js",
    "/app/frontend/dist/assets/index-Bejiefi6.js",
    stat,
  );
  assert.equal(headers["Cache-Control"], "public, max-age=31536000, immutable");
  assert.match(headers.ETag, /^W\/\"[a-f0-9]+-[a-f0-9]+\"$/);
});

test("HTML is revalidated and unhashed assets get a short cache", () => {
  assert.equal(
    createStaticAssetHeaders("/", "/app/frontend/dist/index.html", stat)["Cache-Control"],
    "no-cache",
  );
  assert.equal(
    createStaticAssetHeaders("/favicon.svg", "/app/frontend/dist/favicon.svg", stat)["Cache-Control"],
    "public, max-age=3600",
  );
});

test("conditional requests match ETag or Last-Modified", () => {
  const responseHeaders = createStaticAssetHeaders(
    "/assets/index-Bejiefi6.js",
    "/app/frontend/dist/assets/index-Bejiefi6.js",
    stat,
  );
  assert.equal(
    isStaticAssetNotModified(new Headers({ "If-None-Match": responseHeaders.ETag }), responseHeaders),
    true,
  );
  assert.equal(
    isStaticAssetNotModified(new Headers({ "If-Modified-Since": responseHeaders["Last-Modified"] }), responseHeaders),
    true,
  );
  assert.equal(isStaticAssetNotModified(new Headers(), responseHeaders), false);
});

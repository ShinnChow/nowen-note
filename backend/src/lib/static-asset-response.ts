import path from "node:path";
import type { Stats } from "node:fs";

const ONE_YEAR_SECONDS = 31_536_000;
const ONE_HOUR_SECONDS = 3_600;
const HASHED_ASSET_RE = /(?:^|[-.])[A-Za-z0-9_-]{8,}(?=\.[^.]+$)/;

export interface StaticAssetHeaders {
  "Cache-Control": string;
  ETag: string;
  "Last-Modified": string;
}

export function isImmutableFrontendAsset(requestPath: string, filePath: string): boolean {
  const normalizedRequestPath = requestPath.replace(/\\/g, "/");
  if (!normalizedRequestPath.includes("/assets/")) return false;
  return HASHED_ASSET_RE.test(path.basename(filePath));
}

export function createStaticAssetHeaders(
  requestPath: string,
  filePath: string,
  stat: Pick<Stats, "size" | "mtime" | "mtimeMs">,
): StaticAssetHeaders {
  const extension = path.extname(filePath).toLowerCase();
  const cacheControl = extension === ".html"
    ? "no-cache"
    : isImmutableFrontendAsset(requestPath, filePath)
      ? `public, max-age=${ONE_YEAR_SECONDS}, immutable`
      : `public, max-age=${ONE_HOUR_SECONDS}`;

  return {
    "Cache-Control": cacheControl,
    ETag: `W/\"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}\"`,
    "Last-Modified": stat.mtime.toUTCString(),
  };
}

export function isStaticAssetNotModified(
  requestHeaders: Headers,
  responseHeaders: StaticAssetHeaders,
): boolean {
  const ifNoneMatch = requestHeaders.get("if-none-match");
  if (ifNoneMatch && ifNoneMatch.split(",").map((value) => value.trim()).includes(responseHeaders.ETag)) {
    return true;
  }

  const ifModifiedSince = requestHeaders.get("if-modified-since");
  if (!ifModifiedSince) return false;
  const requestedTime = Date.parse(ifModifiedSince);
  const modifiedTime = Date.parse(responseHeaders["Last-Modified"]);
  return Number.isFinite(requestedTime)
    && Number.isFinite(modifiedTime)
    && modifiedTime <= requestedTime;
}

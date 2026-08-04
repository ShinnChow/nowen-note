import fs from "node:fs";
import path from "node:path";
import { Hono } from "hono";

import {
  createStaticAssetHeaders,
  isStaticAssetNotModified,
  mergeVaryHeader,
  selectStaticContentEncoding,
} from "../lib/static-asset-response.js";

const INSTALL_KEY = "__nowenStaticPrecompressedAssetsInstalled__" as const;

const MIME_TYPES: Record<string, string> = {
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".json": "application/json",
  ".mjs": "application/javascript",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".wasm": "application/wasm",
  ".xml": "application/xml",
};

function frontendRoot(): string {
  return path.resolve(
    process.env.FRONTEND_DIST || path.resolve(process.cwd(), "frontend/dist"),
  );
}

/**
 * Keep the legacy static path compatibility: desktop and reverse-proxy deployments may prepend
 * one or more path segments before /assets. Only explicit files are handled here; document routes
 * continue through the original SPA handler so web_ui_enabled and CSP behavior stay unchanged.
 */
export function resolvePrecompressedSourcePath(requestPath: string): string | null {
  if (path.extname(requestPath) === "") return null;

  const root = frontendRoot();
  const normalizedPath = requestPath.startsWith("/") ? requestPath : `/${requestPath}`;
  const candidates = [normalizedPath];
  const parts = normalizedPath.split("/").filter(Boolean);
  for (let index = 1; index < parts.length; index += 1) {
    candidates.push(`/${parts.slice(index).join("/")}`);
  }

  for (const candidate of candidates) {
    const filePath = path.resolve(root, `.${candidate}`);
    if (filePath === root || !filePath.startsWith(root + path.sep)) continue;
    if (!MIME_TYPES[path.extname(filePath).toLowerCase()]) continue;
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return filePath;
  }
  return null;
}

async function tryServePrecompressedAsset(c: any): Promise<Response | null> {
  const sourcePath = resolvePrecompressedSourcePath(c.req.path);
  if (!sourcePath) return null;

  const brPath = `${sourcePath}.br`;
  const gzipPath = `${sourcePath}.gz`;
  const encoding = selectStaticContentEncoding(c.req.header("accept-encoding"), {
    br: fs.existsSync(brPath),
    gzip: fs.existsSync(gzipPath),
  });
  if (!encoding) return null;

  const representationPath = encoding === "br" ? brPath : gzipPath;
  const stat = await fs.promises.stat(representationPath);
  const headers = createStaticAssetHeaders(c.req.path, sourcePath, stat);
  // ETags must identify the selected representation, not only the source filename.
  headers.ETag = headers.ETag.replace(/"$/, `-${encoding}"`);

  for (const [name, value] of Object.entries(headers)) c.header(name, value);
  c.header("Content-Encoding", encoding);
  c.header(
    "Vary",
    mergeVaryHeader(c.res?.headers?.get?.("Vary"), "Accept-Encoding"),
  );

  if (isStaticAssetNotModified(c.req.raw.headers, headers)) {
    return c.body(null, 304);
  }

  const contentType = MIME_TYPES[path.extname(sourcePath).toLowerCase()];
  const content = await fs.promises.readFile(representationPath);
  return c.body(content, 200, { "Content-Type": contentType });
}

export function installStaticPrecompressedAssetRuntime(): void {
  const globalState = globalThis as typeof globalThis & {
    __nowenStaticPrecompressedAssetsInstalled__?: boolean;
  };
  if (globalState[INSTALL_KEY]) return;
  globalState[INSTALL_KEY] = true;

  const originalGet = Hono.prototype.get as any;
  (Hono.prototype as any).get = function patchedGet(...args: any[]) {
    const [routePath, ...handlers] = args;
    if (routePath !== "*" || handlers.length !== 1 || typeof handlers[0] !== "function") {
      return originalGet.apply(this, args);
    }

    const originalHandler = handlers[0];
    return originalGet.call(this, routePath, async (c: any, next: any) => {
      if (
        process.env.NODE_ENV === "production"
        && !c.req.path.startsWith("/api")
        && (c.req.method === "GET" || c.req.method === "HEAD")
      ) {
        const response = await tryServePrecompressedAsset(c);
        if (response) return response;
      }
      return originalHandler(c, next);
    });
  };
}

installStaticPrecompressedAssetRuntime();

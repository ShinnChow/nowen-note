import type { Context, Next } from "hono";

import { getDb } from "../db/schema.js";
import {
  hasKnowledgeCapability,
  resolveResourceKnowledgeAccess,
} from "../services/knowledgeCapabilities.js";

function replaceJsonResponse(c: Context, payload: unknown, status = c.res.status): void {
  const headers = new Headers(c.res.headers);
  headers.delete("content-length");
  headers.set("content-type", "application/json; charset=UTF-8");
  headers.set("cache-control", "private, no-store");
  c.res = new Response(JSON.stringify(payload), {
    status,
    statusText: c.res.statusText,
    headers,
  });
}

async function readJsonResponse(c: Context): Promise<any | null> {
  if (!c.res.ok) return null;
  const contentType = c.res.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) return null;
  try {
    return await c.res.clone().json();
  } catch {
    return null;
  }
}

function attachmentNoteId(attachmentId: string): string | null {
  const row = getDb().prepare("SELECT noteId FROM attachments WHERE id = ?")
    .get(attachmentId) as { noteId: string } | undefined;
  return row?.noteId || null;
}

function noteIdFromFileRow(row: any): string | null {
  if (typeof row?.noteId === "string") return row.noteId;
  if (typeof row?.primaryNote?.id === "string") return row.primaryNote.id;
  if (typeof row?.id === "string") return attachmentNoteId(row.id);
  return null;
}

function accessForNote(noteId: string, userId: string) {
  return resolveResourceKnowledgeAccess("note", noteId, userId);
}

function canViewFileRow(row: any, userId: string): boolean {
  const noteId = noteIdFromFileRow(row);
  return Boolean(noteId && hasKnowledgeCapability(accessForNote(noteId, userId), "canView"));
}

function canDownloadAttachment(attachmentId: string, userId: string): boolean {
  const noteId = attachmentNoteId(attachmentId);
  return Boolean(noteId && hasKnowledgeCapability(accessForNote(noteId, userId), "canDownload"));
}

function filterAccessUrls(value: unknown, userId: string): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(([attachmentId, url]) =>
      typeof url === "string" && canDownloadAttachment(attachmentId, userId),
    ),
  ) as Record<string, string>;
}

function sanitizeFileRow(row: any, userId: string): any | null {
  if (!canViewFileRow(row, userId)) return null;
  const attachmentId = typeof row?.id === "string" ? row.id : "";
  const downloadable = attachmentId ? canDownloadAttachment(attachmentId, userId) : false;
  const references = Array.isArray(row?.references)
    ? row.references.filter((reference: any) => {
        const noteId = typeof reference?.id === "string"
          ? reference.id
          : (typeof reference?.noteId === "string" ? reference.noteId : "");
        return noteId && hasKnowledgeCapability(accessForNote(noteId, userId), "canView");
      })
    : row?.references;

  if (downloadable) return { ...row, references, downloadAllowed: true };
  const sanitized = { ...row, references, downloadAllowed: false };
  delete sanitized.url;
  delete sanitized.thumbnailUrl;
  delete sanitized.downloadUrl;
  return sanitized;
}

function visibleAttachmentStats(workspaceId: string | null, userId: string) {
  const db = getDb();
  const rows = workspaceId
    ? db.prepare(`
        SELECT a.id, a.noteId, a.mimeType, a.size
        FROM attachments a
        JOIN notes n ON n.id = a.noteId
        WHERE a.workspaceId = ?
      `).all(workspaceId)
    : db.prepare(`
        SELECT a.id, a.noteId, a.mimeType, a.size
        FROM attachments a
        JOIN notes n ON n.id = a.noteId
        WHERE a.workspaceId IS NULL AND a.userId = ?
      `).all(userId) as Array<{ id: string; noteId: string; mimeType: string; size: number }>;

  const byMime = new Map<string, { count: number; bytes: number }>();
  let total = 0;
  let totalBytes = 0;
  let imageCount = 0;
  let imageBytes = 0;
  let fileCount = 0;
  let fileBytes = 0;

  for (const row of rows as Array<{ id: string; noteId: string; mimeType: string; size: number }>) {
    const access = accessForNote(row.noteId, userId);
    if (!hasKnowledgeCapability(access, "canView")) continue;
    total += 1;
    totalBytes += Number(row.size || 0);
    const mime = row.mimeType || "application/octet-stream";
    const stats = byMime.get(mime) || { count: 0, bytes: 0 };
    stats.count += 1;
    stats.bytes += Number(row.size || 0);
    byMime.set(mime, stats);
    if (mime.toLowerCase().startsWith("image/")) {
      imageCount += 1;
      imageBytes += Number(row.size || 0);
    } else {
      fileCount += 1;
      fileBytes += Number(row.size || 0);
    }
  }

  return {
    total,
    totalBytes,
    images: { count: imageCount, bytes: imageBytes },
    files: { count: fileCount, bytes: fileBytes },
    byMime: [...byMime.entries()].map(([mime, value]) => ({ mime, ...value })),
  };
}

/** Filter file-manager metadata and signed URLs through the owning note's access. */
export async function enforceKnowledgeFilesVisibility(c: Context, next: Next): Promise<void> {
  if (c.req.method.toUpperCase() !== "GET") {
    await next();
    return;
  }

  await next();
  const payload = await readJsonResponse(c);
  if (!payload || typeof payload !== "object") return;
  const userId = c.req.header("X-User-Id") || "";
  const path = c.req.path.replace(/\/+$/, "");

  if (path.endsWith("/stats")) {
    const rawWorkspaceId = (c.req.query("workspaceId") || "").trim();
    const workspaceId = rawWorkspaceId && rawWorkspaceId !== "personal" ? rawWorkspaceId : null;
    const stats = visibleAttachmentStats(workspaceId, userId);
    replaceJsonResponse(c, {
      ...payload,
      ...stats,
      unreferenced: { count: 0, bytes: 0 },
    });
    return;
  }

  if (Array.isArray(payload.items)) {
    const items = payload.items
      .map((row: any) => sanitizeFileRow(row, userId))
      .filter(Boolean);
    replaceJsonResponse(c, {
      ...payload,
      items,
      accessUrls: filterAccessUrls(payload.accessUrls, userId),
      total: items.length,
    });
    return;
  }

  if (typeof payload.id === "string") {
    const sanitized = sanitizeFileRow(payload, userId);
    if (!sanitized) {
      replaceJsonResponse(c, { error: "文件不存在", code: "FILE_NOT_FOUND" }, 404);
      return;
    }
    replaceJsonResponse(c, {
      ...sanitized,
      accessUrls: filterAccessUrls(payload.accessUrls, userId),
    });
  }
}

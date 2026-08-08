import type { Note } from "@/types";
import {
  getNote as getCachedNote,
  isNoteDetailCached,
  putNote,
  type CachedNote,
} from "@/lib/localStore";

export interface CacheFirstNoteLoadOptions {
  noteId: string;
  fetchRemote: () => Promise<Note>;
  onRevalidated?: (remote: Note, cached: CachedNote) => void | Promise<void>;
  /**
   * Called before a cached note becomes visible. Use this for lightweight runtime prerequisites
   * that are normally prepared by the remote note request (for example signed attachment access).
   * Failures are non-fatal so offline cached-note opening keeps working.
   */
  beforeUseCached?: (cached: CachedNote) => void | Promise<void>;
}

export interface RevalidatedNoteGuardInput {
  current: Note | null | undefined;
  cached: Note;
  remote: Note;
  hasDraft: boolean;
  pendingNoteId: string | null;
}

export function canApplyRevalidatedNote({
  current,
  cached,
  remote,
  hasDraft,
  pendingNoteId,
}: RevalidatedNoteGuardInput): boolean {
  if (!current || hasDraft || pendingNoteId) return false;
  if (current.id !== cached.id || remote.id !== cached.id) return false;
  if (remote.version <= cached.version) return false;

  return current.version === cached.version
    && current.title === cached.title
    && current.content === cached.content
    && current.contentText === cached.contentText
    && current.updatedAt === cached.updatedAt;
}

async function persistDetail(note: Note): Promise<void> {
  await putNote({ ...note, __detailCached: true });
}

export async function loadNoteCacheFirst({
  noteId,
  fetchRemote,
  onRevalidated,
  beforeUseCached,
}: CacheFirstNoteLoadOptions): Promise<Note> {
  const cached = await getCachedNote(noteId);
  if (cached && isNoteDetailCached(cached)) {
    // Start freshness revalidation immediately, but do not let cache-first rendering race runtime
    // prerequisites that the remote request normally prepares (attachment access is the P1 case).
    void fetchRemote()
      .then(async (remote) => {
        await persistDetail(remote);
        await onRevalidated?.(remote, cached);
      })
      .catch((error) => {
        console.warn("[noteLoadSource] background revalidation failed:", error);
      });

    if (beforeUseCached) {
      try {
        await beforeUseCached(cached);
      } catch (error) {
        // Cached notes must remain available offline. The background revalidation above may still
        // recover the runtime prerequisite when connectivity returns.
        console.warn("[noteLoadSource] cached-note preparation failed:", error);
      }
    }
    return cached;
  }

  const remote = await fetchRemote();
  await persistDetail(remote);
  return remote;
}

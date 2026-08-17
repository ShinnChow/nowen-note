export interface NoteActivationIntent {
  requestId: number;
  noteId: string;
}

/**
 * Keeps the user's latest note-open intent authoritative until React has committed that note.
 *
 * A note switch flushes the old editor before loading the new note. The old save can finish in
 * the narrow window after SET_ACTIVE_NOTE(new) was dispatched but before EditorPane rendered the
 * new note, so an old save acknowledgement may still observe the old activeNote ref and dispatch
 * SET_ACTIVE_NOTE(old) again. This guard rejects that stale activation at the shared AppContext
 * dispatch boundary without cancelling the old note's actual persistence request.
 */
export class NoteActivationGuard {
  private intent: (NoteActivationIntent & {
    sourceNoteId: string | null;
    targetDispatched: boolean;
  }) | null = null;

  begin(intent: NoteActivationIntent, sourceNoteId: string | null): void {
    this.intent = { ...intent, sourceNoteId, targetDispatched: false };
  }

  allowActiveNote(noteId: string | null): boolean {
    const intent = this.intent;
    if (!intent || noteId === null) return true;

    if (noteId === intent.noteId) {
      intent.targetDispatched = true;
      return true;
    }

    // While the target is still loading, the source note remains the visible/authoritative note.
    // Its save acknowledgements are safe and must keep updating version/sync metadata. Once the
    // target activation has been dispatched, however, the source is stale until React commits it.
    if (!intent.targetDispatched && noteId === intent.sourceNoteId) return true;

    return false;
  }

  fail(requestId: number): void {
    if (this.intent?.requestId === requestId) this.intent = null;
  }

  finish(requestId: number): void {
    const intent = this.intent;
    if (!intent || intent.requestId !== requestId) return;
    // A finish without ever dispatching the target note is a cancellation. A successful load
    // stays guarded until commit(), because React may batch SET_ACTIVE_NOTE and FINISH_NOTE_LOAD.
    if (!intent.targetDispatched) this.intent = null;
  }

  commit(activeNoteId: string | null): void {
    const intent = this.intent;
    if (!intent || !intent.targetDispatched) return;
    if (activeNoteId === intent.noteId) this.intent = null;
  }
}

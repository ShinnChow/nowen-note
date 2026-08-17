import { describe, expect, it } from "vitest";

import { NoteActivationGuard } from "@/lib/noteActivationGuard";

describe("NoteActivationGuard", () => {
  it("blocks the previous note until the requested note is committed", () => {
    const guard = new NoteActivationGuard();
    guard.begin({ requestId: 1, noteId: "note-b" });

    expect(guard.allowActiveNote("note-a")).toBe(false);
    expect(guard.allowActiveNote("note-b")).toBe(true);

    // NoteLoadCoordinator finishes in the same async turn as SET_ACTIVE_NOTE. Keep guarding until
    // React has actually committed note-b, otherwise a late save ack from note-a can win the race.
    guard.finish(1);
    expect(guard.allowActiveNote("note-a")).toBe(false);

    guard.commit("note-b");
    expect(guard.allowActiveNote("note-a")).toBe(true);
  });

  it("releases the guard when a load is cancelled before the target is activated", () => {
    const guard = new NoteActivationGuard();
    guard.begin({ requestId: 2, noteId: "note-b" });

    guard.finish(2);

    expect(guard.allowActiveNote("note-a")).toBe(true);
  });

  it("releases the guard when a load fails", () => {
    const guard = new NoteActivationGuard();
    guard.begin({ requestId: 3, noteId: "note-b" });

    guard.fail(3);

    expect(guard.allowActiveNote("note-a")).toBe(true);
  });

  it("keeps the newest load intent authoritative", () => {
    const guard = new NoteActivationGuard();
    guard.begin({ requestId: 4, noteId: "note-b" });
    guard.begin({ requestId: 5, noteId: "note-c" });

    expect(guard.allowActiveNote("note-b")).toBe(false);
    expect(guard.allowActiveNote("note-c")).toBe(true);
  });
});

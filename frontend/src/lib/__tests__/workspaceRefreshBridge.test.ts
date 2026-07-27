// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const realtimeHarness = vi.hoisted(() => {
  const listeners = new Map<string, (payload: unknown) => void>();
  const on = vi.fn((event: string, listener: (payload: unknown) => void) => {
    listeners.set(event, listener);
    return () => listeners.delete(event);
  });
  return { listeners, on };
});

vi.mock("@/lib/realtime", () => ({
  realtime: { on: realtimeHarness.on },
}));
vi.mock("@/lib/syncEngine", () => ({
  SYNC_SNAPSHOT_APPLIED_EVENT: "sync-snapshot-applied",
  syncNow: vi.fn(),
}));

describe("workspace refresh button placement", () => {
  beforeEach(() => {
    vi.resetModules();
    realtimeHarness.listeners.clear();
    realtimeHarness.on.mockClear();
    document.body.innerHTML = `
      <div>
        <button data-nowen-notebook-sort type="button">sort</button>
        <button type="button"><svg class="lucide-panel-left-close"></svg></button>
      </div>`;
  });

  afterEach(() => {
    (window as Window & { __NOWEN_WORKSPACE_REFRESH_BRIDGE__?: () => void })
      .__NOWEN_WORKSPACE_REFRESH_BRIDGE__?.();
    document.body.innerHTML = "";
  });

  it("mounts immediately before the notebook sort button", async () => {
    await import("@/lib/workspaceRefreshBridge");

    const refresh = document.querySelector<HTMLButtonElement>("button[data-nowen-workspace-refresh]");
    const sort = document.querySelector<HTMLButtonElement>("button[data-nowen-notebook-sort]");

    expect(refresh).not.toBeNull();
    expect(refresh?.nextElementSibling).toBe(sort);
  });

  it("refreshes the knowledge tree when an import broadcasts notes:imported", async () => {
    const changed = vi.fn();
    window.addEventListener("nowen:knowledge-tree-changed", changed, { once: true });
    await import("@/lib/workspaceRefreshBridge");

    realtimeHarness.listeners.get("notes:imported")?.({ reason: "siyuan-import" });

    expect(changed).toHaveBeenCalledTimes(1);
    const event = changed.mock.calls[0][0] as CustomEvent<{ reason: string }>;
    expect(event.detail.reason).toBe("siyuan-import");
  });
});

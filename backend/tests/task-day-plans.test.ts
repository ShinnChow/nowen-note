import assert from "node:assert/strict";
import test from "node:test";
import { Hono } from "hono";
import taskDayPlans, {
  isTaskDayPlanDate,
  normalizeTaskDayPlanIds,
} from "../src/routes/task-day-plans";

const app = new Hono();
app.route("/user-preferences/task-day-plans", taskDayPlans);

function request(path: string, init?: RequestInit) {
  return app.request(path, {
    ...init,
    headers: {
      "X-User-Id": "my-day-test-user",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  });
}

test("task day plan date validation accepts real calendar dates", () => {
  assert.equal(isTaskDayPlanDate("2026-08-02"), true);
  assert.equal(isTaskDayPlanDate("2028-02-29"), true);
  assert.equal(isTaskDayPlanDate("2026-02-29"), false);
  assert.equal(isTaskDayPlanDate("2026-02-30"), false);
  assert.equal(isTaskDayPlanDate("2026-8-2"), false);
  assert.equal(isTaskDayPlanDate(null), false);
});

test("task day plan ids are trimmed, deduplicated and bounded", () => {
  assert.deepEqual(
    normalizeTaskDayPlanIds([" task-a ", "task-a", "", 42, "task-b", "task-c"], 2),
    ["task-a", "task-b"],
  );
});

test("task day plan ids reject oversized values", () => {
  assert.deepEqual(
    normalizeTaskDayPlanIds(["x".repeat(129), "valid-task"]),
    ["valid-task"],
  );
});

test("My Day route works without a trailing slash and persists an empty plan", async () => {
  const invalid = await request(
    "/user-preferences/task-day-plans?date=invalid&workspaceId=personal",
  );
  assert.equal(invalid.status, 400);

  const saved = await request("/user-preferences/task-day-plans", {
    method: "PUT",
    body: JSON.stringify({
      date: "2026-08-02",
      workspaceId: "personal",
      taskIds: [],
      focusTaskIds: [],
    }),
  });
  assert.equal(saved.status, 200);
  assert.deepEqual(await saved.json(), {
    date: "2026-08-02",
    workspaceId: "personal",
    taskIds: [],
    focusTaskIds: [],
    updatedAt: (await request(
      "/user-preferences/task-day-plans?date=2026-08-02&workspaceId=personal",
    ).then((response) => response.json())).updatedAt,
  });

  const loaded = await request(
    "/user-preferences/task-day-plans?date=2026-08-02&workspaceId=personal",
  );
  assert.equal(loaded.status, 200);
  const payload = await loaded.json() as Record<string, unknown>;
  assert.equal(payload.date, "2026-08-02");
  assert.equal(payload.workspaceId, "personal");
  assert.deepEqual(payload.taskIds, []);
  assert.deepEqual(payload.focusTaskIds, []);
  assert.equal(typeof payload.updatedAt, "string");
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  isTaskDayPlanDate,
  normalizeTaskDayPlanIds,
} from "../src/routes/task-day-plans";

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

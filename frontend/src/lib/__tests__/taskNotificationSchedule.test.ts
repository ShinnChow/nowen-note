import { describe, expect, it } from "vitest";
import {
  resolveTaskReminderDate,
  selectSchedulableTaskReminders,
  taskReminderNotificationId,
  type TaskReminderScheduleItem,
} from "@/lib/taskNotificationSchedule";

function item(overrides: Partial<TaskReminderScheduleItem> = {}): TaskReminderScheduleItem {
  return {
    reminderId: "reminder-1",
    taskId: "task-1",
    taskTitle: "Write release notes",
    reminderAt: "2030-01-01T09:00:00.000Z",
    dueAt: "2030-01-01T09:30:00.000Z",
    dueDate: null,
    snoozedUntil: null,
    offsetMinutes: 30,
    ...overrides,
  };
}

describe("task notification schedule", () => {
  it("subtracts the reminder offset from a timed due date", () => {
    expect(resolveTaskReminderDate(item())?.toISOString()).toBe("2030-01-01T09:00:00.000Z");
  });

  it("uses snoozedUntil as the authoritative schedule", () => {
    expect(resolveTaskReminderDate(item({ snoozedUntil: "2030-01-02T08:00:00.000Z" }))?.toISOString())
      .toBe("2030-01-02T08:00:00.000Z");
  });

  it("interprets all-day due dates in the device timezone", () => {
    const resolved = resolveTaskReminderDate(item({
      dueAt: null,
      dueDate: "2030-03-10",
      offsetMinutes: 60,
    }));
    const expected = new Date("2030-03-10T22:59:59");
    expect(resolved?.getTime()).toBe(expected.getTime());
  });

  it("returns a stable positive Android notification id", () => {
    const first = taskReminderNotificationId("same-reminder");
    expect(first).toBe(taskReminderNotificationId("same-reminder"));
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThanOrEqual(0x7fffffff);
  });

  it("drops elapsed reminders and orders future reminders", () => {
    const selected = selectSchedulableTaskReminders([
      item({ reminderId: "later", dueAt: "2030-01-01T12:00:00.000Z", offsetMinutes: 0 }),
      item({ reminderId: "past", dueAt: "2020-01-01T12:00:00.000Z", offsetMinutes: 0 }),
      item({ reminderId: "earlier", dueAt: "2030-01-01T10:00:00.000Z", offsetMinutes: 0 }),
    ], "android", new Date("2029-01-01T00:00:00.000Z").getTime());

    expect(selected.map((entry) => entry.reminderId)).toEqual(["earlier", "later"]);
  });
});

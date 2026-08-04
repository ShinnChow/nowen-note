export const TASK_REMINDER_SYNC_EVENT = "nowen:task-reminders-changed";
export const TASK_NOTIFICATION_OPEN_EVENT = "nowen:task-notification-open";

export interface TaskReminderScheduleItem {
  reminderId: string;
  taskId: string;
  taskTitle: string;
  reminderAt: string;
  dueAt: string | null;
  dueDate: string | null;
  snoozedUntil: string | null;
  offsetMinutes: number;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Resolve the notification time in the device timezone.
 *
 * All-day dueDate values intentionally use the device's local end-of-day rather
 * than the server timezone. This keeps a self-hosted server in another timezone
 * from moving an Android reminder to the previous or next day.
 */
export function resolveTaskReminderDate(item: TaskReminderScheduleItem): Date | null {
  const snoozed = parseDate(item.snoozedUntil);
  if (snoozed) return snoozed;

  const dueAt = parseDate(item.dueAt);
  if (dueAt) {
    return new Date(dueAt.getTime() - item.offsetMinutes * 60_000);
  }

  if (item.dueDate) {
    const localEndOfDay = parseDate(`${item.dueDate}T23:59:59`);
    if (localEndOfDay) {
      return new Date(localEndOfDay.getTime() - item.offsetMinutes * 60_000);
    }
  }

  return parseDate(item.reminderAt);
}

/** Stable positive 31-bit id accepted by Android's notification manager. */
export function taskReminderNotificationId(reminderId: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < reminderId.length; i += 1) {
    hash ^= reminderId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const value = (hash >>> 0) & 0x7fffffff;
  return value === 0 ? 1 : value;
}

export function selectSchedulableTaskReminders(
  reminders: TaskReminderScheduleItem[],
  platform: "android" | "ios" | "web",
  now = Date.now(),
): Array<TaskReminderScheduleItem & { notificationId: number; scheduleAt: Date }> {
  const maxItems = platform === "ios" ? 60 : 500;
  const seenIds = new Set<number>();

  return reminders
    .map((item) => {
      const scheduleAt = resolveTaskReminderDate(item);
      if (!scheduleAt || scheduleAt.getTime() <= now + 500) return null;

      let notificationId = taskReminderNotificationId(item.reminderId);
      while (seenIds.has(notificationId)) {
        notificationId = notificationId >= 0x7ffffffe ? 1 : notificationId + 1;
      }
      seenIds.add(notificationId);
      return { ...item, notificationId, scheduleAt };
    })
    .filter((item): item is TaskReminderScheduleItem & { notificationId: number; scheduleAt: Date } => !!item)
    .sort((a, b) => a.scheduleAt.getTime() - b.scheduleAt.getTime())
    .slice(0, maxItems);
}

export function emitTaskReminderScheduleChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(TASK_REMINDER_SYNC_EVENT));
}

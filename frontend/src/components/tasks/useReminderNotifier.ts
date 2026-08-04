import { useEffect, useRef } from "react";
import { App as CapApp } from "@capacitor/app";
import i18n from "i18next";
import { api } from "@/lib/api";
import { TASK_REMINDER_SYNC_EVENT } from "@/lib/taskNotificationSchedule";
import {
  getTaskNotificationPermission,
  getTaskNotificationSurface,
  registerTaskNotificationActionListener,
  showImmediateTaskNotification,
  syncNativeTaskNotifications,
} from "@/lib/taskNotifications";

/**
 * Global reminder runtime.
 *
 * Native strategy:
 *   1. Fetch every future reminder from the server and schedule it through
 *      Capacitor Local Notifications. Android can then notify while the WebView
 *      is hidden, the screen is locked, or the process is not running.
 *   2. Resync on login, foreground, task/reminder mutations and server changes.
 *   3. Keep the recent-reminder endpoint for automation notifications and for
 *      Web/Electron fallback delivery.
 *   4. ACK only after a notification is delivered or a native schedule is known
 *      to be active. The backend therefore never marks an unseen reminder as
 *      delivered merely because its scanner found it.
 */

interface RecentReminder {
  reminderId: string;
  taskId: string;
  taskTitle: string;
  triggeredAt: number;
  type?: string;
}

const globalKey = "__nowen_notified_set__";
const notifiedSet: Set<string> = typeof window === "undefined"
  ? new Set()
  : ((window as any)[globalKey] || ((window as any)[globalKey] = new Set()));

function notificationCopy(reminder: RecentReminder): { title: string; body: string } {
  const type = reminder.type || "task_reminder";
  if (type === "dependency_ready") {
    return {
      title: `✅ ${i18n.t("tasks.notifications.dependencyReadyTitle")}`,
      body: i18n.t("tasks.notifications.dependencyReadyBody", { taskTitle: reminder.taskTitle }),
    };
  }
  if (type === "overdue_daily") {
    return {
      title: `⚠️ ${i18n.t("tasks.notifications.overdueDailyTitle")}`,
      body: i18n.t("tasks.notifications.overdueDailyBody", { taskTitle: reminder.taskTitle }),
    };
  }
  return {
    title: `⏰ ${i18n.t("tasks.notifications.taskReminderTitle")}`,
    body: i18n.t("tasks.notifications.taskReminderBody", { taskTitle: reminder.taskTitle }),
  };
}

export function useReminderNotifier(onOpenTask?: (taskId: string) => void) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastScanRef = useRef<number>(Date.now());
  const nativeSchedulesReadyRef = useRef(false);
  const onOpenTaskRef = useRef(onOpenTask);
  onOpenTaskRef.current = onOpenTask;

  useEffect(() => {
    let disposed = false;
    let removeActionListener: (() => void) | null = null;
    let appStateHandle: { remove: () => Promise<void> } | null = null;

    const syncNativeSchedules = async (): Promise<boolean> => {
      if (getTaskNotificationSurface() !== "native") return true;
      try {
        const permission = await getTaskNotificationPermission();
        if (permission !== "granted") {
          nativeSchedulesReadyRef.current = false;
          return false;
        }
        const { reminders } = await api.getTaskReminderSchedule();
        const synced = await syncNativeTaskNotifications(reminders || []);
        nativeSchedulesReadyRef.current = synced;
        return synced;
      } catch (error) {
        nativeSchedulesReadyRef.current = false;
        console.warn("[reminder] native schedule sync failed", error);
        return false;
      }
    };

    const scan = async () => {
      const scanStartedAt = Date.now();
      let nextSince = scanStartedAt;
      try {
        const { reminders } = await api.getRecentReminders(lastScanRef.current);
        const recent: RecentReminder[] = reminders || [];
        const surface = getTaskNotificationSurface();

        for (const reminder of recent) {
          if (notifiedSet.has(reminder.reminderId)) continue;

          const type = reminder.type || "task_reminder";
          if (surface === "native" && type === "task_reminder") {
            if (!nativeSchedulesReadyRef.current) {
              await syncNativeSchedules();
            }
            if (nativeSchedulesReadyRef.current) {
              notifiedSet.add(reminder.reminderId);
              await api.ackRecentReminders([reminder.reminderId]);
            } else {
              nextSince = Math.min(nextSince, reminder.triggeredAt - 1);
            }
            continue;
          }

          const copy = notificationCopy(reminder);
          const delivered = await showImmediateTaskNotification(copy.title, copy.body, {
            requestPermission: false,
            taskId: reminder.taskId,
            reminderId: reminder.reminderId,
            type,
          });

          if (delivered) {
            notifiedSet.add(reminder.reminderId);
            await api.ackRecentReminders([reminder.reminderId]);
          } else {
            nextSince = Math.min(nextSince, reminder.triggeredAt - 1);
          }
        }
      } catch {
        nextSince = lastScanRef.current;
      }
      lastScanRef.current = Math.max(0, nextSince);
    };

    const startPolling = () => {
      if (timerRef.current) return;
      timerRef.current = setInterval(scan, 30_000);
    };

    const stopPolling = () => {
      if (!timerRef.current) return;
      clearInterval(timerRef.current);
      timerRef.current = null;
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void syncNativeSchedules();
        void scan();
        startPolling();
      } else {
        stopPolling();
      }
    };

    const onScheduleChanged = () => {
      void syncNativeSchedules();
    };

    void registerTaskNotificationActionListener((taskId) => {
      onOpenTaskRef.current?.(taskId);
    }).then((remove) => {
      if (disposed) remove();
      else removeActionListener = remove;
    }).catch(() => {});

    void CapApp.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) return;
      void syncNativeSchedules();
      void scan();
    }).then((handle) => {
      if (disposed) void handle.remove();
      else appStateHandle = handle;
    }).catch(() => {});

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(TASK_REMINDER_SYNC_EVENT, onScheduleChanged);
    window.addEventListener("nowen:server-url-changed", onScheduleChanged);
    window.addEventListener("nowen:workspace-changed", onScheduleChanged);

    void syncNativeSchedules();
    const initialTimeout = setTimeout(() => { void scan(); }, 3_000);
    if (document.visibilityState === "visible") startPolling();

    return () => {
      disposed = true;
      clearTimeout(initialTimeout);
      stopPolling();
      removeActionListener?.();
      if (appStateHandle) void appStateHandle.remove();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(TASK_REMINDER_SYNC_EVENT, onScheduleChanged);
      window.removeEventListener("nowen:server-url-changed", onScheduleChanged);
      window.removeEventListener("nowen:workspace-changed", onScheduleChanged);
    };
  }, []);
}

import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function write(path, content) {
  fs.writeFileSync(path, content);
}

function replaceOnce(path, needle, replacement) {
  const source = read(path);
  if (!source.includes(needle)) {
    throw new Error(`Missing replacement target in ${path}: ${needle.slice(0, 120)}`);
  }
  write(path, source.replace(needle, replacement));
}

// 1. Capacitor plugin dependency.
{
  const path = 'frontend/package.json';
  const pkg = JSON.parse(read(path));
  pkg.dependencies ||= {};
  pkg.dependencies['@capacitor/local-notifications'] = '^8.0.0';
  pkg.dependencies = Object.fromEntries(Object.entries(pkg.dependencies).sort(([a], [b]) => a.localeCompare(b)));
  write(path, `${JSON.stringify(pkg, null, 2)}\n`);
}

// 2. Android runtime and exact-alarm permissions.
replaceOnce(
  'frontend/android/app/src/main/AndroidManifest.xml',
  '    <uses-permission android:name="android.permission.INTERNET" />',
  `    <uses-permission android:name="android.permission.INTERNET" />\n    <!-- Android 13+ notification runtime permission. -->\n    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\n    <!-- Android 12+ exact task alarms. Users may still disable exact alarms in system settings. -->\n    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />`,
);

// 3. Server endpoint used by native clients to rebuild all future schedules.
replaceOnce(
  'backend/src/routes/task-reminders.ts',
  'taskReminders.get("/:taskId", (c) => {',
  `// GET /schedule -- all future reminders for the current user.\n// Native clients use this as the single source of truth when rebuilding Android/iOS schedules.\ntaskReminders.get("/schedule", (c) => {\n  const db = getDb();\n  const userId = c.req.header("X-User-Id");\n  if (!userId) return c.json({ error: "Unauthorized" }, 401);\n\n  const rows = db.prepare(\`\n    SELECT r.id AS reminderId, r.taskId, r.offsetMinutes, r.snoozedUntil,\n           t.title AS taskTitle, t.dueAt, t.dueDate, t.workspaceId\n    FROM task_reminders r\n    JOIN tasks t ON t.id = r.taskId\n    WHERE r.userId = ?\n      AND r.enabled = 1\n      AND t.isCompleted = 0\n      AND (r.snoozedUntil IS NOT NULL OR t.dueAt IS NOT NULL OR t.dueDate IS NOT NULL)\n  \`).all(userId) as any[];\n\n  const now = Date.now();\n  const reminders = rows.flatMap((row) => {\n    if (row.workspaceId && !getUserWorkspaceRole(row.workspaceId, userId)) return [];\n\n    let reminderMs: number;\n    if (row.snoozedUntil) {\n      reminderMs = new Date(row.snoozedUntil).getTime();\n    } else {\n      const dueValue = row.dueAt || (row.dueDate ? \`${row.dueDate}T23:59:59\` : null);\n      if (!dueValue) return [];\n      reminderMs = new Date(dueValue).getTime() - Number(row.offsetMinutes || 0) * 60_000;\n    }\n\n    if (!Number.isFinite(reminderMs) || reminderMs <= now) return [];\n    return [{\n      reminderId: row.reminderId,\n      taskId: row.taskId,\n      taskTitle: row.taskTitle,\n      reminderAt: new Date(reminderMs).toISOString(),\n      dueAt: row.dueAt || null,\n      dueDate: row.dueDate || null,\n      snoozedUntil: row.snoozedUntil || null,\n      offsetMinutes: Number(row.offsetMinutes || 0),\n    }];\n  }).sort((a, b) => new Date(a.reminderAt).getTime() - new Date(b.reminderAt).getTime())\n    .slice(0, 1000);\n\n  return c.json({ reminders });\n});\n\ntaskReminders.get("/:taskId", (c) => {`,
);

// 4. ACK-based delivery: scanner discovery is not delivery.
replaceOnce(
  'backend/src/index.ts',
  `});\napp.route("/api/task-reminders", taskRemindersRouter);`,
  `});\napp.post("/api/task-reminders/recent/ack", async (c) => {\n  const userId = c.req.header("X-User-Id");\n  if (!userId) return c.json({ error: "Unauthorized" }, 401);\n  const body = await c.req.json().catch(() => ({}));\n  const ids = new Set(\n    (Array.isArray(body?.reminderIds) ? body.reminderIds : [])\n      .filter((id: unknown): id is string => typeof id === "string" && id.length > 0)\n      .slice(0, 200),\n  );\n  let acked = 0;\n  for (let i = recentReminders.length - 1; i >= 0; i -= 1) {\n    const item = recentReminders[i];\n    if (item.userId !== userId || !ids.has(item.reminderId)) continue;\n    if (item.type === "task_reminder") markReminderNotified(item.reminderId);\n    recentReminders.splice(i, 1);\n    acked += 1;\n  }\n  return c.json({ success: true, acked });\n});\napp.route("/api/task-reminders", taskRemindersRouter);`,
);

replaceOnce(
  'backend/src/index.ts',
  `      console.log(\`[reminder] Task "\${r.taskTitle}" (\${r.taskId}) reminder due for user \${r.userId}\`);\n      recentReminders.push({ ...r, _triggeredAt: now, type: "task_reminder" });\n      markReminderNotified(r.reminderId);`,
  `      if (recentReminders.some((item) => item.type === "task_reminder" && item.reminderId === r.reminderId && item.userId === r.userId)) {\n        continue;\n      }\n      console.log(\`[reminder] Task "\${r.taskTitle}" (\${r.taskId}) reminder due for user \${r.userId}\`);\n      recentReminders.push({ ...r, _triggeredAt: now, type: "task_reminder" });`,
);

// 5. Frontend API: expose schedule + ACK and broadcast schedule invalidation after mutations.
{
  const path = 'frontend/src/lib/api.impl.ts';
  let source = read(path);
  const firstNewline = source.indexOf('\n');
  source = `${source.slice(0, firstNewline + 1)}import { TASK_REMINDER_SYNC_EVENT, type TaskReminderScheduleItem } from "@/lib/taskNotificationSchedule";\n${source.slice(firstNewline + 1)}`;
  source = source.replace(
    'export const SERVER_URL_CHANGED_EVENT = "nowen:server-url-changed";',
    `export const SERVER_URL_CHANGED_EVENT = "nowen:server-url-changed";\n\nfunction dispatchTaskReminderScheduleChanged(): void {\n  if (typeof window === "undefined") return;\n  queueMicrotask(() => window.dispatchEvent(new Event(TASK_REMINDER_SYNC_EVENT)));\n}`,
  );
  write(path, source);
}

replaceOnce(
  'frontend/src/lib/api.impl.ts',
  '  updateTask: (id: string, data: Partial<Task>) => request<TaskMutationResponse>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),',
  `  updateTask: async (id: string, data: Partial<Task>) => {\n    const result = await request<TaskMutationResponse>(\`/tasks/\${id}\`, { method: "PUT", body: JSON.stringify(data) });\n    dispatchTaskReminderScheduleChanged();\n    return result;\n  },`,
);
replaceOnce(
  'frontend/src/lib/api.impl.ts',
  '  toggleTask: (id: string) => request<TaskMutationResponse>(`/tasks/${id}/toggle`, { method: "PATCH" }),',
  `  toggleTask: async (id: string) => {\n    const result = await request<TaskMutationResponse>(\`/tasks/\${id}/toggle\`, { method: "PATCH" });\n    dispatchTaskReminderScheduleChanged();\n    return result;\n  },`,
);
replaceOnce(
  'frontend/src/lib/api.impl.ts',
  '  deleteTask: (id: string) => request(`/tasks/${id}`, { method: "DELETE" }),',
  `  deleteTask: async (id: string) => {\n    const result = await request(\`/tasks/\${id}\`, { method: "DELETE" });\n    dispatchTaskReminderScheduleChanged();\n    return result;\n  },`,
);
replaceOnce(
  'frontend/src/lib/api.impl.ts',
  '  batchTasks: (ids: string[], action: "complete" | "delete") =>\n    request<{ success: boolean; affected: number; generatedCount?: number }>("/tasks/batch", { method: "POST", body: JSON.stringify({ ids, action }) }),',
  `  batchTasks: async (ids: string[], action: "complete" | "delete") => {\n    const result = await request<{ success: boolean; affected: number; generatedCount?: number }>(\n      "/tasks/batch",\n      { method: "POST", body: JSON.stringify({ ids, action }) },\n    );\n    dispatchTaskReminderScheduleChanged();\n    return result;\n  },`,
);
replaceOnce(
  'frontend/src/lib/api.impl.ts',
  '  // Task reminders\n  getRecentReminders: (since: number) =>',
  `  // Task reminders\n  getTaskReminderSchedule: () =>\n    request<{ reminders: TaskReminderScheduleItem[] }>("/task-reminders/schedule"),\n  ackRecentReminders: (reminderIds: string[]) =>\n    request<{ success: boolean; acked: number }>("/task-reminders/recent/ack", {\n      method: "POST",\n      body: JSON.stringify({ reminderIds }),\n    }),\n  getRecentReminders: (since: number) =>`,
);
replaceOnce(
  'frontend/src/lib/api.impl.ts',
  '  createTaskReminder: (taskId: string, offsetMinutes: number) =>\n    request<import("@/types").TaskReminder>(`/task-reminders/${taskId}`, { method: "POST", body: JSON.stringify({ offsetMinutes }) }),',
  `  createTaskReminder: async (taskId: string, offsetMinutes: number) => {\n    const result = await request<import("@/types").TaskReminder>(\`/task-reminders/\${taskId}\`, {\n      method: "POST",\n      body: JSON.stringify({ offsetMinutes }),\n    });\n    dispatchTaskReminderScheduleChanged();\n    return result;\n  },`,
);
replaceOnce(
  'frontend/src/lib/api.impl.ts',
  '  updateTaskReminder: (reminderId: string, data: { offsetMinutes?: number; enabled?: boolean; snoozedUntil?: string | null }) =>\n    request<import("@/types").TaskReminder>(`/task-reminders/${reminderId}`, { method: "PUT", body: JSON.stringify(data) }),',
  `  updateTaskReminder: async (reminderId: string, data: { offsetMinutes?: number; enabled?: boolean; snoozedUntil?: string | null }) => {\n    const result = await request<import("@/types").TaskReminder>(\`/task-reminders/\${reminderId}\`, {\n      method: "PUT",\n      body: JSON.stringify(data),\n    });\n    dispatchTaskReminderScheduleChanged();\n    return result;\n  },`,
);
replaceOnce(
  'frontend/src/lib/api.impl.ts',
  '  deleteTaskReminder: (reminderId: string) =>\n    request(`/task-reminders/${reminderId}`, { method: "DELETE" }),',
  `  deleteTaskReminder: async (reminderId: string) => {\n    const result = await request(\`/task-reminders/\${reminderId}\`, { method: "DELETE" });\n    dispatchTaskReminderScheduleChanged();\n    return result;\n  },`,
);

// 6. Mount reminder runtime globally, not only while Task Center is open.
replaceOnce(
  'frontend/src/App.tsx',
  'import { TASK_VIEW_SHELL_CLASS } from "@/lib/taskLayout";',
  `import { TASK_VIEW_SHELL_CLASS } from "@/lib/taskLayout";\nimport { useReminderNotifier } from "@/components/tasks/useReminderNotifier";`,
);
replaceOnce(
  'frontend/src/App.tsx',
  '  // P5: 键盘弹出布局适配\n  useKeyboardLayout();',
  `  // P5: 键盘弹出布局适配\n  useKeyboardLayout();\n\n  const handleOpenTaskNotification = useCallback((_taskId: string) => {\n    actions.setViewMode("tasks");\n    actions.setMobileSidebar(false);\n  }, [actions]);\n  useReminderNotifier(handleOpenTaskNotification);`,
);

// 7. Task Center consumes the task id carried by a clicked system notification.
replaceOnce(
  'frontend/src/components/TaskCenterImpl.tsx',
  'import { useReminderNotifier } from "./tasks/useReminderNotifier";\n',
  '',
);
replaceOnce(
  'frontend/src/components/TaskCenterImpl.tsx',
  'import { openTaskQuickCapture } from "@/lib/taskInboxApi";',
  `import { openTaskQuickCapture } from "@/lib/taskInboxApi";\nimport { consumePendingTaskNotificationTaskId } from "@/lib/taskNotifications";\nimport { TASK_NOTIFICATION_OPEN_EVENT } from "@/lib/taskNotificationSchedule";`,
);
replaceOnce(
  'frontend/src/components/TaskCenterImpl.tsx',
  '  // background reminder notifier\n  useReminderNotifier();\n\n',
  '',
);
replaceOnce(
  'frontend/src/components/TaskCenterImpl.tsx',
  `  } = useTaskProjects();\n\n  // Phase 4: view mode (list / board)`,
  `  } = useTaskProjects();\n\n  const openTaskFromNotification = useCallback((taskId: string) => {\n    if (!taskId) return;\n    setCenterMode("tasks");\n    setFilter("all");\n    setSearchQuery("");\n    setSelectedProjectId(null);\n    setSelectedTaskId(taskId);\n  }, [setSelectedProjectId]);\n\n  useEffect(() => {\n    const onOpen = (event: Event) => {\n      const taskId = (event as CustomEvent<{ taskId?: string }>).detail?.taskId || "";\n      openTaskFromNotification(taskId);\n    };\n    window.addEventListener(TASK_NOTIFICATION_OPEN_EVENT, onOpen);\n    const pendingTaskId = consumePendingTaskNotificationTaskId();\n    if (pendingTaskId) queueMicrotask(() => openTaskFromNotification(pendingTaskId));\n    return () => window.removeEventListener(TASK_NOTIFICATION_OPEN_EVENT, onOpen);\n  }, [openTaskFromNotification]);\n\n  // Phase 4: view mode (list / board)`,
);

// 8. Reminder center uses native permission state instead of the WebView Notification API.
replaceOnce(
  'frontend/src/components/tasks/ReminderCenter.tsx',
  'import type { ReminderOverview, ReminderOverviewItem } from "@/types";',
  `import type { ReminderOverview, ReminderOverviewItem } from "@/types";\nimport { emitTaskReminderScheduleChanged } from "@/lib/taskNotificationSchedule";\nimport {\n  getTaskNotificationPermission,\n  getTaskNotificationSurface,\n  requestTaskNotificationPermission,\n  type TaskNotificationPermission,\n} from "@/lib/taskNotifications";`,
);
replaceOnce(
  'frontend/src/components/tasks/ReminderCenter.tsx',
  `  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());\n  const [notifPermission, setNotifPermission] = useState<string>(() => {\n    if (typeof window === "undefined") return "default";\n    if ((window as any).nowenDesktop?.taskNotify || (window as any).nowenDesktop?.taskNotifyPermission) return "electron";\n    return typeof Notification !== "undefined" ? Notification.permission : "default";\n  });\n  const [actionMenuId, setActionMenuId] = useState<string | null>(null);`,
  `  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());\n  const [notificationSurface] = useState(() => getTaskNotificationSurface());\n  const [notifPermission, setNotifPermission] = useState<TaskNotificationPermission>("prompt");\n  const [actionMenuId, setActionMenuId] = useState<string | null>(null);`,
);
replaceOnce(
  'frontend/src/components/tasks/ReminderCenter.tsx',
  `  const [snoozeMenuId, setSnoozeMenuId] = useState<string | null>(null);\n  const [acting, setActing] = useState<string | null>(null);\n\n  const load = useCallback(async () => {`,
  `  const [snoozeMenuId, setSnoozeMenuId] = useState<string | null>(null);\n  const [acting, setActing] = useState<string | null>(null);\n\n  const refreshNotificationPermission = useCallback(async () => {\n    setNotifPermission(await getTaskNotificationPermission());\n  }, []);\n\n  const load = useCallback(async () => {`,
);
replaceOnce(
  'frontend/src/components/tasks/ReminderCenter.tsx',
  `  useEffect(() => {\n    if (open) { load(); setActionMenuId(null); setSnoozeMenuId(null); }\n  }, [open, load]);`,
  `  useEffect(() => {\n    if (open) {\n      load();\n      void refreshNotificationPermission();\n      setActionMenuId(null);\n      setSnoozeMenuId(null);\n    }\n  }, [open, load, refreshNotificationPermission]);`,
);
replaceOnce(
  'frontend/src/components/tasks/ReminderCenter.tsx',
  `  const handleEnableNotification = async () => {\n    if (typeof Notification === "undefined") return;\n    try {\n      const result = await Notification.requestPermission();\n      setNotifPermission(result);\n    } catch { /* ignore */ }\n  };`,
  `  const handleEnableNotification = async () => {\n    const result = await requestTaskNotificationPermission();\n    setNotifPermission(result);\n    if (result === "granted") emitTaskReminderScheduleChanged();\n  };`,
);
replaceOnce(
  'frontend/src/components/tasks/ReminderCenter.tsx',
  `        {/* Notification permission */}\n        <div className="px-4 py-2.5 border-b border-app-border bg-bg-primary text-xs">\n          {notifPermission === "electron" && (\n            <div className="inline-flex items-center gap-1.5 rounded-md bg-green-500/10 px-2 py-1 font-medium text-green-700 dark:text-green-400">\n              <Monitor size={13} />\n              {t("tasks.reminderCenter.desktopNotificationEnabled")}\n            </div>\n          )}\n          {notifPermission === "granted" && (\n            <div className="inline-flex items-center gap-1.5 rounded-md bg-green-500/10 px-2 py-1 font-medium text-green-700 dark:text-green-400">\n              <Bell size={13} />\n              {t("tasks.reminderCenter.permissionEnabled")}\n            </div>\n          )}\n          {notifPermission === "denied" && (\n            <div className="inline-flex items-center gap-1.5 rounded-md bg-red-500/10 px-2 py-1 font-medium text-red-600 dark:text-red-400">\n              <BellOff size={13} />\n              {t("tasks.reminderCenter.permissionDenied")}\n            </div>\n          )}\n          {notifPermission === "default" && (\n            <button\n              type="button"\n              onClick={handleEnableNotification}\n              className="inline-flex items-center gap-1.5 rounded-md bg-accent-primary/10 px-2 py-1 font-medium text-accent-primary hover:bg-accent-primary/15 transition-colors"\n            >\n              <Bell size={13} />\n              {t("tasks.reminderCenter.enableNotification")}\n            </button>\n          )}\n        </div>`,
  `        {/* Notification permission */}\n        <div className="px-4 py-2.5 border-b border-app-border bg-bg-primary text-xs">\n          {notifPermission === "granted" && (\n            <div className="inline-flex items-center gap-1.5 rounded-md bg-green-500/10 px-2 py-1 font-medium text-green-700 dark:text-green-400">\n              {notificationSurface === "electron" ? <Monitor size={13} /> : <Bell size={13} />}\n              {notificationSurface === "electron"\n                ? t("tasks.reminderCenter.desktopNotificationEnabled")\n                : t("tasks.reminderCenter.permissionEnabled")}\n            </div>\n          )}\n          {(notifPermission === "denied" || notifPermission === "unsupported") && (\n            <div className="inline-flex items-center gap-1.5 rounded-md bg-red-500/10 px-2 py-1 font-medium text-red-600 dark:text-red-400">\n              <BellOff size={13} />\n              {t("tasks.reminderCenter.permissionDenied")}\n            </div>\n          )}\n          {notifPermission === "prompt" && (\n            <button\n              type="button"\n              onClick={handleEnableNotification}\n              className="inline-flex items-center gap-1.5 rounded-md bg-accent-primary/10 px-2 py-1 font-medium text-accent-primary hover:bg-accent-primary/15 transition-colors"\n            >\n              <Bell size={13} />\n              {t("tasks.reminderCenter.enableNotification")}\n            </button>\n          )}\n        </div>`,
);

// 9. Task detail test notification now exercises the actual native adapter.
replaceOnce(
  'frontend/src/components/tasks/TaskDetailPanel.tsx',
  'import { toast } from "@/lib/toast";',
  `import { toast } from "@/lib/toast";\nimport { getTaskNotificationSurface, showTestTaskNotification } from "@/lib/taskNotifications";`,
);
replaceOnce(
  'frontend/src/components/tasks/TaskDetailPanel.tsx',
  `  const desktop = (typeof window !== "undefined") ? (window as any).nowenDesktop : null;\n  if (desktop?.taskNotify) {\n    // Electron: native notifications always available\n    return null;\n  }`,
  `  const surface = getTaskNotificationSurface();\n  if (surface === "electron" || surface === "native") {\n    return null;\n  }`,
);
replaceOnce(
  'frontend/src/components/tasks/TaskDetailPanel.tsx',
  `  // test notification\n  const handleTestNotification = async () => {\n    const desktop = (window as any).nowenDesktop;\n    if (desktop?.taskNotify) {\n      await desktop.taskNotify(t("tasks.reminder.title"), t("tasks.reminder.testBody"));\n    } else if ("Notification" in window) {\n      if (Notification.permission === "granted") {\n        new Notification(t("tasks.reminder.title"), { body: t("tasks.reminder.testBody") });\n      } else if (Notification.permission !== "denied") {\n        const perm = await Notification.requestPermission();\n        if (perm === "granted") {\n          new Notification(t("tasks.reminder.title"), { body: t("tasks.reminder.testBody") });\n        }\n      }\n    }\n  };`,
  `  // test notification\n  const handleTestNotification = async () => {\n    const delivered = await showTestTaskNotification(\n      t("tasks.reminder.title"),\n      t("tasks.reminder.testBody"),\n    );\n    if (!delivered) toast.error(t("tasks.reminder.noPermission"));\n  };`,
);

// 10. Source-level regression test for the server delivery contract.
write('backend/tests/task-reminder-delivery-contract.test.ts', `import assert from "node:assert/strict";\nimport fs from "node:fs";\nimport test from "node:test";\n\nconst indexSource = fs.readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");\nconst routeSource = fs.readFileSync(new URL("../src/routes/task-reminders.ts", import.meta.url), "utf8");\n\ntest("task reminders are acknowledged after delivery instead of during scanning", () => {\n  assert.match(indexSource, /task-reminders\\/recent\\/ack/);\n  assert.match(indexSource, /markReminderNotified\\(item\\.reminderId\\)/);\n  assert.doesNotMatch(indexSource, /recentReminders\\.push\\(\\{ \\.\\.\\.r[^;]+;\\s*markReminderNotified\\(r\\.reminderId\\)/s);\n});\n\ntest("native clients can fetch a future reminder schedule", () => {\n  assert.match(routeSource, /taskReminders\\.get\\("\\/schedule"/);\n  assert.match(routeSource, /snoozedUntil/);\n  assert.match(routeSource, /workspaceId/);\n});\n`);

console.log('Issue #635 source patch applied.');

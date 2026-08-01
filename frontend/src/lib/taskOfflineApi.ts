import type {
  Habit,
  HabitCheckin,
  HabitCheckinListItem,
  HabitCheckinStatus,
  HabitStats,
  Task,
  TaskFilter,
  TaskStats,
} from "@/types";

type TaskMutationResponse = { task: Task; generatedTask: Task | null };

type OfflineOperation =
  | { id: string; kind: "task.create"; entityId: string; data: Partial<Task>; queuedAt: number; retryCount: number; lastError?: string; blocked?: boolean }
  | { id: string; kind: "task.update"; entityId: string; data: Partial<Task>; queuedAt: number; retryCount: number; lastError?: string; blocked?: boolean }
  | { id: string; kind: "task.delete"; entityId: string; queuedAt: number; retryCount: number; lastError?: string; blocked?: boolean }
  | { id: string; kind: "habit.create"; entityId: string; data: { title: string; icon?: string; color?: string; sortOrder?: number }; queuedAt: number; retryCount: number; lastError?: string; blocked?: boolean }
  | { id: string; kind: "habit.update"; entityId: string; data: Partial<Habit>; queuedAt: number; retryCount: number; lastError?: string; blocked?: boolean }
  | { id: string; kind: "habit.archive"; entityId: string; archived: boolean; queuedAt: number; retryCount: number; lastError?: string; blocked?: boolean }
  | { id: string; kind: "habit.delete"; entityId: string; queuedAt: number; retryCount: number; lastError?: string; blocked?: boolean }
  | {
      id: string;
      kind: "habit.checkin";
      entityId: string;
      data: { status: HabitCheckinStatus; note?: string; checkinDate?: string };
      queuedAt: number;
      retryCount: number;
      lastError?: string;
      blocked?: boolean;
    };

interface OfflineTaskState {
  version: 1;
  tasks: Task[];
  taskStats: TaskStats | null;
  habits: Habit[];
  habitStats: HabitStats | null;
  checkins: HabitCheckinListItem[];
  queue: OfflineOperation[];
  idMap: Record<string, string>;
  updatedAt: number;
}

interface InstallOptions {
  getServerUrl: () => string;
  getWorkspaceId: () => string;
  getScopeKey?: () => string;
}

interface NativeApi {
  getTasks: (filter?: TaskFilter, noteId?: string, projectId?: string) => Promise<Task[]>;
  getTaskStats: () => Promise<TaskStats>;
  createTask: (data: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<TaskMutationResponse>;
  toggleTask: (id: string) => Promise<TaskMutationResponse>;
  deleteTask: (id: string) => Promise<unknown>;
  getHabits: (includeArchived?: boolean, checkinDate?: string) => Promise<Habit[]>;
  getHabitStats: (includeArchived?: boolean, checkinDate?: string) => Promise<HabitStats>;
  getHabitCheckinLog: (params?: { from?: string; to?: string; includeArchived?: boolean }) => Promise<HabitCheckinListItem[]>;
  createHabit: (data: { title: string; icon?: string; color?: string; sortOrder?: number }) => Promise<Habit>;
  updateHabit: (id: string, data: Partial<Habit>) => Promise<Habit>;
  archiveHabit: (id: string, archived?: boolean) => Promise<Habit>;
  deleteHabit: (id: string) => Promise<{ success: boolean }>;
  checkInHabit: (
    id: string,
    data: { status: HabitCheckinStatus; note?: string; checkinDate?: string },
  ) => Promise<HabitCheckin>;
}

const STORAGE_PREFIX = "nowen-task-offline:v1";
const CHANGE_EVENT = "nowen:task-offline-state-changed";
const INSTALL_FLAG = Symbol.for("nowen.taskOfflineApi.installed");
const MAX_RETRY = 10;

function emptyState(): OfflineTaskState {
  return {
    version: 1,
    tasks: [],
    taskStats: null,
    habits: [],
    habitStats: null,
    checkins: [],
    queue: [],
    idMap: {},
    updatedAt: 0,
  };
}

function safeLocalStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function decodeUserId(): string {
  const storage = safeLocalStorage();
  const token = storage?.getItem("nowen-token");
  if (!token) return "anonymous";
  try {
    const payload = token.split(".")[1];
    if (!payload) return "anonymous";
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
    const data = JSON.parse(decoded) as { userId?: string; sub?: string };
    return data.userId || data.sub || "anonymous";
  } catch {
    return "anonymous";
  }
}

function normalizeScopePart(value: string): string {
  return encodeURIComponent((value || "default").replace(/\/+$/, "").toLowerCase());
}

function generateId(prefix: string): string {
  const randomUUID = typeof crypto !== "undefined" ? crypto.randomUUID : undefined;
  if (typeof randomUUID === "function") return `${prefix}:${randomUUID.call(crypto)}`;
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}

function isLocalId(id: string): boolean {
  return id.startsWith("local-task:") || id.startsWith("local-habit:");
}

function isOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

function isQueueableError(error: unknown): boolean {
  const value = error as { name?: string; message?: string; status?: number };
  if (!isOnline()) return true;
  if (value?.status === 408 || value?.status === 425 || value?.status === 429) return true;
  if (typeof value?.status === "number" && value.status >= 500) return true;
  return (
    value?.name === "AbortError"
    || value?.name === "NetworkError"
    || value?.name === "TypeError"
    || /failed to fetch|network\s*error|load failed|timeout|aborted/i.test(value?.message || "")
  );
}

function errorStatus(error: unknown): number | undefined {
  return (error as { status?: number })?.status;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "同步失败");
}

function dateKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const direct = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (direct) return direct;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, "0"),
    String(parsed.getDate()).padStart(2, "0"),
  ].join("-");
}

function todayKey(): string {
  return dateKey(new Date().toISOString())!;
}

function addDays(key: string, days: number): string {
  const date = new Date(`${key}T00:00:00`);
  date.setDate(date.getDate() + days);
  return dateKey(date.toISOString())!;
}

function isCompleted(task: Task): boolean {
  return Boolean(task.isCompleted) || task.status === "done";
}

function taskDueKey(task: Task): string | null {
  return dateKey((task as Task & { dueAt?: string | null }).dueAt || task.dueDate);
}

export function filterOfflineTasks(
  tasks: Task[],
  filter: TaskFilter = "all",
  noteId?: string,
  projectId?: string,
): Task[] {
  const today = todayKey();
  const weekEnd = addDays(today, 6);
  return tasks.filter((task) => {
    if (noteId && task.noteId !== noteId) return false;
    if (projectId && task.projectId !== projectId) return false;
    const due = taskDueKey(task);
    if (filter === "completed") return isCompleted(task);
    if (filter === "today") return !isCompleted(task) && due === today;
    if (filter === "week") return !isCompleted(task) && !!due && due >= today && due <= weekEnd;
    if (filter === "overdue") return !isCompleted(task) && !!due && due < today;
    return true;
  });
}

export function deriveOfflineTaskStats(tasks: Task[]): TaskStats {
  const today = todayKey();
  const weekEnd = addDays(today, 6);
  let completed = 0;
  let todayCount = 0;
  let overdue = 0;
  let week = 0;
  for (const task of tasks) {
    const done = isCompleted(task);
    if (done) completed += 1;
    const due = taskDueKey(task);
    if (!done && due === today) todayCount += 1;
    if (!done && due && due < today) overdue += 1;
    if (!done && due && due >= today && due <= weekEnd) week += 1;
  }
  return {
    total: tasks.length,
    completed,
    pending: tasks.length - completed,
    today: todayCount,
    overdue,
    week,
  };
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const map = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) map.set(item.id, { ...map.get(item.id), ...item });
  return [...map.values()];
}

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((entry) => entry.id === item.id);
  if (index === -1) return [item, ...items];
  const next = [...items];
  next[index] = { ...next[index], ...item };
  return next;
}

function resolveId(state: OfflineTaskState, id: string): string {
  let current = id;
  const visited = new Set<string>();
  while (state.idMap[current] && !visited.has(current)) {
    visited.add(current);
    current = state.idMap[current];
  }
  return current;
}

function currentUserId(): string {
  return decodeUserId();
}

function workspaceId(options: InstallOptions): string | null {
  const workspace = options.getWorkspaceId();
  return workspace && workspace !== "personal" ? workspace : null;
}

function createOptimisticTask(data: Partial<Task>, options: InstallOptions): Task {
  const now = new Date().toISOString();
  const done = Boolean(data.isCompleted) || data.status === "done";
  return {
    id: generateId("local-task"),
    userId: currentUserId(),
    workspaceId: workspaceId(options),
    title: data.title || "",
    description: data.description || "",
    priority: data.priority ?? 2,
    dueDate: data.dueDate ?? null,
    dueAt: (data as Task & { dueAt?: string | null }).dueAt ?? null,
    startDate: data.startDate ?? null,
    noteId: data.noteId ?? null,
    parentId: data.parentId ?? null,
    isCompleted: done ? 1 : 0,
    completedAt: data.completedAt ?? (done ? now : null),
    sortOrder: data.sortOrder ?? 0,
    projectId: data.projectId ?? null,
    status: data.status ?? (done ? "done" : "todo"),
    createdAt: data.createdAt || now,
    updatedAt: now,
    ...data,
  } as Task;
}

function createOptimisticHabit(
  data: { title: string; icon?: string; color?: string; sortOrder?: number },
  options: InstallOptions,
): Habit {
  const now = new Date().toISOString();
  return {
    id: generateId("local-habit"),
    userId: currentUserId(),
    workspaceId: workspaceId(options),
    title: data.title,
    icon: data.icon || "🎯",
    color: data.color || "#6366f1",
    sortOrder: data.sortOrder ?? 0,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  } as Habit;
}

function optimisticCheckin(
  habit: Habit,
  data: { status: HabitCheckinStatus; note?: string; checkinDate?: string },
): HabitCheckinListItem {
  const now = new Date().toISOString();
  return {
    id: generateId("local-checkin"),
    habitId: habit.id,
    userId: currentUserId(),
    workspaceId: habit.workspaceId,
    checkinDate: data.checkinDate || todayKey(),
    status: data.status,
    note: data.note || "",
    createdAt: now,
    updatedAt: now,
    habitTitle: habit.title,
    habitColor: habit.color,
    habitIcon: habit.icon,
    habitArchivedAt: habit.archivedAt,
  };
}

function applyCheckinToState(
  state: OfflineTaskState,
  habitId: string,
  checkin: HabitCheckin,
): OfflineTaskState {
  const habit = state.habits.find((item) => item.id === habitId);
  const updatedHabit = habit
    ? {
        ...habit,
        todayStatus: checkin.status,
        todayNote: checkin.note,
        todayCheckinDate: checkin.checkinDate,
        updatedAt: checkin.updatedAt || new Date().toISOString(),
      }
    : null;
  const listItem: HabitCheckinListItem = {
    ...checkin,
    habitTitle: habit?.title || "",
    habitColor: habit?.color || "#6366f1",
    habitIcon: habit?.icon || "🎯",
    habitArchivedAt: habit?.archivedAt || null,
  };
  const checkins = [
    listItem,
    ...state.checkins.filter(
      (item) => !(item.habitId === habitId && item.checkinDate === checkin.checkinDate),
    ),
  ];
  return {
    ...state,
    habits: updatedHabit ? upsertById(state.habits, updatedHabit) : state.habits,
    checkins,
  };
}

function filterCheckins(
  checkins: HabitCheckinListItem[],
  params?: { from?: string; to?: string; includeArchived?: boolean },
): HabitCheckinListItem[] {
  return checkins.filter((item) => {
    if (params?.from && item.checkinDate < params.from) return false;
    if (params?.to && item.checkinDate > params.to) return false;
    if (params?.includeArchived === false && item.habitArchivedAt) return false;
    return true;
  });
}

function compactQueue(queue: OfflineOperation[], operation: OfflineOperation): OfflineOperation[] {
  if (operation.kind === "task.update") {
    const createIndex = queue.findIndex(
      (item) => item.kind === "task.create" && item.entityId === operation.entityId && !item.blocked,
    );
    if (createIndex >= 0) {
      const next = [...queue];
      const create = next[createIndex] as Extract<OfflineOperation, { kind: "task.create" }>;
      next[createIndex] = { ...create, data: { ...create.data, ...operation.data } };
      return next;
    }
    const updateIndex = queue.findIndex(
      (item) => item.kind === "task.update" && item.entityId === operation.entityId && !item.blocked,
    );
    if (updateIndex >= 0) {
      const next = [...queue];
      const update = next[updateIndex] as Extract<OfflineOperation, { kind: "task.update" }>;
      next[updateIndex] = { ...update, data: { ...update.data, ...operation.data }, queuedAt: operation.queuedAt };
      return next;
    }
  }

  if (operation.kind === "habit.update") {
    const createIndex = queue.findIndex(
      (item) => item.kind === "habit.create" && item.entityId === operation.entityId && !item.blocked,
    );
    if (createIndex >= 0) {
      const next = [...queue];
      const create = next[createIndex] as Extract<OfflineOperation, { kind: "habit.create" }>;
      next[createIndex] = { ...create, data: { ...create.data, ...operation.data } };
      return next;
    }
    const updateIndex = queue.findIndex(
      (item) => item.kind === "habit.update" && item.entityId === operation.entityId && !item.blocked,
    );
    if (updateIndex >= 0) {
      const next = [...queue];
      const update = next[updateIndex] as Extract<OfflineOperation, { kind: "habit.update" }>;
      next[updateIndex] = { ...update, data: { ...update.data, ...operation.data }, queuedAt: operation.queuedAt };
      return next;
    }
  }

  if (operation.kind === "habit.checkin") {
    const index = queue.findIndex(
      (item) => (
        item.kind === "habit.checkin"
        && item.entityId === operation.entityId
        && (item.data.checkinDate || todayKey()) === (operation.data.checkinDate || todayKey())
        && !item.blocked
      ),
    );
    if (index >= 0) {
      const next = [...queue];
      next[index] = operation;
      return next;
    }
  }

  return [...queue, operation];
}

export function installTaskOfflineApi(api: any, options: InstallOptions) {
  if (api[INSTALL_FLAG]) return api[INSTALL_FLAG] as { flush: () => Promise<void>; pending: () => number };

  const native: NativeApi = {
    getTasks: api.getTasks.bind(api),
    getTaskStats: api.getTaskStats.bind(api),
    createTask: api.createTask.bind(api),
    updateTask: api.updateTask.bind(api),
    toggleTask: api.toggleTask.bind(api),
    deleteTask: api.deleteTask.bind(api),
    getHabits: api.getHabits.bind(api),
    getHabitStats: api.getHabitStats.bind(api),
    getHabitCheckinLog: api.getHabitCheckinLog.bind(api),
    createHabit: api.createHabit.bind(api),
    updateHabit: api.updateHabit.bind(api),
    archiveHabit: api.archiveHabit.bind(api),
    deleteHabit: api.deleteHabit.bind(api),
    checkInHabit: api.checkInHabit.bind(api),
  };

  const storageKey = () => {
    if (options.getScopeKey) return `${STORAGE_PREFIX}:${options.getScopeKey()}`;
    return [
      STORAGE_PREFIX,
      normalizeScopePart(options.getServerUrl() || "same-origin"),
      normalizeScopePart(currentUserId()),
      normalizeScopePart(options.getWorkspaceId() || "personal"),
    ].join(":");
  };

  const readState = (): OfflineTaskState => {
    const storage = safeLocalStorage();
    if (!storage) return emptyState();
    try {
      const raw = storage.getItem(storageKey());
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw) as Partial<OfflineTaskState>;
      return {
        ...emptyState(),
        ...parsed,
        version: 1,
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        habits: Array.isArray(parsed.habits) ? parsed.habits : [],
        checkins: Array.isArray(parsed.checkins) ? parsed.checkins : [],
        queue: Array.isArray(parsed.queue) ? parsed.queue : [],
        idMap: parsed.idMap && typeof parsed.idMap === "object" ? parsed.idMap : {},
      };
    } catch {
      return emptyState();
    }
  };

  const emitState = (state: OfflineTaskState) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, {
      detail: {
        pending: state.queue.length,
        blocked: state.queue.filter((item) => item.blocked).length,
        updatedAt: state.updatedAt,
      },
    }));
  };

  const writeState = (state: OfflineTaskState): OfflineTaskState => {
    const next = { ...state, version: 1 as const, updatedAt: Date.now() };
    const storage = safeLocalStorage();
    if (storage) {
      try {
        storage.setItem(storageKey(), JSON.stringify(next));
      } catch (error) {
        console.warn("[task-offline] failed to persist cache", error);
      }
    }
    emitState(next);
    return next;
  };

  const enqueue = (state: OfflineTaskState, operation: OfflineOperation): OfflineTaskState =>
    writeState({ ...state, queue: compactQueue(state.queue, operation) });

  const pending = () => readState().queue.length;
  let flushing: Promise<void> | null = null;

  const replaceTaskId = (
    state: OfflineTaskState,
    localId: string,
    serverTask: Task,
  ): OfflineTaskState => ({
    ...state,
    idMap: { ...state.idMap, [localId]: serverTask.id },
    tasks: upsertById(
      state.tasks
        .filter((task) => task.id !== localId)
        .map((task) => task.parentId === localId ? { ...task, parentId: serverTask.id } : task),
      serverTask,
    ),
    queue: state.queue.map((item) => {
      const entityId = item.entityId === localId ? serverTask.id : item.entityId;
      if ((item.kind === "task.create" || item.kind === "task.update") && item.data.parentId === localId) {
        return { ...item, entityId, data: { ...item.data, parentId: serverTask.id } };
      }
      return { ...item, entityId };
    }) as OfflineOperation[],
  });

  const replaceHabitId = (
    state: OfflineTaskState,
    localId: string,
    serverHabit: Habit,
  ): OfflineTaskState => ({
    ...state,
    idMap: { ...state.idMap, [localId]: serverHabit.id },
    habits: upsertById(state.habits.filter((habit) => habit.id !== localId), serverHabit),
    checkins: state.checkins.map((item) => item.habitId === localId ? { ...item, habitId: serverHabit.id } : item),
    queue: state.queue.map((item) => (
      item.entityId === localId ? { ...item, entityId: serverHabit.id } : item
    )) as OfflineOperation[],
  });

  const runOperation = async (
    operation: OfflineOperation,
    state: OfflineTaskState,
  ): Promise<OfflineTaskState> => {
    const entityId = resolveId(state, operation.entityId);
    if (operation.kind === "task.create") {
      const data = {
        ...operation.data,
        parentId: operation.data.parentId
          ? resolveId(state, operation.data.parentId)
          : operation.data.parentId,
      };
      const created = await native.createTask(data);
      return replaceTaskId(state, operation.entityId, created);
    }
    if (operation.kind === "task.update") {
      const result = await native.updateTask(entityId, operation.data);
      let next = { ...state, tasks: upsertById(state.tasks, result.task) };
      if (result.generatedTask) next = { ...next, tasks: upsertById(next.tasks, result.generatedTask) };
      return next;
    }
    if (operation.kind === "task.delete") {
      try {
        await native.deleteTask(entityId);
      } catch (error) {
        if (errorStatus(error) !== 404) throw error;
      }
      return { ...state, tasks: state.tasks.filter((task) => task.id !== operation.entityId && task.id !== entityId) };
    }
    if (operation.kind === "habit.create") {
      const created = await native.createHabit(operation.data);
      return replaceHabitId(state, operation.entityId, created);
    }
    if (operation.kind === "habit.update") {
      const updated = await native.updateHabit(entityId, operation.data);
      return { ...state, habits: upsertById(state.habits, updated) };
    }
    if (operation.kind === "habit.archive") {
      const updated = await native.archiveHabit(entityId, operation.archived);
      return { ...state, habits: upsertById(state.habits, updated) };
    }
    if (operation.kind === "habit.delete") {
      try {
        await native.deleteHabit(entityId);
      } catch (error) {
        if (errorStatus(error) !== 404) throw error;
      }
      return {
        ...state,
        habits: state.habits.filter((habit) => habit.id !== operation.entityId && habit.id !== entityId),
        checkins: state.checkins.filter((item) => item.habitId !== operation.entityId && item.habitId !== entityId),
      };
    }
    const checkin = await native.checkInHabit(entityId, operation.data);
    return applyCheckinToState(state, entityId, checkin);
  };

  const flush = async (): Promise<void> => {
    if (!isOnline()) return;
    if (flushing) return flushing;
    flushing = (async () => {
      for (let processed = 0; processed < 200; processed += 1) {
        let state = readState();
        const operation = state.queue[0];
        if (!operation || operation.blocked) break;
        try {
          state = await runOperation(operation, state);
          state = {
            ...state,
            queue: state.queue.filter((item) => item.id !== operation.id),
          };
          writeState(state);
        } catch (error) {
          state = readState();
          const current = state.queue.find((item) => item.id === operation.id);
          if (!current) continue;
          const queueable = isQueueableError(error);
          const retryCount = current.retryCount + 1;
          const blocked = !queueable || retryCount >= MAX_RETRY;
          writeState({
            ...state,
            queue: state.queue.map((item) => item.id === operation.id
              ? {
                  ...item,
                  retryCount,
                  lastError: errorMessage(error),
                  blocked,
                }
              : item),
          });
          break;
        }
      }
    })().finally(() => {
      flushing = null;
    });
    return flushing;
  };

  api.getTasks = async (filter?: TaskFilter, noteId?: string, projectId?: string) => {
    if (isOnline()) await flush();
    try {
      const remote = await native.getTasks(filter, noteId, projectId);
      let state = readState();
      const fullCollection = (!filter || filter === "all") && !noteId && !projectId;
      state = writeState({
        ...state,
        tasks: fullCollection ? remote : mergeById(state.tasks, remote),
      });
      return filterOfflineTasks(state.tasks, filter, noteId, projectId);
    } catch (error) {
      const state = readState();
      if (state.updatedAt || state.tasks.length > 0 || state.queue.length > 0) {
        return filterOfflineTasks(state.tasks, filter, noteId, projectId);
      }
      throw error;
    }
  };

  api.getTaskStats = async () => {
    if (isOnline()) await flush();
    try {
      const remote = await native.getTaskStats();
      const state = readState();
      const next = writeState({ ...state, taskStats: remote });
      return next.queue.length > 0 ? deriveOfflineTaskStats(next.tasks) : remote;
    } catch (error) {
      const state = readState();
      if (state.updatedAt || state.tasks.length > 0 || state.queue.length > 0) {
        return deriveOfflineTaskStats(state.tasks);
      }
      throw error;
    }
  };

  api.createTask = async (data: Partial<Task>) => {
    if (isOnline()) {
      try {
        const created = await native.createTask(data);
        const state = readState();
        writeState({ ...state, tasks: upsertById(state.tasks, created) });
        return created;
      } catch (error) {
        if (!isQueueableError(error)) throw error;
      }
    }
    const task = createOptimisticTask(data, options);
    const state = readState();
    enqueue(
      { ...state, tasks: upsertById(state.tasks, task) },
      { id: generateId("task-op"), kind: "task.create", entityId: task.id, data, queuedAt: Date.now(), retryCount: 0 },
    );
    return task;
  };

  api.updateTask = async (id: string, data: Partial<Task>) => {
    if (isOnline() && !isLocalId(id)) {
      try {
        const result = await native.updateTask(resolveId(readState(), id), data);
        let state = readState();
        state = { ...state, tasks: upsertById(state.tasks, result.task) };
        if (result.generatedTask) state = { ...state, tasks: upsertById(state.tasks, result.generatedTask) };
        writeState(state);
        return result;
      } catch (error) {
        if (!isQueueableError(error)) throw error;
      }
    }
    const state = readState();
    const current = state.tasks.find((task) => task.id === id) || createOptimisticTask({ ...data, id }, options);
    const task = { ...current, ...data, id, updatedAt: new Date().toISOString() } as Task;
    enqueue(
      { ...state, tasks: upsertById(state.tasks, task) },
      { id: generateId("task-op"), kind: "task.update", entityId: id, data, queuedAt: Date.now(), retryCount: 0 },
    );
    return { task, generatedTask: null };
  };

  api.toggleTask = async (id: string) => {
    if (isOnline() && !isLocalId(id)) {
      try {
        const result = await native.toggleTask(resolveId(readState(), id));
        let state = readState();
        state = { ...state, tasks: upsertById(state.tasks, result.task) };
        if (result.generatedTask) state = { ...state, tasks: upsertById(state.tasks, result.generatedTask) };
        writeState(state);
        return result;
      } catch (error) {
        if (!isQueueableError(error)) throw error;
      }
    }
    const state = readState();
    const current = state.tasks.find((task) => task.id === id);
    if (!current) throw new Error("离线缓存中找不到该任务");
    const done = !isCompleted(current);
    const patch: Partial<Task> = {
      isCompleted: done ? 1 : 0,
      status: done ? "done" : "todo",
      completedAt: done ? new Date().toISOString() : null,
    };
    const task = { ...current, ...patch, updatedAt: new Date().toISOString() };
    enqueue(
      { ...state, tasks: upsertById(state.tasks, task) },
      { id: generateId("task-op"), kind: "task.update", entityId: id, data: patch, queuedAt: Date.now(), retryCount: 0 },
    );
    return { task, generatedTask: null };
  };

  api.deleteTask = async (id: string) => {
    const state = readState();
    const pendingCreate = state.queue.some((item) => item.kind === "task.create" && item.entityId === id);
    if (pendingCreate) {
      writeState({
        ...state,
        tasks: state.tasks.filter((task) => task.id !== id),
        queue: state.queue.filter((item) => item.entityId !== id),
      });
      return { success: true };
    }
    if (isOnline() && !isLocalId(id)) {
      try {
        const result = await native.deleteTask(resolveId(state, id));
        const current = readState();
        writeState({ ...current, tasks: current.tasks.filter((task) => task.id !== id) });
        return result;
      } catch (error) {
        if (!isQueueableError(error) && errorStatus(error) !== 404) throw error;
      }
    }
    enqueue(
      { ...state, tasks: state.tasks.filter((task) => task.id !== id) },
      { id: generateId("task-op"), kind: "task.delete", entityId: id, queuedAt: Date.now(), retryCount: 0 },
    );
    return { success: true };
  };

  api.getHabits = async (includeArchived = false, checkinDate?: string) => {
    if (isOnline()) await flush();
    try {
      const remote = await native.getHabits(includeArchived, checkinDate);
      let state = readState();
      const habits = includeArchived
        ? remote
        : mergeById(state.habits.filter((habit) => habit.archivedAt), remote);
      state = writeState({ ...state, habits });
      return state.habits.filter((habit) => includeArchived || !habit.archivedAt);
    } catch (error) {
      const state = readState();
      if (state.updatedAt || state.habits.length > 0 || state.queue.length > 0) {
        return state.habits.filter((habit) => includeArchived || !habit.archivedAt);
      }
      throw error;
    }
  };

  api.getHabitStats = async (includeArchived = false, checkinDate?: string) => {
    if (isOnline()) await flush();
    try {
      const remote = await native.getHabitStats(includeArchived, checkinDate);
      writeState({ ...readState(), habitStats: remote });
      return remote;
    } catch (error) {
      const state = readState();
      if (state.habitStats) return {
        ...state.habitStats,
        habitCount: state.habits.filter((habit) => includeArchived || !habit.archivedAt).length,
      };
      if (state.updatedAt || state.habits.length > 0) {
        return {
          totalCheckins: state.checkins.length,
          checkinDays: new Set(state.checkins.map((item) => item.checkinDate)).size,
          currentStreak: 0,
          successCount: state.checkins.filter((item) => item.status === "success").length,
          partialCount: state.checkins.filter((item) => item.status === "partial").length,
          failureCount: state.checkins.filter((item) => item.status === "failure").length,
          habitCount: state.habits.filter((habit) => includeArchived || !habit.archivedAt).length,
        } satisfies HabitStats;
      }
      throw error;
    }
  };

  api.getHabitCheckinLog = async (params?: { from?: string; to?: string; includeArchived?: boolean }) => {
    if (isOnline()) await flush();
    try {
      const remote = await native.getHabitCheckinLog(params);
      const current = readState();
      const state = writeState({ ...current, checkins: mergeById(current.checkins, remote) });
      return filterCheckins(state.checkins, params);
    } catch (error) {
      const state = readState();
      if (state.updatedAt || state.checkins.length > 0 || state.queue.length > 0) {
        return filterCheckins(state.checkins, params);
      }
      throw error;
    }
  };

  api.createHabit = async (data: { title: string; icon?: string; color?: string; sortOrder?: number }) => {
    if (isOnline()) {
      try {
        const created = await native.createHabit(data);
        const state = readState();
        writeState({ ...state, habits: upsertById(state.habits, created) });
        return created;
      } catch (error) {
        if (!isQueueableError(error)) throw error;
      }
    }
    const habit = createOptimisticHabit(data, options);
    const state = readState();
    enqueue(
      { ...state, habits: upsertById(state.habits, habit) },
      { id: generateId("habit-op"), kind: "habit.create", entityId: habit.id, data, queuedAt: Date.now(), retryCount: 0 },
    );
    return habit;
  };

  api.updateHabit = async (id: string, data: Partial<Habit>) => {
    if (isOnline() && !isLocalId(id)) {
      try {
        const updated = await native.updateHabit(resolveId(readState(), id), data);
        const state = readState();
        writeState({ ...state, habits: upsertById(state.habits, updated) });
        return updated;
      } catch (error) {
        if (!isQueueableError(error)) throw error;
      }
    }
    const state = readState();
    const current = state.habits.find((habit) => habit.id === id);
    if (!current) throw new Error("离线缓存中找不到该习惯");
    const habit = { ...current, ...data, updatedAt: new Date().toISOString() };
    enqueue(
      { ...state, habits: upsertById(state.habits, habit) },
      { id: generateId("habit-op"), kind: "habit.update", entityId: id, data, queuedAt: Date.now(), retryCount: 0 },
    );
    return habit;
  };

  api.archiveHabit = async (id: string, archived = true) => {
    if (isOnline() && !isLocalId(id)) {
      try {
        const updated = await native.archiveHabit(resolveId(readState(), id), archived);
        const state = readState();
        writeState({ ...state, habits: upsertById(state.habits, updated) });
        return updated;
      } catch (error) {
        if (!isQueueableError(error)) throw error;
      }
    }
    const state = readState();
    const current = state.habits.find((habit) => habit.id === id);
    if (!current) throw new Error("离线缓存中找不到该习惯");
    const habit = {
      ...current,
      archivedAt: archived ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    };
    enqueue(
      { ...state, habits: upsertById(state.habits, habit) },
      { id: generateId("habit-op"), kind: "habit.archive", entityId: id, archived, queuedAt: Date.now(), retryCount: 0 },
    );
    return habit;
  };

  api.deleteHabit = async (id: string) => {
    const state = readState();
    const pendingCreate = state.queue.some((item) => item.kind === "habit.create" && item.entityId === id);
    if (pendingCreate) {
      writeState({
        ...state,
        habits: state.habits.filter((habit) => habit.id !== id),
        checkins: state.checkins.filter((item) => item.habitId !== id),
        queue: state.queue.filter((item) => item.entityId !== id),
      });
      return { success: true };
    }
    if (isOnline() && !isLocalId(id)) {
      try {
        const result = await native.deleteHabit(resolveId(state, id));
        const current = readState();
        writeState({
          ...current,
          habits: current.habits.filter((habit) => habit.id !== id),
          checkins: current.checkins.filter((item) => item.habitId !== id),
        });
        return result;
      } catch (error) {
        if (!isQueueableError(error) && errorStatus(error) !== 404) throw error;
      }
    }
    enqueue(
      {
        ...state,
        habits: state.habits.filter((habit) => habit.id !== id),
        checkins: state.checkins.filter((item) => item.habitId !== id),
      },
      { id: generateId("habit-op"), kind: "habit.delete", entityId: id, queuedAt: Date.now(), retryCount: 0 },
    );
    return { success: true };
  };

  api.checkInHabit = async (
    id: string,
    data: { status: HabitCheckinStatus; note?: string; checkinDate?: string },
  ) => {
    if (isOnline() && !isLocalId(id)) {
      try {
        const checkin = await native.checkInHabit(resolveId(readState(), id), data);
        writeState(applyCheckinToState(readState(), id, checkin));
        return checkin;
      } catch (error) {
        if (!isQueueableError(error)) throw error;
      }
    }
    const state = readState();
    const habit = state.habits.find((item) => item.id === id);
    if (!habit) throw new Error("离线缓存中找不到该习惯");
    const checkin = optimisticCheckin(habit, data);
    enqueue(
      applyCheckinToState(state, id, checkin),
      { id: generateId("habit-op"), kind: "habit.checkin", entityId: id, data, queuedAt: Date.now(), retryCount: 0 },
    );
    return checkin;
  };

  if (typeof window !== "undefined") {
    window.addEventListener("online", () => { void flush(); });
    queueMicrotask(() => { if (isOnline()) void flush(); });
  }

  const controller = { flush, pending };
  api[INSTALL_FLAG] = controller;
  return controller;
}

export const TASK_OFFLINE_CHANGE_EVENT = CHANGE_EVENT;

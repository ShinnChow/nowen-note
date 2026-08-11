/**
 * Task Reminders Repository
 *
 * 职责：
 * - 封装 task_reminders 表的数据库操作
 * - 提供类型安全的接口
 * - 保持现有 SQLite 行为不变
 */

import { getDb } from "../db/schema";
import { SqliteAdapter } from "../db/adapters";

function getAdapter() {
  return new SqliteAdapter(getDb());
}

/** task_reminders 记录 */
export interface TaskReminderRecord {
  id: string;
  taskId: string;
  userId: string;
  offsetMinutes: number;
  timezoneOffsetMinutes: number | null;
  enabled: number;
  snoozedUntil: string | null;
  lastNotifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const taskRemindersRepository = {
  listByTaskId(taskId: string, userId: string): TaskReminderRecord[] {
    const db = getDb();
    return db
      .prepare("SELECT * FROM task_reminders WHERE taskId = ? AND userId = ? ORDER BY offsetMinutes ASC")
      .all(taskId, userId) as TaskReminderRecord[];
  },

  getById(reminderId: string): TaskReminderRecord | undefined {
    const db = getDb();
    return db
      .prepare("SELECT * FROM task_reminders WHERE id = ?")
      .get(reminderId) as TaskReminderRecord | undefined;
  },

  create(input: {
    id: string;
    taskId: string;
    userId: string;
    offsetMinutes: number;
    timezoneOffsetMinutes?: number | null;
  }): void {
    const db = getDb();
    db.prepare(
      "INSERT INTO task_reminders (id, taskId, userId, offsetMinutes, timezoneOffsetMinutes, enabled) VALUES (?, ?, ?, ?, ?, 1)"
    ).run(input.id, input.taskId, input.userId, input.offsetMinutes, input.timezoneOffsetMinutes ?? null);
  },

  update(reminderId: string, input: {
    offsetMinutes: number;
    enabled: boolean;
    snoozedUntil: string | null;
  }): void {
    const db = getDb();
    db.prepare(
      "UPDATE task_reminders SET offsetMinutes = ?, enabled = ?, snoozedUntil = ?, updatedAt = datetime('now') WHERE id = ?"
    ).run(input.offsetMinutes, input.enabled ? 1 : 0, input.snoozedUntil, reminderId);
  },

  delete(reminderId: string): void {
    const db = getDb();
    db.prepare("DELETE FROM task_reminders WHERE id = ?").run(reminderId);
  },

  listActiveByUser(userId: string, workspaceId: string | null): Array<TaskReminderRecord & {
    title: string;
    isCompleted: number;
    dueDate: string | null;
    dueAt: string | null;
  }> {
    const db = getDb();
    if (workspaceId) {
      return db.prepare(`
        SELECT r.*, t.title, t.isCompleted, t.dueDate, t.dueAt
        FROM task_reminders r
        JOIN tasks t ON t.id = r.taskId
        WHERE r.userId = ? AND t.workspaceId = ?
        ORDER BY r.createdAt DESC
      `).all(userId, workspaceId) as any[];
    }
    return db.prepare(`
      SELECT r.*, t.title, t.isCompleted, t.dueDate, t.dueAt
      FROM task_reminders r
      JOIN tasks t ON t.id = r.taskId
      WHERE r.userId = ? AND t.workspaceId IS NULL
      ORDER BY r.createdAt DESC
    `).all(userId) as any[];
  },

  listPendingNotifications(): Array<TaskReminderRecord & {
    title: string;
    isCompleted: number;
  }> {
    const db = getDb();
    return db.prepare(`
      SELECT r.*, t.title, t.isCompleted
      FROM task_reminders r
      JOIN tasks t ON t.id = r.taskId
      WHERE r.enabled = 1
        AND t.isCompleted = 0
        AND (r.snoozedUntil IS NULL OR datetime(r.snoozedUntil) <= datetime('now'))
        AND (r.lastNotifiedAt IS NULL OR datetime(r.lastNotifiedAt) < datetime('now', '-' || r.offsetMinutes || ' minutes'))
      ORDER BY r.createdAt ASC
    `).all() as any[];
  },

  markNotified(reminderId: string): void {
    const db = getDb();
    db.prepare(
      "UPDATE task_reminders SET lastNotifiedAt = datetime('now'), snoozedUntil = NULL WHERE id = ?"
    ).run(reminderId);
  },

  listByTaskIdForCopy(taskId: string): TaskReminderRecord[] {
    const db = getDb();
    return db
      .prepare("SELECT * FROM task_reminders WHERE taskId = ?")
      .all(taskId) as TaskReminderRecord[];
  },

  copyReminder(sourceReminder: TaskReminderRecord, newTaskId: string): void {
    const db = getDb();
    const crypto = require("crypto");
    const rId = crypto.randomUUID();
    db.prepare(
      "INSERT INTO task_reminders (id, taskId, userId, offsetMinutes, timezoneOffsetMinutes, enabled, lastNotifiedAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NULL, datetime('now'), datetime('now'))"
    ).run(
      rId,
      newTaskId,
      sourceReminder.userId,
      sourceReminder.offsetMinutes,
      sourceReminder.timezoneOffsetMinutes ?? null,
      sourceReminder.enabled,
    );
  },

  async listByTaskIdAsync(taskId: string, userId: string): Promise<TaskReminderRecord[]> {
    return getAdapter().queryMany<TaskReminderRecord>(
      "SELECT * FROM task_reminders WHERE taskId = ? AND userId = ? ORDER BY offsetMinutes ASC",
      [taskId, userId],
    );
  },

  async getByIdAsync(reminderId: string): Promise<TaskReminderRecord | undefined> {
    return getAdapter().queryOne<TaskReminderRecord>(
      "SELECT * FROM task_reminders WHERE id = ?",
      [reminderId],
    );
  },

  async createAsync(input: {
    id: string;
    taskId: string;
    userId: string;
    offsetMinutes: number;
    timezoneOffsetMinutes?: number | null;
  }): Promise<void> {
    await getAdapter().execute(
      "INSERT INTO task_reminders (id, taskId, userId, offsetMinutes, timezoneOffsetMinutes, enabled) VALUES (?, ?, ?, ?, ?, 1)",
      [input.id, input.taskId, input.userId, input.offsetMinutes, input.timezoneOffsetMinutes ?? null],
    );
  },

  async updateAsync(reminderId: string, input: {
    offsetMinutes: number;
    enabled: boolean;
    snoozedUntil: string | null;
  }): Promise<void> {
    await getAdapter().execute(
      "UPDATE task_reminders SET offsetMinutes = ?, enabled = ?, snoozedUntil = ?, updatedAt = datetime('now') WHERE id = ?",
      [input.offsetMinutes, input.enabled ? 1 : 0, input.snoozedUntil, reminderId],
    );
  },

  async deleteAsync(reminderId: string): Promise<void> {
    await getAdapter().execute("DELETE FROM task_reminders WHERE id = ?", [reminderId]);
  },

  async listActiveByUserAsync(userId: string, workspaceId: string | null): Promise<Array<TaskReminderRecord & {
    title: string;
    isCompleted: number;
    dueDate: string | null;
    dueAt: string | null;
  }>> {
    if (workspaceId) {
      return getAdapter().queryMany<any>(
        `SELECT r.*, t.title, t.isCompleted, t.dueDate, t.dueAt
         FROM task_reminders r
         JOIN tasks t ON t.id = r.taskId
         WHERE r.userId = ? AND t.workspaceId = ?
         ORDER BY r.createdAt DESC`,
        [userId, workspaceId],
      );
    }
    return getAdapter().queryMany<any>(
      `SELECT r.*, t.title, t.isCompleted, t.dueDate, t.dueAt
       FROM task_reminders r
       JOIN tasks t ON t.id = r.taskId
       WHERE r.userId = ? AND t.workspaceId IS NULL
       ORDER BY r.createdAt DESC`,
      [userId],
    );
  },

  async listPendingNotificationsAsync(): Promise<Array<TaskReminderRecord & {
    title: string;
    isCompleted: number;
  }>> {
    return getAdapter().queryMany<any>(
      `SELECT r.*, t.title, t.isCompleted
       FROM task_reminders r
       JOIN tasks t ON t.id = r.taskId
       WHERE r.enabled = 1
         AND t.isCompleted = 0
         AND (r.snoozedUntil IS NULL OR datetime(r.snoozedUntil) <= datetime('now'))
         AND (r.lastNotifiedAt IS NULL OR datetime(r.lastNotifiedAt) < datetime('now', '-' || r.offsetMinutes || ' minutes'))
       ORDER BY r.createdAt ASC`,
    );
  },

  async markNotifiedAsync(reminderId: string): Promise<void> {
    await getAdapter().execute(
      "UPDATE task_reminders SET lastNotifiedAt = datetime('now'), snoozedUntil = NULL WHERE id = ?",
      [reminderId],
    );
  },

  async listByTaskIdForCopyAsync(taskId: string): Promise<TaskReminderRecord[]> {
    return getAdapter().queryMany<TaskReminderRecord>(
      "SELECT * FROM task_reminders WHERE taskId = ?",
      [taskId],
    );
  },

  async copyReminderAsync(sourceReminder: TaskReminderRecord, newTaskId: string): Promise<void> {
    const crypto = require("crypto");
    const rId = crypto.randomUUID();
    await getAdapter().execute(
      "INSERT INTO task_reminders (id, taskId, userId, offsetMinutes, timezoneOffsetMinutes, enabled, lastNotifiedAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NULL, datetime('now'), datetime('now'))",
      [
        rId,
        newTaskId,
        sourceReminder.userId,
        sourceReminder.offsetMinutes,
        sourceReminder.timezoneOffsetMinutes ?? null,
        sourceReminder.enabled,
      ],
    );
  },
};

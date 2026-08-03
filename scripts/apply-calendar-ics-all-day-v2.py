from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one anchor, found {count}\n{old[:160]}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


# ---------------------------------------------------------------------------
# Backend: keep dueAt precedence, add standards-aware timestamp parsing,
# omit zero-duration DTEND, and preserve UTC/offset semantics.
# ---------------------------------------------------------------------------
replace_once(
    "backend/src/routes/task-calendar.ts",
    '''function toIcsDate(dateStr: string): { value: string; isDateTime: boolean } {
  const normalized = dateStr.trim().replace(" ", "T").replace(/Z$/, "");
  const dateTime = normalized.match(/^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2})(?::(\\d{2}))?$/);
  if (dateTime) {
    const [, year, month, day, hour, minute, second = "00"] = dateTime;
    return { value: `${year}${month}${day}T${hour}${minute}${second}`, isDateTime: true };
  }
  return { value: normalized.replace(/-/g, ""), isDateTime: false };
}''',
    '''function formatUtcIcsDate(date: Date): string {
  return [
    date.getUTCFullYear(),
    pad2(date.getUTCMonth() + 1),
    pad2(date.getUTCDate()),
    "T",
    pad2(date.getUTCHours()),
    pad2(date.getUTCMinutes()),
    pad2(date.getUTCSeconds()),
    "Z",
  ].join("");
}

function toIcsDate(dateStr: string): { value: string; isDateTime: boolean } {
  const normalized = dateStr.trim().replace(" ", "T");
  const dateOnly = normalized.match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return { value: `${year}${month}${day}`, isDateTime: false };
  }

  const dateTime = normalized.match(
    /^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2})(?::(\\d{2}))?(?:\\.(\\d+))?(Z|[+-]\\d{2}:?\\d{2})?$/i,
  );
  if (dateTime) {
    const [, year, month, day, hour, minute, second = "00", , zone] = dateTime;
    const base = `${year}${month}${day}T${hour}${minute}${second}`;
    if (!zone) return { value: base, isDateTime: true };
    if (zone.toUpperCase() === "Z") return { value: `${base}Z`, isDateTime: true };

    const normalizedZone = zone.includes(":") ? zone : `${zone.slice(0, 3)}:${zone.slice(3)}`;
    const parsed = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}${normalizedZone}`);
    if (!Number.isNaN(parsed.getTime())) {
      return { value: formatUtcIcsDate(parsed), isDateTime: true };
    }
  }

  return { value: normalized.replace(/[-:]/g, ""), isDateTime: normalized.includes("T") };
}''',
)

replace_once(
    "backend/src/routes/task-calendar.ts",
    '''    if (end?.isDateTime) {
      lines.push(icsFold(`DTEND:${end.value}`));
    } else if (end) {''',
    '''    if (end?.isDateTime && end.value !== start.value) {
      lines.push(icsFold(`DTEND:${end.value}`));
    } else if (end && !end.isDateTime) {''',
)

replace_once(
    "backend/src/routes/task-calendar.ts",
    '''  if (task.updatedAt) {
    const lm = task.updatedAt.replace(/[-:]/g, "").replace(" ", "T").replace("Z", "");
    lines.push(icsFold(`LAST-MODIFIED:${lm}`));
  }''',
    '''  if (task.updatedAt) {
    const lastModified = toIcsDate(task.updatedAt);
    if (lastModified.isDateTime) {
      lines.push(icsFold(`LAST-MODIFIED:${lastModified.value}`));
    }
  }''',
)

# Backend regression matrix through the real ICS builder.
replace_once(
    "backend/tests/task-calendar.test.ts",
    '''  insertRealTask.run("t-due-date-range", "u-real", "dueDate 时间段", "", "2026-07-04T14:00", "2026-07-04T15:00", null, "2026-07-04 15:00:00");''',
    '''  insertRealTask.run("t-due-date-range", "u-real", "dueDate 时间段", "", "2026-07-04T14:00", "2026-07-04T15:00", null, "2026-07-04 15:00:00");
  insertRealTask.run("t-dual-end", "u-real", "dueAt 优先", "", "2026-07-05T12:00", "2026-07-05", "2026-07-05T13:00", "2026-07-05T13:00:00.000Z");
  insertRealTask.run("t-millis-z", "u-real", "UTC 毫秒", "", null, null, "2026-07-06T09:10:11.456Z", "2026-07-06T09:10:11.456Z");
  insertRealTask.run("t-offset", "u-real", "带偏移时间", "", null, null, "2026-07-06T17:10:11+08:00", "2026-07-06T17:10:11+08:00");
  insertRealTask.run("t-zero-duration", "u-real", "零时长", "", "2026-07-07T10:00", null, "2026-07-07T10:00", "2026-07-07T10:00:00");''',
)

replace_once(
    "backend/tests/task-calendar.test.ts",
    '''  assert.ok(dueDateRangeEvent.includes("DTSTART:20260704T140000"));
  assert.ok(dueDateRangeEvent.includes("DTEND:20260704T150000"));

  const publicResponse = await taskCalendar.request("/feed/real-token.ics");''',
    '''  assert.ok(dueDateRangeEvent.includes("DTSTART:20260704T140000"));
  assert.ok(dueDateRangeEvent.includes("DTEND:20260704T150000"));

  const dualEndEvent = body.split("BEGIN:VEVENT").find((event) => event.includes("UID:task-t-dual-end@nowen-note"));
  assert.ok(dualEndEvent);
  assert.ok(dualEndEvent.includes("DTSTART:20260705T120000"));
  assert.ok(dualEndEvent.includes("DTEND:20260705T130000"));
  assert.ok(!dualEndEvent.includes("DTEND;VALUE=DATE"));

  const millisEvent = body.split("BEGIN:VEVENT").find((event) => event.includes("UID:task-t-millis-z@nowen-note"));
  assert.ok(millisEvent);
  assert.ok(millisEvent.includes("DTSTART:20260706T091011Z"));

  const offsetEvent = body.split("BEGIN:VEVENT").find((event) => event.includes("UID:task-t-offset@nowen-note"));
  assert.ok(offsetEvent);
  assert.ok(offsetEvent.includes("DTSTART:20260706T091011Z"));

  const zeroDurationEvent = body.split("BEGIN:VEVENT").find((event) => event.includes("UID:task-t-zero-duration@nowen-note"));
  assert.ok(zeroDurationEvent);
  assert.ok(zeroDurationEvent.includes("DTSTART:20260707T100000"));
  assert.ok(!zeroDurationEvent.includes("DTEND:"));

  const publicResponse = await taskCalendar.request("/feed/real-token.ics");''',
)

# ---------------------------------------------------------------------------
# Frontend domain helpers: distinguish unscheduled, all-day and timed tasks.
# ---------------------------------------------------------------------------
replace_once(
    "frontend/src/components/tasks/taskDateUtils.ts",
    '''export function getDateValue(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(" ", "T").split("T")[0];
}
''',
    '''export function getDateValue(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(" ", "T").split("T")[0];
}

function hasExplicitTaskTime(value: string | null | undefined): boolean {
  if (!value) return false;
  return /(?:T|\\s)\\d{2}:\\d{2}/.test(value);
}

export type TaskScheduleMode = "unscheduled" | "all-day" | "timed";

export function getTaskScheduleMode(
  task: Pick<Task, "startDate" | "dueDate" | "dueAt">,
): TaskScheduleMode {
  const hasDate = Boolean(getDateValue(task.startDate) || getDateValue(task.dueDate) || getDateValue(task.dueAt));
  if (!hasDate) return "unscheduled";
  return hasExplicitTaskTime(task.startDate) || hasExplicitTaskTime(task.dueDate) || hasExplicitTaskTime(task.dueAt)
    ? "timed"
    : "all-day";
}

export function isTaskAllDay(task: Pick<Task, "startDate" | "dueDate" | "dueAt">): boolean {
  return getTaskScheduleMode(task) === "all-day";
}
''',
)

replace_once(
    "frontend/src/components/tasks/__tests__/taskDueTimeUtils.test.ts",
    '''  getDateValue,
  getDueTimeValue,
  isTaskDateRangeInvalid,
} from "../taskDateUtils";''',
    '''  getDateValue,
  getDueTimeValue,
  getTaskScheduleMode,
  isTaskAllDay,
  isTaskDateRangeInvalid,
} from "../taskDateUtils";''',
)

with Path("frontend/src/components/tasks/__tests__/taskDueTimeUtils.test.ts").open("a", encoding="utf-8") as file:
    file.write('''

describe("task schedule mode", () => {
  it("does not treat an unscheduled task as all-day", () => {
    const task = makeTask({ startDate: null, dueDate: null, dueAt: null });
    expect(getTaskScheduleMode(task)).toBe("unscheduled");
    expect(isTaskAllDay(task)).toBe(false);
  });

  it("recognizes date-only tasks as all-day", () => {
    const task = makeTask({ startDate: "2026-08-03", dueDate: "2026-08-03", dueAt: null });
    expect(getTaskScheduleMode(task)).toBe("all-day");
    expect(isTaskAllDay(task)).toBe(true);
  });

  it("recognizes ISO and legacy space timestamps as timed", () => {
    expect(getTaskScheduleMode(makeTask({ dueDate: "2026-08-03", dueAt: "2026-08-03T09:30" }))).toBe("timed");
    expect(getTaskScheduleMode(makeTask({ startDate: "2026-08-03 09:30:00", dueDate: "2026-08-03" }))).toBe("timed");
  });
});
''')

# ---------------------------------------------------------------------------
# Task detail UI: accessible switch, no unscheduled misclassification, and
# session restore for time values cleared by the all-day transition.
# ---------------------------------------------------------------------------
replace_once(
    "frontend/src/components/tasks/TaskDetailPanel.tsx",
    '''  getDateValue,
  getDueTimeValue,
  isTaskDateRangeInvalid,
} from "./taskDateUtils";''',
    '''  getDateValue,
  getDueTimeValue,
  isTaskAllDay,
  isTaskDateRangeInvalid,
} from "./taskDateUtils";''',
)

replace_once(
    "frontend/src/components/tasks/TaskDetailPanel.tsx",
    '''  const [dueAt, setDueAt] = useState(getDueTimeValue(task.dueAt || task.dueDate));
  const [startDate, setStartDate] = useState(getDateValue(task.startDate));
  const [startAt, setStartAt] = useState(getDueTimeValue(task.startDate));
  const [repeatRule, setRepeatRule] = useState<"none" | "daily" | "weekly" | "monthly" | "yearly" | "custom">(task.repeatRule || "none");''',
    '''  const [dueAt, setDueAt] = useState(getDueTimeValue(task.dueAt || task.dueDate));
  const [startDate, setStartDate] = useState(getDateValue(task.startDate));
  const [startAt, setStartAt] = useState(getDueTimeValue(task.startDate));
  const [allDay, setAllDay] = useState(isTaskAllDay(task));
  const timedValuesRef = useRef({
    startAt: getDueTimeValue(task.startDate),
    dueAt: getDueTimeValue(task.dueAt || task.dueDate),
  });
  const [repeatRule, setRepeatRule] = useState<"none" | "daily" | "weekly" | "monthly" | "yearly" | "custom">(task.repeatRule || "none");''',
)

replace_once(
    "frontend/src/components/tasks/TaskDetailPanel.tsx",
    '''  ]);

  // load reminders for this task''',
    '''  ]);

  useEffect(() => {
    const nextDueDate = getDateValue(task.dueDate || task.dueAt);
    const nextDueAt = getDueTimeValue(task.dueAt || task.dueDate);
    const nextStartDate = getDateValue(task.startDate);
    const nextStartAt = getDueTimeValue(task.startDate);
    setDueDate(nextDueDate);
    setDueAt(nextDueAt);
    setStartDate(nextStartDate);
    setStartAt(nextStartAt);
    setAllDay(isTaskAllDay(task));
    if (nextStartAt || nextDueAt) {
      timedValuesRef.current = { startAt: nextStartAt, dueAt: nextDueAt };
    }
  }, [task.id, task.startDate, task.dueDate, task.dueAt]);

  // load reminders for this task''',
)

replace_once(
    "frontend/src/components/tasks/TaskDetailPanel.tsx",
    '''  const handleSave = () => {
    onUpdate(task.id, {
      title: title.trim() || task.title,
      priority,
      dueDate: dueDate || null,
      dueAt: buildDueAtFromDateAndTime(dueDate, dueAt),
      startDate: buildStartDateFromDateAndTime(startDate, startAt),
    });
  };''',
    '''  const hasScheduledDate = Boolean(startDate || dueDate);

  const handleAllDayToggle = () => {
    const nextAllDay = !allDay;
    if (nextAllDay && !hasScheduledDate) return;

    if (nextAllDay) {
      if (startAt || dueAt) {
        timedValuesRef.current = { startAt, dueAt };
      }
      setAllDay(true);
      setStartAt("");
      setDueAt("");
      setDateError(isTaskDateRangeInvalid(startDate || null, dueDate || null, null)
        ? t("tasks.gantt.invalidDateRange")
        : null);
      onUpdate(task.id, {
        startDate: startDate || null,
        dueAt: null,
      });
      return;
    }

    setAllDay(false);
    const previous = timedValuesRef.current;
    if (!previous.startAt && !previous.dueAt) return;

    setStartAt(previous.startAt);
    setDueAt(previous.dueAt);
    const nextStart = buildStartDateFromDateAndTime(startDate, previous.startAt);
    const nextDueAt = buildDueAtFromDateAndTime(dueDate, previous.dueAt);
    setDateError(isTaskDateRangeInvalid(nextStart, dueDate, nextDueAt)
      ? t("tasks.gantt.invalidDateRange")
      : null);
    onUpdate(task.id, { startDate: nextStart, dueAt: nextDueAt });
  };

  const handleSave = () => {
    onUpdate(task.id, {
      title: title.trim() || task.title,
      priority,
      dueDate: dueDate || null,
      dueAt: allDay ? null : buildDueAtFromDateAndTime(dueDate, dueAt),
      startDate: allDay ? (startDate || null) : buildStartDateFromDateAndTime(startDate, startAt),
    });
  };''',
)

replace_once(
    "frontend/src/components/tasks/TaskDetailPanel.tsx",
    '''        {/* Start Date */}
        <div>''',
    '''        <div className="space-y-1.5">
          <button
            type="button"
            role="switch"
            aria-checked={allDay}
            aria-label={t("tasks.allDay")}
            disabled={!hasScheduledDate}
            title={!hasScheduledDate ? t("tasks.allDayRequiresDate") : undefined}
            onClick={handleAllDayToggle}
            className="inline-flex items-center gap-2 text-xs text-tx-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className={cn(
              "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
              allDay ? "bg-accent-primary" : "bg-app-border",
            )}>
              <span className={cn(
                "pointer-events-none absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                allDay ? "translate-x-[18px]" : "translate-x-0.5",
              )} />
            </span>
            <span>{t("tasks.allDay")}</span>
          </button>
          {!hasScheduledDate && (
            <p className="text-[10px] text-tx-tertiary">{t("tasks.allDayRequiresDate")}</p>
          )}
        </div>

        {/* Start Date */}
        <div>''',
)

replace_once(
    "frontend/src/components/tasks/TaskDetailPanel.tsx",
    '''              const nextStart = buildStartDateFromDateAndTime(newVal, startAt);
              setStartDate(newVal);''',
    '''              const nextStart = allDay ? (newVal || null) : buildStartDateFromDateAndTime(newVal, startAt);
              setStartDate(newVal);''',
)

replace_once(
    "frontend/src/components/tasks/TaskDetailPanel.tsx",
    '''        {/* Start At (time) */}
        <div>
          <label className="text-xs text-tx-tertiary uppercase tracking-wider mb-1.5 block">{t("tasks.startAt")}</label>
          <input
            type="time"
            value={startAt}
            disabled={!startDate}
            onChange={(e) => {
              const nextTime = e.target.value;
              const nextStart = buildStartDateFromDateAndTime(startDate, nextTime);
              setStartAt(nextTime);
              if (isTaskDateRangeInvalid(nextStart, dueDate, buildDueAtFromDateAndTime(dueDate, dueAt))) {
                setDateError(t("tasks.gantt.invalidDateRange"));
                return;
              }
              setDateError(null);
              onUpdate(task.id, { startDate: nextStart });
            }}
            className="w-full px-3 py-2 rounded-md bg-app-bg border border-app-border text-sm text-tx-primary focus:outline-none focus:border-accent-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>''',
    '''        {/* Start At (time) */}
        {!allDay && (
          <div>
            <label className="text-xs text-tx-tertiary uppercase tracking-wider mb-1.5 block">{t("tasks.startAt")}</label>
            <input
              type="time"
              value={startAt}
              disabled={!startDate}
              onChange={(e) => {
                const nextTime = e.target.value;
                const nextStart = buildStartDateFromDateAndTime(startDate, nextTime);
                setStartAt(nextTime);
                timedValuesRef.current = { ...timedValuesRef.current, startAt: nextTime };
                if (isTaskDateRangeInvalid(nextStart, dueDate, buildDueAtFromDateAndTime(dueDate, dueAt))) {
                  setDateError(t("tasks.gantt.invalidDateRange"));
                  return;
                }
                setDateError(null);
                onUpdate(task.id, { startDate: nextStart });
              }}
              className="w-full px-3 py-2 rounded-md bg-app-bg border border-app-border text-sm text-tx-primary focus:outline-none focus:border-accent-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        )}''',
)

replace_once(
    "frontend/src/components/tasks/TaskDetailPanel.tsx",
    '''              setDateError(null);
              onUpdate(task.id, buildDueDatePatch({ ...task, dueAt: buildDueAtFromDateAndTime(dueDate, dueAt) }, newVal));''',
    '''              setDateError(null);
              const nextDueAt = allDay ? null : buildDueAtFromDateAndTime(newVal, dueAt);
              const patch = buildDueDatePatch({ ...task, dueAt: nextDueAt }, newVal);
              if (allDay) patch.dueAt = null;
              onUpdate(task.id, patch);''',
)

replace_once(
    "frontend/src/components/tasks/TaskDetailPanel.tsx",
    '''        {/* Due At (time) */}
        <div>
          <label className="text-xs text-tx-tertiary uppercase tracking-wider mb-1.5 block">{t("tasks.dueAt")}</label>
          <input
            type="time"
            value={dueAt}
            disabled={!dueDate}
            onChange={(e) => {
              const nextTime = e.target.value;
              const nextDueAt = buildDueAtFromDateAndTime(dueDate, nextTime);
              setDueAt(nextTime);
              if (isTaskDateRangeInvalid(buildStartDateFromDateAndTime(startDate, startAt), dueDate, nextDueAt)) {
                setDateError(t("tasks.gantt.invalidDateRange"));
                return;
              }
              setDateError(null);
              onUpdate(task.id, { dueAt: nextDueAt });
            }}
            className="w-full px-3 py-2 rounded-md bg-app-bg border border-app-border text-sm text-tx-primary focus:outline-none focus:border-accent-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>''',
    '''        {/* Due At (time) */}
        {!allDay && (
          <div>
            <label className="text-xs text-tx-tertiary uppercase tracking-wider mb-1.5 block">{t("tasks.dueAt")}</label>
            <input
              type="time"
              value={dueAt}
              disabled={!dueDate}
              onChange={(e) => {
                const nextTime = e.target.value;
                const nextDueAt = buildDueAtFromDateAndTime(dueDate, nextTime);
                setDueAt(nextTime);
                timedValuesRef.current = { ...timedValuesRef.current, dueAt: nextTime };
                if (isTaskDateRangeInvalid(buildStartDateFromDateAndTime(startDate, startAt), dueDate, nextDueAt)) {
                  setDateError(t("tasks.gantt.invalidDateRange"));
                  return;
                }
                setDateError(null);
                onUpdate(task.id, { dueAt: nextDueAt });
              }}
              className="w-full px-3 py-2 rounded-md bg-app-bg border border-app-border text-sm text-tx-primary focus:outline-none focus:border-accent-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        )}''',
)

# i18n
replace_once(
    "frontend/src/i18n/locales/en.json",
    '''    "startAt": "Start Time",
    "dueDate": "Due Date",''',
    '''    "startAt": "Start Time",
    "allDay": "All Day",
    "allDayRequiresDate": "Choose a start or due date before enabling all-day",
    "dueDate": "Due Date",''',
)
replace_once(
    "frontend/src/i18n/locales/zh-CN.json",
    '''    "startAt": "开始时间",
    "gantt": {''',
    '''    "startAt": "开始时间",
    "allDay": "全天",
    "allDayRequiresDate": "请先选择开始日期或截止日期",
    "gantt": {''',
)

# Lightweight UI contract regression.
Path("frontend/src/components/tasks/__tests__/taskAllDayContract.test.ts").write_text(
    '''import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(__dirname, "../TaskDetailPanel.tsx"), "utf8");

describe("TaskDetailPanel all-day contract", () => {
  it("uses an accessible switch and keeps unscheduled tasks disabled", () => {
    expect(source).toContain('role="switch"');
    expect(source).toContain("aria-checked={allDay}");
    expect(source).toContain("disabled={!hasScheduledDate}");
  });

  it("keeps a session backup before clearing task times", () => {
    expect(source).toContain("timedValuesRef.current = { startAt, dueAt }");
    expect(source).toContain("const previous = timedValuesRef.current");
  });

  it("does not persist time fields while all-day is enabled", () => {
    expect(source).toContain("dueAt: allDay ? null");
    expect(source).toContain("startDate: allDay ? (startDate || null)");
  });
});
''',
    encoding="utf-8",
)

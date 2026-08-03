import { relativeLocalDateKey } from "@/lib/dailyRecords";

export type DailyRecordCommandKind = "timestamp" | "relative-journal" | "pick-journal-date";

export interface DailyRecordCommandDefinition {
  id:
    | "daily-now"
    | "daily-today"
    | "daily-tomorrow"
    | "daily-day-after-tomorrow"
    | "daily-pick-date";
  kind: DailyRecordCommandKind;
  label: string;
  description: string;
  category: "日期与日记";
  keywords: string[];
  dayOffset?: number;
}

export const DAILY_RECORD_COMMAND_DEFINITIONS: readonly DailyRecordCommandDefinition[] = [
  {
    id: "daily-now",
    kind: "timestamp",
    label: "现在",
    description: "插入当前本地日期和时间",
    category: "日期与日记",
    keywords: ["now", "time", "date", "现在", "时间", "日期"],
  },
  {
    id: "daily-today",
    kind: "relative-journal",
    dayOffset: 0,
    label: "今天",
    description: "创建或复用今日日记并插入链接",
    category: "日期与日记",
    keywords: ["today", "journal", "今天", "今日", "日记"],
  },
  {
    id: "daily-tomorrow",
    kind: "relative-journal",
    dayOffset: 1,
    label: "明天",
    description: "创建或复用明日日记并插入链接",
    category: "日期与日记",
    keywords: ["tomorrow", "journal", "明天", "明日", "日记"],
  },
  {
    id: "daily-day-after-tomorrow",
    kind: "relative-journal",
    dayOffset: 2,
    label: "后天",
    description: "创建或复用后天日记并插入链接",
    category: "日期与日记",
    keywords: ["day after tomorrow", "journal", "后天", "日记"],
  },
  {
    id: "daily-pick-date",
    kind: "pick-journal-date",
    label: "选择日期",
    description: "选择日期并插入对应日记链接",
    category: "日期与日记",
    keywords: ["date", "calendar", "journal", "选择日期", "自定义日期", "日记"],
  },
] as const;

export function resolveDailyRecordCommandDate(
  definition: DailyRecordCommandDefinition,
  now = new Date(),
): string | null {
  if (definition.kind !== "relative-journal") return null;
  return relativeLocalDateKey(definition.dayOffset || 0, now);
}

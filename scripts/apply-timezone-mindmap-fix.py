from pathlib import Path
import re


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    text = file_path.read_text(encoding="utf-8-sig")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one marker, found {count}: {old[:120]!r}")
    file_path.write_text(text.replace(old, new, 1), encoding="utf-8")


def regex_once(path: str, pattern: str, replacement: str) -> None:
    file_path = Path(path)
    text = file_path.read_text(encoding="utf-8-sig")
    next_text, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one regex match, found {count}: {pattern[:120]!r}")
    file_path.write_text(next_text, encoding="utf-8")


Path("frontend/src/lib/dateTime.ts").write_text(r'''/**
 * 统一时间解析与本地输入转换工具。
 *
 * 数据契约：
 * - 后端数据库中的无时区 `YYYY-MM-DD HH:mm:ss` 一律表示 UTC；
 * - `datetime-local` 一律表示用户设备的本地墙上时间；
 * - 发送到后端前必须转换为带 `Z` 的 ISO 8601；
 * - 展示或回填输入框时再由 UTC 转回设备本地时间。
 */

interface LocalDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function parseLocalDateTimeInput(value: string): LocalDateTimeParts | null {
  const match = value.trim().match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (!match) return null;
  const parts: LocalDateTimeParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] || "0"),
  };
  const probe = new Date(Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  ));
  if (
    probe.getUTCFullYear() !== parts.year ||
    probe.getUTCMonth() !== parts.month - 1 ||
    probe.getUTCDate() !== parts.day ||
    probe.getUTCHours() !== parts.hour ||
    probe.getUTCMinutes() !== parts.minute ||
    probe.getUTCSeconds() !== parts.second
  ) return null;
  return parts;
}

function resolveLocalOffsetMinutes(
  parts: LocalDateTimeParts,
  timezoneOffsetMinutes?: number,
): number {
  if (typeof timezoneOffsetMinutes === "number" && Number.isFinite(timezoneOffsetMinutes)) {
    return timezoneOffsetMinutes;
  }
  return new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  ).getTimezoneOffset();
}

/**
 * 解析后端返回的 UTC 时间字符串。
 * - 已带时区后缀（Z / +08:00）→ 直接解析；
 * - SQLite `YYYY-MM-DD HH:mm:ss` → 追加 Z，按 UTC 解析；
 * - null / undefined / 非法值 → null。
 */
export function parseServerTime(ts: string | undefined | null): Date | null {
  if (!ts || typeof ts !== "string") return null;
  const trimmed = ts.trim();
  if (!trimmed) return null;

  const source = /Z$|[+-]\d{2}:?\d{2}$/.test(trimmed)
    ? trimmed
    : `${trimmed.replace(" ", "T")}Z`;
  const date = new Date(source);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 把浏览器 datetime-local 值转换为明确的 UTC ISO 字符串。 */
export function localDateTimeInputToUtcIso(
  value: string,
  timezoneOffsetMinutes?: number,
): string | null {
  const parts = parseLocalDateTimeInput(value);
  if (!parts) return null;
  const offset = resolveLocalOffsetMinutes(parts, timezoneOffsetMinutes);
  const utcMillis = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  ) + offset * 60_000;
  return new Date(utcMillis).toISOString();
}

/** 把数据库 UTC 时间回填成 datetime-local 需要的本地格式。 */
export function utcSqlToLocalDateTimeInput(
  value: string | undefined | null,
  timezoneOffsetMinutes?: number,
): string {
  const date = parseServerTime(value);
  if (!date) return "";

  if (typeof timezoneOffsetMinutes === "number" && Number.isFinite(timezoneOffsetMinutes)) {
    const local = new Date(date.getTime() - timezoneOffsetMinutes * 60_000);
    return `${local.getUTCFullYear()}-${pad2(local.getUTCMonth() + 1)}-${pad2(local.getUTCDate())}` +
      `T${pad2(local.getUTCHours())}:${pad2(local.getUTCMinutes())}`;
  }

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}` +
    `T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function isoToUtcSql(value: string | null): string | undefined {
  return value ? value.slice(0, 19).replace("T", " ") : undefined;
}

export interface LocalDateRange {
  from?: string;
  to?: string;
}

/**
 * 把本地日期筛选边界转换成 UTC SQL 字符串。
 * 例如上海 2026-07-31 对应 UTC 2026-07-30 16:00:00 ~ 2026-07-31 15:59:59。
 */
export function localDateRangeToUtcSqlBounds(
  range: LocalDateRange,
  timezoneOffsetMinutes?: number,
): LocalDateRange {
  return {
    from: range.from
      ? isoToUtcSql(localDateTimeInputToUtcIso(`${range.from}T00:00:00`, timezoneOffsetMinutes))
      : undefined,
    to: range.to
      ? isoToUtcSql(localDateTimeInputToUtcIso(`${range.to}T23:59:59`, timezoneOffsetMinutes))
      : undefined,
  };
}

/** 解析后端时间并格式化为本地时间字符串。 */
export function formatServerTime(
  ts: string | undefined | null,
  options?: Intl.DateTimeFormatOptions,
  fallback?: string,
): string {
  const date = parseServerTime(ts);
  if (!date) return fallback ?? ts ?? "";
  return options ? date.toLocaleString(undefined, options) : date.toLocaleString();
}

/** 解析后端时间并格式化为本地日期字符串。 */
export function formatServerDate(
  ts: string | undefined | null,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = parseServerTime(ts);
  if (!date) return ts ?? "";
  return date.toLocaleDateString(undefined, options);
}
''', encoding="utf-8")

replace_once(
    "frontend/src/components/DiaryCenter.tsx",
    'import { useApp } from "@/store/AppContext";\n',
    'import { useApp } from "@/store/AppContext";\nimport {\n  localDateRangeToUtcSqlBounds,\n  localDateTimeInputToUtcIso,\n  parseServerTime,\n  utcSqlToLocalDateTimeInput,\n} from "@/lib/dateTime";\n',
)
replace_once(
    "frontend/src/components/DiaryCenter.tsx",
    '  const date = new Date(dateStr.replace(" ", "T") + "Z");\n  const diffMs = now.getTime() - date.getTime();',
    '  const date = parseServerTime(dateStr);\n  if (!date) return dateStr;\n  const diffMs = now.getTime() - date.getTime();',
)
replace_once(
    "frontend/src/components/DiaryCenter.tsx",
    '        createdAt: customDate || undefined,',
    '        createdAt: customDate\n          ? localDateTimeInputToUtcIso(customDate) || undefined\n          : undefined,',
)
replace_once(
    "frontend/src/components/DiaryCenter.tsx",
    '''  const [createdAt, setCreatedAt] = useState(() => {
    // 将 "YYYY-MM-DD HH:MM:SS" 转为 "YYYY-MM-DDTHH:MM" 格式供 input[type=datetime-local] 使用
    if (item.createdAt) {
      return item.createdAt.replace(" ", "T").slice(0, 16);
    }
    return "";
  });''',
    '''  const [createdAt, setCreatedAt] = useState(() =>
    utcSqlToLocalDateTimeInput(item.createdAt),
  );''',
)
replace_once(
    "frontend/src/components/DiaryCenter.tsx",
    '        createdAt: createdAt || undefined,',
    '        createdAt: createdAt\n          ? localDateTimeInputToUtcIso(createdAt) || undefined\n          : undefined,',
)
replace_once(
    "frontend/src/components/DiaryCenter.tsx",
    '    const date = new Date(item.createdAt.replace(" ", "T") + "Z");\n    const key = formatDateKey(date);',
    '    const date = parseServerTime(item.createdAt);\n    if (!date) continue;\n    const key = formatDateKey(date);',
)
replace_once(
    "frontend/src/components/DiaryCenter.tsx",
    ''' * 后端约定：from/to 直接走字符串比较（createdAt 是 UTC "YYYY-MM-DD HH:MM:SS"）。
 * 这里前端发出的 from 也是不带时区的 "YYYY-MM-DD"，后端会补 00:00:00、23:59:59。
 * 由于 createdAt 是 UTC 而用户输入是本地日期，会有最多 ±1 天的边界偏差；
 * 对"说说时间筛选"这种轻量功能可接受 —— 真要完全准确得在前端把本地日期转成
 * UTC ISO 再传，复杂度上去而收益有限，先按简单方案做。''',
    ''' * UI 保存的是用户本地日期；请求前转换成 UTC SQL 边界，确保上海等非 UTC
 * 时区的“今天/近 7 天/自定义日期”不会跨日偏移。''',
)
replace_once(
    "frontend/src/components/DiaryCenter.tsx",
    '      return { from: ymd(now) };',
    '      return localDateRangeToUtcSqlBounds({ from: ymd(now) });',
)
replace_once(
    "frontend/src/components/DiaryCenter.tsx",
    '      return { from: ymd(d) };\n    }\n    case "month": {',
    '      return localDateRangeToUtcSqlBounds({ from: ymd(d) });\n    }\n    case "month": {',
)
replace_once(
    "frontend/src/components/DiaryCenter.tsx",
    '      return { from: ymd(d) };\n    }\n    case "custom":',
    '      return localDateRangeToUtcSqlBounds({ from: ymd(d) });\n    }\n    case "custom":',
)
replace_once(
    "frontend/src/components/DiaryCenter.tsx",
    '      return { from: customRange.from, to: customRange.to };',
    '      return localDateRangeToUtcSqlBounds(customRange);',
)

Path("backend/src/lib/utc-time.ts").write_text(r'''const SQL_DATE_TIME = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::(\d{2}))?$/;

function isValidUtcSql(value: string): boolean {
  const match = value.match(SQL_DATE_TIME);
  if (!match) return false;
  const iso = `${match[1]}T${match[2]}:${match[3] || "00"}Z`;
  const date = new Date(iso);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 19) === iso.slice(0, 19);
}

/**
 * 把 API 时间输入规范化为 SQLite UTC 字符串。
 * 无时区的 SQL / ISO 字符串按 UTC 解释；带 Z 或 offset 的输入转换为 UTC。
 */
export function normalizeUtcInputToSql(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const value = raw.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const normalized = `${value} 00:00:00`;
    return isValidUtcSql(normalized) ? normalized : null;
  }

  if (SQL_DATE_TIME.test(value)) {
    const match = value.match(SQL_DATE_TIME)!;
    const normalized = `${match[1]} ${match[2]}:${match[3] || "00"}`;
    return isValidUtcSql(normalized) ? normalized : null;
  }

  if (/Z$|[+-]\d{2}:?\d{2}$/.test(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? null
      : date.toISOString().slice(0, 19).replace("T", " ");
  }

  return null;
}

/** 规范化时间筛选边界；date-only 仍按 UTC 日期兼容旧客户端。 */
export function normalizeUtcDateBound(
  raw: string | undefined,
  kind: "from" | "to",
): string | null {
  if (!raw?.trim()) return null;
  const value = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const normalized = `${value} ${kind === "from" ? "00:00:00" : "23:59:59"}`;
    return isValidUtcSql(normalized) ? normalized : null;
  }
  return normalizeUtcInputToSql(value);
}

/** 把数据库 UTC SQL 时间输出为带 Z 的 ISO 8601，避免导出软件按本地时间误读。 */
export function formatSqlUtcAsIso(value: string): string {
  const normalized = normalizeUtcInputToSql(value);
  if (!normalized) return value;
  return new Date(`${normalized.replace(" ", "T")}Z`).toISOString();
}
''', encoding="utf-8")

replace_once(
    "backend/src/routes/diary.ts",
    'import { diaryAttachmentsRepository } from "../repositories";\n',
    'import { diaryAttachmentsRepository } from "../repositories";\nimport { normalizeUtcDateBound, normalizeUtcInputToSql } from "../lib/utc-time";\n',
)
regex_once(
    "backend/src/routes/diary.ts",
    r'// ---------------------------------------------------------------------------\n// 时间筛选：.*?\nfunction normalizeCustomDate\(raw: unknown\): string \| null \{.*?\n\}\n\n// 公用：',
    '''// ---------------------------------------------------------------------------
// 时间筛选与自定义发布时间统一使用 UTC 数据契约。
// ---------------------------------------------------------------------------

// 公用：''',
)
path = Path("backend/src/routes/diary.ts")
text = path.read_text(encoding="utf-8")
text = text.replace("normalizeCustomDate(body.createdAt)", "normalizeUtcInputToSql(body.createdAt)")
text = text.replace("normalizeDateBound(c.req.query(\"from\"), \"from\")", "normalizeUtcDateBound(c.req.query(\"from\"), \"from\")")
text = text.replace("normalizeDateBound(c.req.query(\"to\"), \"to\")", "normalizeUtcDateBound(c.req.query(\"to\"), \"to\")")
if "normalizeCustomDate" in text or "normalizeDateBound(" in text:
    raise SystemExit("backend/src/routes/diary.ts: stale local time normalizer remains")
path.write_text(text, encoding="utf-8")

replace_once(
    "backend/src/services/nowenPackageExport.ts",
    'import { resolveResourceKnowledgeAccess } from "./knowledgeCapabilities";\n',
    'import { resolveResourceKnowledgeAccess } from "./knowledgeCapabilities";\nimport { formatSqlUtcAsIso } from "../lib/utc-time";\n',
)
replace_once(
    "backend/src/services/nowenPackageExport.ts",
    '''        `created: ${note.createdAt}`,
        `updated: ${note.updatedAt}`,''',
    '''        `created: ${formatSqlUtcAsIso(note.createdAt)}`,
        `updated: ${formatSqlUtcAsIso(note.updatedAt)}`,''',
)

replace_once(
    "frontend/src/components/MindMapEditor.tsx",
    '''/* ===== 连线组件 ===== */
const Edge = React.memo(function Edge({ from, to }: { from: LayoutNode; to: LayoutNode }) {
  const toIsLeft = to.x + to.width < from.x;
  let x1: number, y1: number, x2: number, y2: number;
  if (toIsLeft) {
    x1 = from.x;
    y1 = from.y + from.height / 2;
    x2 = to.x + to.width;
    y2 = to.y + to.height / 2;
  } else {
    x1 = from.x + from.width;
    y1 = from.y + from.height / 2;
    x2 = to.x;
    y2 = to.y + to.height / 2;
  }
  const mx = (x1 + x2) / 2;''',
    '''/* ===== 连线组件 ===== */
export interface MindMapEdgeGeometry {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  controlX: number;
}

/** 节点和连线共用同一份布局边界，避免宽度/方向计算分叉。 */
export function getMindMapEdgeGeometry(
  from: Pick<LayoutNode, "x" | "y" | "width" | "height">,
  to: Pick<LayoutNode, "x" | "y" | "width" | "height">,
): MindMapEdgeGeometry {
  const toIsLeft = to.x + to.width < from.x;
  const x1 = toIsLeft ? from.x : from.x + from.width;
  const y1 = from.y + from.height / 2;
  const x2 = toIsLeft ? to.x + to.width : to.x;
  const y2 = to.y + to.height / 2;
  return { x1, y1, x2, y2, controlX: (x1 + x2) / 2 };
}

const Edge = React.memo(function Edge({ from, to }: { from: LayoutNode; to: LayoutNode }) {
  const { x1, y1, x2, y2, controlX: mx } = getMindMapEdgeGeometry(from, to);''',
)
replace_once(
    "frontend/src/components/MindMapEditor.tsx",
    '''      strokeWidth={MT.edgeWidth}
      className=""''',
    '''      strokeWidth={MT.edgeWidth}
      vectorEffect="non-scaling-stroke"
      shapeRendering="geometricPrecision"
      className=""''',
)
replace_once(
    "frontend/src/components/MindMapEditor.tsx",
    '<foreignObject x={node.x} y={node.y} width={node.width} height={node.height}>\n        <div\n          data-mindmap-node-id={node.id}',
    '<foreignObject\n        x={node.x}\n        y={node.y}\n        width={node.width}\n        height={node.height}\n        overflow="visible"\n      >\n        <div\n          xmlns="http://www.w3.org/1999/xhtml"\n          data-mindmap-node-id={node.id}\n          data-mindmap-node-surface="true"',
)
replace_once(
    "frontend/src/components/MindMapEditor.tsx",
    '"relative flex items-center h-full px-3 rounded-[12px] cursor-pointer select-none transition-all duration-150 ease-out text-sm font-medium whitespace-nowrap overflow-hidden group",',
    '"relative flex items-center h-full px-3 rounded-[12px] cursor-pointer select-none transition-colors duration-150 ease-out text-sm font-medium whitespace-nowrap overflow-hidden group",',
)
replace_once(
    "frontend/src/components/MindMapEditor.tsx",
    '''          style={{
            background: isRoot ?''',
    '''          style={{
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
            background: isRoot ?''',
)
replace_once(
    "frontend/src/components/MindMapEditor.tsx",
    '''                <svg
                  ref={svgRef}
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${Math.max(1, canvasSize.width)} ${Math.max(1, canvasSize.height)}`}
                >''',
    '''                <svg
                  ref={svgRef}
                  width="100%"
                  height="100%"
                  data-mindmap-canvas-svg="true"
                  className="block overflow-visible"
                >''',
)

Path("frontend/src/lib/__tests__/dateTime.test.ts").write_text(r'''import { describe, expect, it } from "vitest";
import {
  localDateRangeToUtcSqlBounds,
  localDateTimeInputToUtcIso,
  utcSqlToLocalDateTimeInput,
} from "../dateTime";

describe("UTC/local time contract", () => {
  it("converts Shanghai datetime-local to UTC before submission", () => {
    expect(localDateTimeInputToUtcIso("2026-07-31T13:30", -480))
      .toBe("2026-07-31T05:30:00.000Z");
  });

  it("converts UTC SQL back to Shanghai datetime-local for editing", () => {
    expect(utcSqlToLocalDateTimeInput("2026-07-31 05:30:00", -480))
      .toBe("2026-07-31T13:30");
  });

  it("converts a local calendar day to exact UTC query bounds", () => {
    expect(localDateRangeToUtcSqlBounds({
      from: "2026-07-31",
      to: "2026-07-31",
    }, -480)).toEqual({
      from: "2026-07-30 16:00:00",
      to: "2026-07-31 15:59:59",
    });
  });
});
''', encoding="utf-8")

Path("frontend/src/components/__tests__/MindMapGeometryAlignment.test.ts").write_text(r'''import { describe, expect, it } from "vitest";
import { getMindMapEdgeGeometry } from "../MindMapEditor";

describe("mind map edge alignment", () => {
  it("anchors a right-side edge to the exact node boundaries", () => {
    expect(getMindMapEdgeGeometry(
      { x: 10, y: 20, width: 100, height: 36 },
      { x: 180, y: 70, width: 80, height: 36 },
    )).toEqual({
      x1: 110,
      y1: 38,
      x2: 180,
      y2: 88,
      controlX: 145,
    });
  });

  it("anchors a left-side edge to the exact node boundaries", () => {
    expect(getMindMapEdgeGeometry(
      { x: 180, y: 70, width: 80, height: 36 },
      { x: 10, y: 20, width: 100, height: 36 },
    )).toEqual({
      x1: 180,
      y1: 88,
      x2: 110,
      y2: 38,
      controlX: 145,
    });
  });
});
''', encoding="utf-8")

Path("backend/tests/utc-time.test.ts").write_text(r'''import assert from "node:assert/strict";
import test from "node:test";
import {
  formatSqlUtcAsIso,
  normalizeUtcDateBound,
  normalizeUtcInputToSql,
} from "../src/lib/utc-time";

test("timezone offset input is normalized to UTC SQL", () => {
  assert.equal(
    normalizeUtcInputToSql("2026-07-31T13:30:00+08:00"),
    "2026-07-31 05:30:00",
  );
});

test("UTC and SQL inputs preserve the same instant", () => {
  assert.equal(normalizeUtcInputToSql("2026-07-31T05:30:00Z"), "2026-07-31 05:30:00");
  assert.equal(normalizeUtcInputToSql("2026-07-31 05:30:00"), "2026-07-31 05:30:00");
});

test("date bounds and export metadata are unambiguous UTC", () => {
  assert.equal(normalizeUtcDateBound("2026-07-31", "to"), "2026-07-31 23:59:59");
  assert.equal(formatSqlUtcAsIso("2026-07-31 05:30:00"), "2026-07-31T05:30:00.000Z");
});
''', encoding="utf-8")

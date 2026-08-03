import { describe, expect, it } from "vitest";

import {
  DAILY_RECORD_COMMAND_DEFINITIONS,
  resolveDailyRecordCommandDate,
} from "@/lib/dailyRecordCommandDefinitions";

describe("daily record command definitions", () => {
  it("keeps one stable command contract for every editor", () => {
    expect(DAILY_RECORD_COMMAND_DEFINITIONS.map((item) => item.id)).toEqual([
      "daily-now",
      "daily-today",
      "daily-tomorrow",
      "daily-day-after-tomorrow",
      "daily-pick-date",
    ]);
    expect(new Set(DAILY_RECORD_COMMAND_DEFINITIONS.map((item) => item.category)))
      .toEqual(new Set(["日期与日记"]));
  });

  it("resolves relative journal dates in local calendar time across month and year boundaries", () => {
    const now = new Date(2026, 11, 31, 23, 50, 0);
    const relative = DAILY_RECORD_COMMAND_DEFINITIONS.filter(
      (item) => item.kind === "relative-journal",
    );

    expect(relative.map((item) => resolveDailyRecordCommandDate(item, now))).toEqual([
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
    ]);
  });

  it("preserves leap-day calendar semantics", () => {
    const tomorrow = DAILY_RECORD_COMMAND_DEFINITIONS.find((item) => item.id === "daily-tomorrow")!;
    expect(resolveDailyRecordCommandDate(tomorrow, new Date(2028, 1, 28, 22, 0, 0)))
      .toBe("2028-02-29");
  });

  it("does not resolve a date for timestamp or picker commands", () => {
    const timestamp = DAILY_RECORD_COMMAND_DEFINITIONS.find((item) => item.id === "daily-now")!;
    const picker = DAILY_RECORD_COMMAND_DEFINITIONS.find((item) => item.id === "daily-pick-date")!;
    expect(resolveDailyRecordCommandDate(timestamp)).toBeNull();
    expect(resolveDailyRecordCommandDate(picker)).toBeNull();
  });
});

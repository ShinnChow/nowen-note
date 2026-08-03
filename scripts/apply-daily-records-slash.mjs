import { readFileSync, writeFileSync } from "node:fs";

const slashPath = "frontend/src/components/SlashCommands.tsx";
let slashSource = readFileSync(slashPath, "utf8");

const importNeedle = 'import { prompt as promptDialog } from "@/components/ui/confirm";\n';
const importLine = 'import { getDailyRecordSlashCommands } from "@/components/daily-records/dailyRecordSlashCommands";\n';
if (!slashSource.includes(importLine)) {
  if (!slashSource.includes(importNeedle)) throw new Error("Slash command import anchor not found");
  slashSource = slashSource.replace(importNeedle, `${importNeedle}${importLine}`);
}

const listNeedle = '): SlashCommandItem[] {\n  return [\n';
const listReplacement = '): SlashCommandItem[] {\n  return [\n    ...getDailyRecordSlashCommands(),\n';
if (!slashSource.includes("...getDailyRecordSlashCommands(),")) {
  if (!slashSource.includes(listNeedle)) throw new Error("Slash command list anchor not found");
  slashSource = slashSource.replace(listNeedle, listReplacement);
}
writeFileSync(slashPath, slashSource);

const navPath = "frontend/src/components/NavRail.tsx";
let navSource = readFileSync(navPath, "utf8");
const labelNeedle = '    const label = t(item.labelKey);\n';
const labelReplacement = '    const label = item.mode === "diary"\n      ? t("sidebar.dailyRecords", { defaultValue: "每日记录" })\n      : t(item.labelKey);\n';
if (!navSource.includes('t("sidebar.dailyRecords"')) {
  if (!navSource.includes(labelNeedle)) throw new Error("Nav rail label anchor not found");
  navSource = navSource.replace(labelNeedle, labelReplacement);
}
writeFileSync(navPath, navSource);

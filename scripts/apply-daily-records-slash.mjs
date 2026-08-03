import { readFileSync, writeFileSync } from "node:fs";

const path = "frontend/src/components/SlashCommands.tsx";
let source = readFileSync(path, "utf8");

const importNeedle = 'import { prompt as promptDialog } from "@/components/ui/confirm";\n';
const importLine = 'import { getDailyRecordSlashCommands } from "@/components/daily-records/dailyRecordSlashCommands";\n';
if (!source.includes(importLine)) {
  if (!source.includes(importNeedle)) throw new Error("Slash command import anchor not found");
  source = source.replace(importNeedle, `${importNeedle}${importLine}`);
}

const listNeedle = '): SlashCommandItem[] {\n  return [\n';
const listReplacement = '): SlashCommandItem[] {\n  return [\n    ...getDailyRecordSlashCommands(),\n';
if (!source.includes("...getDailyRecordSlashCommands(),")) {
  if (!source.includes(listNeedle)) throw new Error("Slash command list anchor not found");
  source = source.replace(listNeedle, listReplacement);
}

writeFileSync(path, source);

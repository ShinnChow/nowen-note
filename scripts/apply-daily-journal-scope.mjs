import { readFileSync, writeFileSync } from "node:fs";

const path = "frontend/src/components/daily-records/DailyJournalView.tsx";
let source = readFileSync(path, "utf8");

source = source.replace(
  'import { api } from "@/lib/api";',
  'import { api, getCurrentWorkspace, setCurrentWorkspace } from "@/lib/api";',
);
source = source.replace(
  '  shiftLocalDateKey,\n} from "@/lib/dailyRecords";',
  '  shiftLocalDateKey,\n  shiftLocalMonthKey,\n} from "@/lib/dailyRecords";',
);
source = source.replace(
  'knowledgeTreeApi.list().catch(() => ({ nodes: [] as KnowledgeTreeNode[] }))',
  'knowledgeTreeApi.list({ workspaceId: null }).catch(() => ({ nodes: [] as KnowledgeTreeNode[] }))',
);
source = source.replace(
  '  const openNote = useCallback((note: Note) => {\n    actions.setActiveNote(note);',
  '  const openNote = useCallback((note: Note) => {\n    const targetWorkspace = note.workspaceId || "personal";\n    if (getCurrentWorkspace() !== targetWorkspace) {\n      setCurrentWorkspace(targetWorkspace);\n      window.dispatchEvent(new CustomEvent("nowen:workspace-changed", {\n        detail: { workspaceId: targetWorkspace },\n      }));\n    }\n    actions.setActiveNote(note);',
);
source = source.replace(
  'onDateChange(shiftLocalDateKey(selectedDate, -28))',
  'onDateChange(shiftLocalMonthKey(selectedDate, -1))',
);
source = source.replace(
  'onDateChange(shiftLocalDateKey(selectedDate, 28))',
  'onDateChange(shiftLocalMonthKey(selectedDate, 1))',
);

if (!source.includes('knowledgeTreeApi.list({ workspaceId: null })')) {
  throw new Error("Personal journal tree scope patch did not apply");
}
if (!source.includes('shiftLocalMonthKey(selectedDate, -1)')) {
  throw new Error("Calendar month navigation patch did not apply");
}
if (!source.includes('setCurrentWorkspace(targetWorkspace)')) {
  throw new Error("Workspace switching patch did not apply");
}

writeFileSync(path, source);

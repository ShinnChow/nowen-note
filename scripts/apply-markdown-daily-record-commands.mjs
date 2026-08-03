import { readFileSync, writeFileSync } from "node:fs";

const path = "frontend/src/components/MarkdownEditorImpl.tsx";
let source = readFileSync(path, "utf8");

const importAnchor = 'import { buildWikiNoteLink, detectActiveWikiNoteQuery } from "@/lib/noteLinkSyntax";\n';
const commandImport = 'import { getMarkdownDailyRecordSlashCommands } from "@/components/daily-records/markdownDailyRecordSlashCommands";\n';
if (!source.includes(commandImport.trim())) {
  if (!source.includes(importAnchor)) throw new Error("Markdown daily command import anchor not found");
  source = source.replace(importAnchor, `${importAnchor}${commandImport}`);
}

const oldBlock = `  // slash 菜单项：图片、已有附件和 AI 共用编辑器级动作。
  const slashItems: MdSlashItem[] = useMemo(
    () =>
      getDefaultMdSlashItems(tr as unknown as (key: string) => string, {
        onImageUpload: () => {
          triggerImagePicker();
        },
        onAttachmentLibrary: openAttachmentLibrary,
        onAIAssistant: isGuest ? undefined : openAIAssistant,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tr, isGuest, openAIAssistant, openAttachmentLibrary],
  );`;

const newBlock = `  // slash 菜单项：基础 Markdown、附件、AI 与日期日记命令共享同一个 CodeMirror 菜单。
  const slashItems: MdSlashItem[] = useMemo(
    () => [
      ...getDefaultMdSlashItems(tr as unknown as (key: string) => string, {
        onImageUpload: () => {
          triggerImagePicker();
        },
        onAttachmentLibrary: openAttachmentLibrary,
        onAIAssistant: isGuest ? undefined : openAIAssistant,
      }),
      ...getMarkdownDailyRecordSlashCommands(),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tr, isGuest, openAIAssistant, openAttachmentLibrary],
  );`;

if (!source.includes("...getMarkdownDailyRecordSlashCommands()")) {
  if (!source.includes(oldBlock)) throw new Error("Markdown slash items anchor not found");
  source = source.replace(oldBlock, newBlock);
}

for (const required of [
  commandImport.trim(),
  "...getMarkdownDailyRecordSlashCommands()",
  "日期日记命令共享同一个 CodeMirror 菜单",
]) {
  if (!source.includes(required)) throw new Error(`Markdown daily command patch missing: ${required}`);
}

writeFileSync(path, source);

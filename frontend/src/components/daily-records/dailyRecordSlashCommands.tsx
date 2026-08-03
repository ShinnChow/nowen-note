import React from "react";
import { CalendarDays, Clock3 } from "lucide-react";
import type { Editor } from "@tiptap/react";

import type { SlashCommandItem } from "@/components/SlashCommands";
import { prompt as promptDialog } from "@/components/ui/confirm";
import { api, getCurrentWorkspace } from "@/lib/api";
import {
  DAILY_RECORD_COMMAND_DEFINITIONS,
  resolveDailyRecordCommandDate,
  type DailyRecordCommandDefinition,
} from "@/lib/dailyRecordCommandDefinitions";
import {
  formatCurrentTimestamp,
  parseLocalDateKey,
  relativeLocalDateKey,
} from "@/lib/dailyRecords";
import { toast } from "@/lib/toast";

function journalLinkContent(noteId: string, dateKey: string) {
  return [
    {
      type: "text",
      text: dateKey,
      marks: [{
        type: "link",
        attrs: {
          href: `note:${noteId}`,
          target: "_blank",
          rel: "noopener noreferrer nofollow nowen-title-auto",
        },
      }],
    },
    { type: "text", text: " " },
  ];
}

async function insertJournalDateLink(editor: Editor, dateKey: string): Promise<void> {
  const insertAt = editor.state.selection.from;
  const workspace = getCurrentWorkspace();
  if (workspace && workspace !== "personal") {
    toast.info("日期日记保存在个人空间，当前工作区成员可能无法访问");
  }

  try {
    const journal = await api.journals.getOrCreateToday(dateKey);
    if (editor.isDestroyed) return;
    const safePosition = Math.max(0, Math.min(insertAt, editor.state.doc.content.size));
    editor
      .chain()
      .focus()
      .insertContentAt(safePosition, journalLinkContent(journal.id, dateKey))
      .run();
    toast.success(journal.existed ? `已链接 ${dateKey} 日记` : `已创建并链接 ${dateKey} 日记`);
  } catch (error: any) {
    toast.error(error?.message || "创建日期日记失败");
  }
}

async function chooseJournalDate(editor: Editor): Promise<void> {
  const value = await promptDialog({
    title: "选择日记日期",
    description: "选择日期后，会创建或复用对应日记，并在当前光标位置插入内部链接。",
    type: "date",
    defaultValue: relativeLocalDateKey(0),
    confirmText: "插入链接",
    cancelText: "取消",
    allowEmpty: false,
    validate: (candidate) => {
      try {
        parseLocalDateKey(candidate.trim());
        return null;
      } catch {
        return "请选择有效日期";
      }
    },
  });
  if (!value) return;
  await insertJournalDateLink(editor, value.trim());
}

function iconFor(definition: DailyRecordCommandDefinition): React.ReactNode {
  return definition.kind === "timestamp"
    ? <Clock3 size={16} />
    : <CalendarDays size={16} />;
}

export function getDailyRecordSlashCommands(): SlashCommandItem[] {
  return DAILY_RECORD_COMMAND_DEFINITIONS.map((definition) => ({
    id: definition.id,
    label: definition.label,
    description: definition.description,
    icon: iconFor(definition),
    category: definition.category,
    keywords: definition.keywords,
    action: (editor) => {
      if (definition.kind === "timestamp") {
        editor.chain().focus().insertContent(`${formatCurrentTimestamp()} `).run();
        return;
      }
      if (definition.kind === "pick-journal-date") {
        void chooseJournalDate(editor);
        return;
      }
      const dateKey = resolveDailyRecordCommandDate(definition);
      if (dateKey) void insertJournalDateLink(editor, dateKey);
    },
  }));
}

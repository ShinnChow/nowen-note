import React from "react";
import { CalendarDays, Clock3 } from "lucide-react";
import type { Editor } from "@tiptap/react";

import type { SlashCommandItem } from "@/components/SlashCommands";
import { prompt as promptDialog } from "@/components/ui/confirm";
import { api, getCurrentWorkspace } from "@/lib/api";
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
    placeholder: "YYYY-MM-DD",
    defaultValue: relativeLocalDateKey(0),
    confirmText: "插入链接",
    cancelText: "取消",
    allowEmpty: false,
  });
  if (!value) return;

  const dateKey = value.trim();
  try {
    parseLocalDateKey(dateKey);
  } catch {
    toast.error("请输入有效日期，例如 2026-08-20");
    return;
  }
  await insertJournalDateLink(editor, dateKey);
}

export function getDailyRecordSlashCommands(): SlashCommandItem[] {
  const category = "日期与日记";
  return [
    {
      id: "daily-now",
      label: "现在",
      description: "插入当前本地日期和时间",
      icon: <Clock3 size={16} />,
      category,
      keywords: ["now", "time", "date", "现在", "时间", "日期"],
      action: (editor) => {
        editor.chain().focus().insertContent(`${formatCurrentTimestamp()} `).run();
      },
    },
    {
      id: "daily-today",
      label: "今天",
      description: "创建或复用今日日记并插入链接",
      icon: <CalendarDays size={16} />,
      category,
      keywords: ["today", "journal", "今天", "今日", "日记"],
      action: (editor) => { void insertJournalDateLink(editor, relativeLocalDateKey(0)); },
    },
    {
      id: "daily-tomorrow",
      label: "明天",
      description: "创建或复用明日日记并插入链接",
      icon: <CalendarDays size={16} />,
      category,
      keywords: ["tomorrow", "journal", "明天", "明日", "日记"],
      action: (editor) => { void insertJournalDateLink(editor, relativeLocalDateKey(1)); },
    },
    {
      id: "daily-day-after-tomorrow",
      label: "后天",
      description: "创建或复用后天日记并插入链接",
      icon: <CalendarDays size={16} />,
      category,
      keywords: ["day after tomorrow", "journal", "后天", "日记"],
      action: (editor) => { void insertJournalDateLink(editor, relativeLocalDateKey(2)); },
    },
    {
      id: "daily-pick-date",
      label: "选择日期",
      description: "选择日期并插入对应日记链接",
      icon: <CalendarDays size={16} />,
      category,
      keywords: ["date", "calendar", "journal", "选择日期", "自定义日期", "日记"],
      action: (editor) => { void chooseJournalDate(editor); },
    },
  ];
}

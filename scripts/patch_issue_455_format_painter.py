from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "frontend/src/components/TiptapEditor.tsx"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


source = PATH.read_text(encoding="utf-8")

source = replace_once(
    source,
    "  Type, Palette, Eraser, ChevronDown, Search, Upload,",
    "  Type, Palette, Eraser, Paintbrush, ChevronDown, Search, Upload,",
    "Paintbrush import",
)

source = replace_once(
    source,
    'import { getActiveListType, type ActiveListType } from "@/lib/activeListType";',
    'import { getActiveListType, type ActiveListType } from "@/lib/activeListType";\nimport {\n  applyCapturedTextFormat,\n  captureTextFormat,\n  type CapturedTextFormat,\n} from "@/lib/formatPainter";',
    "format painter import",
)

state_anchor = "  const activeListTypeRef = useRef<ActiveListType>(null);"
state_block = '''  const activeListTypeRef = useRef<ActiveListType>(null);
  const [formatPainterArmed, setFormatPainterArmed] = useState(false);
  const formatPainterRef = useRef<CapturedTextFormat | null>(null);
  const formatPainterSourceRef = useRef<{ from: number; to: number; noteId: string } | null>(null);
  const formatPainterApplyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formatPainterPointerSelectingRef = useRef(false);
  const applyingFormatPainterRef = useRef(false);'''
source = replace_once(source, state_anchor, state_block, "format painter state")

root_marker = '      data-mobile-editing-compact={compactMobileEditing ? "true" : "false"}'
root_index = source.find(root_marker)
if root_index < 0:
    raise RuntimeError("root marker not found")
return_index = source.rfind("  return (", 0, root_index)
if return_index < 0:
    raise RuntimeError("component return marker not found")

interaction_block = r'''  const cancelFormatPainter = useCallback((announce = false) => {
    if (formatPainterApplyTimerRef.current) {
      clearTimeout(formatPainterApplyTimerRef.current);
      formatPainterApplyTimerRef.current = null;
    }
    formatPainterRef.current = null;
    formatPainterSourceRef.current = null;
    formatPainterPointerSelectingRef.current = false;
    applyingFormatPainterRef.current = false;
    setFormatPainterArmed(false);
    if (announce) {
      toast.info(t("tiptap.formatPainterCancelled", { defaultValue: "已取消格式刷" }));
    }
  }, [t]);

  const toggleFormatPainter = useCallback(() => {
    if (!editor || !editable || isGuest) {
      toast.info(t("tiptap.formatPainterReadonly", { defaultValue: "当前文档不可使用格式刷" }));
      return;
    }
    if (formatPainterRef.current) {
      cancelFormatPainter(true);
      return;
    }

    const captured = captureTextFormat(editor);
    if (!captured.ok || !captured.format) {
      const message = captured.reason === "empty-selection"
        ? t("tiptap.formatPainterSelectSource", { defaultValue: "请先选择一段源文本" })
        : captured.reason === "unsupported-selection"
          ? t("tiptap.formatPainterUnsupportedSource", { defaultValue: "请选择普通文本作为格式来源" })
          : t("tiptap.formatPainterNoText", { defaultValue: "所选内容没有可复制的文本格式" });
      toast.info(message);
      return;
    }

    formatPainterRef.current = captured.format;
    formatPainterSourceRef.current = {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
      noteId: note.id,
    };
    setFormatPainterArmed(true);
    setBubble((current) => ({ ...current, open: false }));
    setImageBubble((current) => ({ ...current, open: false }));
    setTableBubble((current) => ({ ...current, open: false }));
    toast.info(t("tiptap.formatPainterChooseTarget", { defaultValue: "格式已复制，请选择目标文本" }));
  }, [cancelFormatPainter, editable, editor, isGuest, note.id, t]);

  useEffect(() => {
    if (!editor) return;

    const attemptApply = () => {
      const format = formatPainterRef.current;
      const sourceSelection = formatPainterSourceRef.current;
      if (!format || !sourceSelection || applyingFormatPainterRef.current) return;
      if (sourceSelection.noteId !== noteRef.current.id) {
        cancelFormatPainter();
        return;
      }

      const { selection } = editor.state;
      if (selection.empty) return;
      if (selection.from === sourceSelection.from && selection.to === sourceSelection.to) return;

      applyingFormatPainterRef.current = true;
      const result = applyCapturedTextFormat(editor, format);
      applyingFormatPainterRef.current = false;

      if (!result.ok) {
        if (result.reason === "empty-selection") return;
        cancelFormatPainter();
        toast.info(t("tiptap.formatPainterUnsupportedTarget", {
          defaultValue: "该目标包含不支持的复杂节点，格式刷已取消",
        }));
        return;
      }

      cancelFormatPainter();
      setBubble((current) => ({ ...current, open: false }));
      toast.success(result.degraded
        ? t("tiptap.formatPainterAppliedInlineOnly", { defaultValue: "格式已应用；跨段内容保留原有段落类型" })
        : t("tiptap.formatPainterApplied", { defaultValue: "格式已应用" }));
    };

    const scheduleApply = (delay = 140) => {
      if (!formatPainterRef.current) return;
      if (formatPainterApplyTimerRef.current) clearTimeout(formatPainterApplyTimerRef.current);
      formatPainterApplyTimerRef.current = setTimeout(() => {
        formatPainterApplyTimerRef.current = null;
        attemptApply();
      }, delay);
    };

    const handleSelectionUpdate = () => {
      if (!formatPainterRef.current || formatPainterPointerSelectingRef.current) return;
      scheduleApply();
    };
    const handleTransaction = ({ transaction }: any) => {
      if (!formatPainterRef.current || applyingFormatPainterRef.current) return;
      if (transaction.docChanged && !transaction.getMeta("formatPainter")) {
        cancelFormatPainter();
      }
    };
    const handleBlur = () => {
      window.setTimeout(() => {
        if (formatPainterRef.current && !editor.isFocused) cancelFormatPainter();
      }, 0);
    };
    const handlePointerDown = () => {
      if (!formatPainterRef.current) return;
      formatPainterPointerSelectingRef.current = true;
      if (formatPainterApplyTimerRef.current) {
        clearTimeout(formatPainterApplyTimerRef.current);
        formatPainterApplyTimerRef.current = null;
      }
    };
    const handlePointerUp = () => {
      if (!formatPainterPointerSelectingRef.current) return;
      formatPainterPointerSelectingRef.current = false;
      scheduleApply(0);
    };

    editor.on("selectionUpdate", handleSelectionUpdate);
    editor.on("transaction", handleTransaction);
    editor.on("blur", handleBlur);
    editor.view.dom.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", handlePointerUp, { passive: true });

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
      editor.off("transaction", handleTransaction);
      editor.off("blur", handleBlur);
      editor.view.dom.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      if (formatPainterApplyTimerRef.current) clearTimeout(formatPainterApplyTimerRef.current);
    };
  }, [cancelFormatPainter, editor, t]);

  useEffect(() => {
    cancelFormatPainter();
  }, [cancelFormatPainter, editable, isGuest, note.id]);

  useEffect(() => {
    if (!formatPainterArmed) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelFormatPainter(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [cancelFormatPainter, formatPainterArmed]);

'''
source = source[:return_index] + interaction_block + source[return_index:]

source = replace_once(
    source,
    '      data-mobile-editing-compact={compactMobileEditing ? "true" : "false"}\n      className={cn("flex flex-col relative", scrollLayout.root, presentationMode && "tiptap-presentation-mode")}',
    '      data-mobile-editing-compact={compactMobileEditing ? "true" : "false"}\n      data-format-painter-active={formatPainterArmed ? "true" : "false"}\n      className={cn(\n        "flex flex-col relative",\n        scrollLayout.root,\n        presentationMode && "tiptap-presentation-mode",\n        formatPainterArmed && "[&_.ProseMirror]:cursor-crosshair",\n      )}',
    "root active state",
)

color_anchor = '        <ColorPopover editor={editor} iconSize={iconSize} />'
format_button = '''        <ColorPopover editor={editor} iconSize={iconSize} />
        <ToolbarButton
          onClick={toggleFormatPainter}
          isActive={formatPainterArmed}
          disabled={!editable || isGuest}
          title={formatPainterArmed
            ? t("tiptap.formatPainterCancel", { defaultValue: "取消格式刷 (Esc)" })
            : t("tiptap.formatPainter", { defaultValue: "格式刷" })}
        >
          <Paintbrush size={iconSize} />
        </ToolbarButton>'''
source = replace_once(source, color_anchor, format_button, "full toolbar format painter")

bubble_anchor = '''          <ToolbarButton
            onClick={() => void selectAllText()}
            title={t('tiptap.selectAllText')}
          >
            <ArrowUp size={14} />
          </ToolbarButton>'''
bubble_button = bubble_anchor + '''
          <ToolbarButton
            onClick={toggleFormatPainter}
            isActive={formatPainterArmed}
            disabled={!editable || isGuest}
            title={formatPainterArmed
              ? t("tiptap.formatPainterCancel", { defaultValue: "取消格式刷 (Esc)" })
              : t("tiptap.formatPainter", { defaultValue: "格式刷" })}
          >
            <Paintbrush size={14} />
          </ToolbarButton>'''
source = replace_once(source, bubble_anchor, bubble_button, "selection bubble format painter")

PATH.write_text(source, encoding="utf-8")
print("Issue #455 format painter UI integration applied")

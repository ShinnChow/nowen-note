from pathlib import Path

path = Path(__file__).resolve().parents[1] / "frontend/src/components/TiptapEditor.tsx"
source = path.read_text(encoding="utf-8")

malformed_start = '''      getSnapshot: () => {
        const cancelFormatPainter = useCallback((announce = false) => {'''
block_start_token = "  const cancelFormatPainter = useCallback((announce = false) => {"
block_end_token = '''  }, [cancelFormatPainter, formatPainterArmed]);

  if (!editor) return null;
        return {'''

start = source.find(malformed_start)
if start < 0:
    raise RuntimeError("malformed getSnapshot/format painter start not found")
block_start = source.find(block_start_token, start)
block_end = source.find(block_end_token, block_start)
if block_start < 0 or block_end < 0:
    raise RuntimeError(f"format painter block boundaries missing: {block_start=}, {block_end=}")
block_end += len('  }, [cancelFormatPainter, formatPainterArmed]);\n')
block = source[block_start:block_end]

# Restore the original imperative getSnapshot body and remove the misplaced hooks.
malformed_end = source.find("        return {", block_end)
if malformed_end < 0:
    raise RuntimeError("getSnapshot return body not found")
source = (
    source[:start]
    + '''      getSnapshot: () => {
        if (!editor) return null;
'''
    + source[malformed_end:]
)

# Narrow the discriminated union before reading `reason`.
old_capture = '''    const captured = captureTextFormat(editor);
    if (!captured.ok || !captured.format) {
      const message = captured.reason === "empty-selection"
        ? t("tiptap.formatPainterSelectSource", { defaultValue: "请先选择一段源文本" })
        : captured.reason === "unsupported-selection"
          ? t("tiptap.formatPainterUnsupportedSource", { defaultValue: "请选择普通文本作为格式来源" })
          : t("tiptap.formatPainterNoText", { defaultValue: "所选内容没有可复制的文本格式" });
      toast.info(message);
      return;
    }

    formatPainterRef.current = captured.format;'''
new_capture = '''    const captured = captureTextFormat(editor);
    if (!captured.ok) {
      const message = captured.reason === "empty-selection"
        ? t("tiptap.formatPainterSelectSource", { defaultValue: "请先选择一段源文本" })
        : captured.reason === "unsupported-selection"
          ? t("tiptap.formatPainterUnsupportedSource", { defaultValue: "请选择普通文本作为格式来源" })
          : t("tiptap.formatPainterNoText", { defaultValue: "所选内容没有可复制的文本格式" });
      toast.info(message);
      return;
    }
    if (!captured.format) {
      toast.info(t("tiptap.formatPainterNoText", { defaultValue: "所选内容没有可复制的文本格式" }));
      return;
    }

    formatPainterRef.current = captured.format;'''
if block.count(old_capture) != 1:
    raise RuntimeError(f"capture narrowing block count={block.count(old_capture)}")
block = block.replace(old_capture, new_capture, 1)

# Hooks must be called unconditionally, before useImperativeHandle and any render return.
insert_anchor = "  useImperativeHandle(\n"
insert_at = source.find(insert_anchor)
if insert_at < 0:
    raise RuntimeError("useImperativeHandle anchor not found")
source = source[:insert_at] + block + "\n\n" + source[insert_at:]

# Structural guards against repeating the previous regression.
if source.count(block_start_token) != 1:
    raise RuntimeError("format painter hook block is not unique")
if source.find(block_start_token) > source.find(insert_anchor):
    raise RuntimeError("format painter hooks still appear after useImperativeHandle")
if "getSnapshot: () => {\n        const cancelFormatPainter" in source:
    raise RuntimeError("format painter hooks remain inside getSnapshot")

path.write_text(source, encoding="utf-8")
print("Issue #455 hook scope and result narrowing corrected")

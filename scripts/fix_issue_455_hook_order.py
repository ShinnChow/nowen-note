from pathlib import Path

path = Path(__file__).resolve().parents[1] / "frontend/src/components/TiptapEditor.tsx"
source = path.read_text(encoding="utf-8")

start_marker = "  const cancelFormatPainter = useCallback((announce = false) => {"
return_marker = '''  return (
    <div
      data-mobile-editing-compact={compactMobileEditing ? "true" : "false"}'''
early_return = "  if (!editor) return null;"

start = source.find(start_marker)
end = source.find(return_marker, start)
anchor = source.find(early_return)
if start < 0 or end < 0 or anchor < 0:
    raise RuntimeError(f"markers missing: start={start}, end={end}, anchor={anchor}")
if not (anchor < start < end):
    raise RuntimeError("unexpected format painter hook placement")

block = source[start:end]
source = source[:start] + source[end:]
anchor = source.find(early_return)
source = source[:anchor] + block + source[anchor:]
path.write_text(source, encoding="utf-8")
print("Issue #455 hooks moved before editor early return")

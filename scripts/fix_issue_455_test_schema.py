from pathlib import Path

path = Path(__file__).resolve().parents[1] / "frontend/src/lib/__tests__/formatPainter.test.ts"
source = path.read_text(encoding="utf-8")

replacements = {
    'import Underline from "@tiptap/extension-underline";\n': '',
    '      Underline,\n': '',
    '{ type: "textStyle", attrs: { fontSize: "20px", color: "#ef4444", fontFamily: "serif" } }': '{ type: "textStyle", attrs: { fontSize: "20px", color: "#ef4444" } }',
    '{ type: "textStyle", attrs: { fontSize: "12px", color: "#3b82f6", fontFamily: "monospace" } }': '{ type: "textStyle", attrs: { fontSize: "12px", color: "#3b82f6" } }',
    '      color: "#ef4444",\n      fontFamily: "monospace",\n': '      color: "#ef4444",\n',
}
for old, new in replacements.items():
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"expected one match, found {count}: {old!r}")
    source = source.replace(old, new, 1)

path.write_text(source, encoding="utf-8")
print("Issue #455 tests aligned with the production textStyle schema")

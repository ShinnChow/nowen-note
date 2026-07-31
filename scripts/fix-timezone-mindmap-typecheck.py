from pathlib import Path

path = Path("frontend/src/components/MindMapEditor.tsx")
text = path.read_text(encoding="utf-8")
marker = '          xmlns="http://www.w3.org/1999/xhtml"\n'
if text.count(marker) != 1:
    raise SystemExit(f"expected one generated xmlns marker, found {text.count(marker)}")
path.write_text(text.replace(marker, "", 1), encoding="utf-8")

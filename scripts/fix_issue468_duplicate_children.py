from pathlib import Path

path = Path("frontend/src/components/KnowledgeTreePanel.tsx")
text = path.read_text(encoding="utf-8")
old = '''  const allChildren = useMemo(() => buildChildren(nodes), [nodes]);
  const allChildren = useMemo(() => buildChildren(nodes), [nodes]);
'''
new = '''  const allChildren = useMemo(() => buildChildren(nodes), [nodes]);
'''
if text.count(old) != 1:
    raise SystemExit(f"duplicate allChildren count changed: {text.count(old)}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")

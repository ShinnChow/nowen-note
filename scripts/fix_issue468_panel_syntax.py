from pathlib import Path

path = Path("frontend/src/components/KnowledgeTreePanel.tsx")
text = path.read_text(encoding="utf-8")
old = '''        </div>
        {isExpanded && childNodes.map((child) => renderNode(child, depth + 1))}
        </div>
        {isExpanded && childNodes.map((child) => renderNode(child, depth + 1))}
      </div>
'''
new = '''        </div>
        {isExpanded && childNodes.map((child) => renderNode(child, depth + 1))}
      </div>
'''
if text.count(old) != 1:
    raise SystemExit(f"duplicate render block count changed: {text.count(old)}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
print("removed duplicated knowledge-tree JSX block")

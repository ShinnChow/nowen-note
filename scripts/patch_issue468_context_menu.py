from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, got {count}")
    return text.replace(old, new, 1)


def remove_between(text: str, start: str, end: str, replacement: str, label: str) -> str:
    start_index = text.find(start)
    if start_index < 0:
        raise SystemExit(f"{label}: start anchor missing")
    end_index = text.find(end, start_index)
    if end_index < 0:
        raise SystemExit(f"{label}: end anchor missing")
    return text[:start_index] + replacement + text[end_index:]


# Backend and frontend listing metadata used to render icon and note-state labels without N+1 reads.
core_path = Path("backend/src/services/knowledgeTreeCore.ts")
core = core_path.read_text(encoding="utf-8")
core = replace_once(
    core,
    '''  title: string;
  sortOrder: number;
''',
    '''  title: string;
  icon?: string | null;
  isPinned?: number;
  isFavorite?: number;
  isLocked?: number;
  contentFormat?: string | null;
  sortOrder: number;
''',
    "backend node metadata type",
)
core_path.write_text(core, encoding="utf-8")

listing_path = Path("backend/src/services/knowledgeTreeListing.ts")
listing = listing_path.read_text(encoding="utf-8")
listing = replace_once(
    listing,
    '''           ${TITLE_EXPRESSION} AS title,
           (SELECT COUNT(*) FROM knowledge_tree_nodes child
''',
    '''           ${TITLE_EXPRESSION} AS title,
           CASE WHEN node.resourceType = 'notebook' THEN nb.icon ELSE NULL END AS icon,
           CASE WHEN node.resourceType = 'note' THEN COALESCE(note.isPinned, 0) ELSE 0 END AS isPinned,
           CASE WHEN node.resourceType = 'note' THEN COALESCE(note.isFavorite, 0) ELSE 0 END AS isFavorite,
           CASE WHEN node.resourceType = 'note' THEN COALESCE(note.isLocked, 0) ELSE 0 END AS isLocked,
           CASE WHEN node.resourceType = 'note' THEN note.contentFormat ELSE NULL END AS contentFormat,
           (SELECT COUNT(*) FROM knowledge_tree_nodes child
''',
    "owned listing metadata",
)
listing_path.write_text(listing, encoding="utf-8")

shared_path = Path("backend/src/services/sharedKnowledgeTreeListing.ts")
shared = shared_path.read_text(encoding="utf-8")
shared = replace_once(
    shared,
    '''      ${TITLE_EXPRESSION} AS title,
      shared_tree.sharedRootId, shared_tree.sharedDepth,
''',
    '''      ${TITLE_EXPRESSION} AS title,
      CASE WHEN node.resourceType = 'notebook' THEN nb.icon ELSE NULL END AS icon,
      CASE WHEN node.resourceType = 'note' THEN COALESCE(note.isPinned, 0) ELSE 0 END AS isPinned,
      CASE WHEN node.resourceType = 'note' THEN COALESCE(note.isFavorite, 0) ELSE 0 END AS isFavorite,
      CASE WHEN node.resourceType = 'note' THEN COALESCE(note.isLocked, 0) ELSE 0 END AS isLocked,
      CASE WHEN node.resourceType = 'note' THEN note.contentFormat ELSE NULL END AS contentFormat,
      shared_tree.sharedRootId, shared_tree.sharedDepth,
''',
    "shared listing metadata",
)
shared_path.write_text(shared, encoding="utf-8")

api_path = Path("frontend/src/lib/knowledgeTreeApi.ts")
api = api_path.read_text(encoding="utf-8")
api = replace_once(
    api,
    '''  title: string;
  sortOrder: number;
''',
    '''  title: string;
  icon?: string | null;
  isPinned?: number;
  isFavorite?: number;
  isLocked?: number;
  contentFormat?: string | null;
  sortOrder: number;
''',
    "frontend node metadata type",
)
api_path.write_text(api, encoding="utf-8")

panel_path = Path("frontend/src/components/KnowledgeTreePanel.tsx")
panel = panel_path.read_text(encoding="utf-8")
panel = replace_once(
    panel,
    'import { choose, confirm, prompt } from "@/components/ui/confirm";\n',
    'import KnowledgeTreeNodeMenu from "@/components/KnowledgeTreeNodeMenu";\nimport { choose, confirm, prompt } from "@/components/ui/confirm";\nimport { useContextMenu } from "@/hooks/useContextMenu";\n',
    "panel menu imports",
)
panel = replace_once(
    panel,
    '''function nodeIcon(node: KnowledgeTreeNode) {
  if (node.nodeType === "folder") return <Folder size={15} className="text-amber-500" />;
  if (node.nodeType === "markdown") return <FileCode size={15} className="text-emerald-500" />;
  return <FileText size={15} className="text-accent-primary" />;
}
''',
    '''function nodeIcon(node: KnowledgeTreeNode) {
  if (node.nodeType === "folder") {
    return node.icon
      ? <span className="w-[15px] shrink-0 text-center text-sm leading-none">{node.icon}</span>
      : <Folder size={15} className="text-amber-500" />;
  }
  if (node.nodeType === "markdown") return <FileCode size={15} className="text-emerald-500" />;
  return <FileText size={15} className="text-accent-primary" />;
}
''',
    "render notebook icon",
)
panel = replace_once(
    panel,
    '''  const searchRef = useRef<HTMLInputElement>(null);
  const menuRootRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<KnowledgeTreeNode[]>([]);
''',
    '''  const searchRef = useRef<HTMLInputElement>(null);
  const [nodes, setNodes] = useState<KnowledgeTreeNode[]>([]);
''',
    "remove old menu root ref",
)
panel = replace_once(
    panel,
    '''  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [menuNodeId, setMenuNodeId] = useState<string | null>(null);
  const [permissionsNode, setPermissionsNode] = useState<KnowledgeTreeNode | null>(null);
  const [movingNode, setMovingNode] = useState<KnowledgeTreeNode | null>(null);
''',
    '''  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [permissionsNode, setPermissionsNode] = useState<KnowledgeTreeNode | null>(null);
  const [movingNode, setMovingNode] = useState<KnowledgeTreeNode | null>(null);
  const { menu, menuRef, openMenu, openMenuAt, closeMenu } = useContextMenu();
  const longPressRef = useRef<{ timer: ReturnType<typeof setTimeout>; x: number; y: number } | null>(null);
  const menuNode = menu.targetId ? nodes.find((candidate) => candidate.id === menu.targetId) || null : null;
''',
    "replace panel menu state",
)
panel = remove_between(
    panel,
    '''  useEffect(() => {
    if (!menuNodeId) return;
''',
    '''  const allChildren = useMemo(() => buildChildren(nodes), [nodes]);
''',
    '''  const allChildren = useMemo(() => buildChildren(nodes), [nodes]);
''',
    "remove old inline menu close effect",
)
panel = replace_once(panel, '    setMenuNodeId(null);\n    if (node.nodeType === "folder") {\n', '    closeMenu();\n    if (node.nodeType === "folder") {\n', "open closes context menu")
panel = replace_once(panel, '    setMenuNodeId(null);\n  };\n\n  const createChild', '    closeMenu();\n  };\n\n  const createChild', "split closes context menu")
panel = replace_once(panel, '    setMenuNodeId(null);\n    const choice = await choose({\n', '    closeMenu();\n    const choice = await choose({\n', "create closes context menu")
panel = replace_once(panel, '    setMenuNodeId(null);\n    const title = await prompt({ title: "重命名"', '    closeMenu();\n    const title = await prompt({ title: "重命名"', "rename closes context menu")
panel = replace_once(panel, '    setMenuNodeId(null);\n    const hasChildren = node.childCount', '    closeMenu();\n    const hasChildren = node.childCount', "delete closes context menu")

render_anchor = '''  const renderNode = (node: KnowledgeTreeNode, depth: number): React.ReactNode => {
'''
long_press_helpers = '''  const cancelLongPress = () => {
    if (!longPressRef.current) return;
    clearTimeout(longPressRef.current.timer);
    longPressRef.current = null;
  };

  const beginLongPress = (event: React.TouchEvent, node: KnowledgeTreeNode) => {
    const touch = event.touches[0];
    if (!touch) return;
    cancelLongPress();
    const x = touch.clientX;
    const y = touch.clientY;
    const timer = setTimeout(() => {
      openMenuAt(x, y, node.id, "knowledge-node");
      longPressRef.current = null;
    }, 600);
    longPressRef.current = { timer, x, y };
  };

  const moveLongPress = (event: React.TouchEvent) => {
    const current = longPressRef.current;
    const touch = event.touches[0];
    if (!current || !touch) return;
    const dx = touch.clientX - current.x;
    const dy = touch.clientY - current.y;
    if (dx * dx + dy * dy > 100) cancelLongPress();
  };

'''
panel = replace_once(panel, render_anchor, long_press_helpers + render_anchor, "insert right-click and long-press helpers")
panel = replace_once(panel, '    const menuOpen = menuNodeId === node.id;\n', '', "remove inline menu flag")
panel = replace_once(
    panel,
    '''          onDrop={(event) => {
            if (!node.access.capabilities.canCreate) return;
            event.preventDefault();
            void dropMove(event.dataTransfer.getData("application/x-nowen-tree-node"), node.id);
          }}
        >
''',
    '''          onDrop={(event) => {
            if (!node.access.capabilities.canCreate) return;
            event.preventDefault();
            void dropMove(event.dataTransfer.getData("application/x-nowen-tree-node"), node.id);
          }}
          onContextMenu={(event) => openMenu(event, node.id, "knowledge-node")}
          onTouchStart={(event) => beginLongPress(event, node)}
          onTouchMove={moveLongPress}
          onTouchEnd={cancelLongPress}
          onTouchCancel={cancelLongPress}
        >
''',
    "wire right click and long press",
)
panel = replace_once(
    panel,
    '''          <button type="button" onClick={() => setMenuNodeId(menuOpen ? null : node.id)} className={cn("h-6 w-6 items-center justify-center rounded text-tx-tertiary hover:bg-app-active", actionVisibility)} title="更多"><MoreHorizontal size={14} /></button>

''',
    '''          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              const rect = event.currentTarget.getBoundingClientRect();
              openMenuAt(rect.right, rect.bottom + 4, node.id, "knowledge-node");
            }}
            className={cn("h-6 w-6 items-center justify-center rounded text-tx-tertiary hover:bg-app-active", actionVisibility)}
            title="更多"
          ><MoreHorizontal size={14} /></button>

''',
    "more button opens shared menu",
)
panel = remove_between(
    panel,
    '''          {menuOpen && (
''',
    '''        </div>
        {isExpanded && childNodes.map((child) => renderNode(child, depth + 1))}
''',
    '''        </div>
        {isExpanded && childNodes.map((child) => renderNode(child, depth + 1))}
''',
    "remove old inline menu",
)
panel = replace_once(
    panel,
    '<section ref={menuRootRef} className={cn("relative flex min-h-0 flex-1 flex-col", className)}',
    '<section className={cn("relative flex min-h-0 flex-1 flex-col", className)}',
    "remove old section menu ref",
)
panel = replace_once(
    panel,
    '''      </div>
    </section>
''',
    '''      </div>
      <KnowledgeTreeNodeMenu
        menu={menu}
        menuRef={menuRef}
        node={menuNode}
        nodes={nodes}
        onClose={closeMenu}
        onOpen={openDocument}
        onSplit={openSplit}
        onRename={rename}
        onMove={setMovingNode}
        onPermissions={setPermissionsNode}
        onDelete={remove}
        onReload={reload}
      />
    </section>
''',
    "mount shared context menu",
)
for forbidden in ["menuNodeId", "menuRootRef", "setMenuNodeId", "menuOpen"]:
    if forbidden in panel:
        raise SystemExit(f"panel still contains old menu token: {forbidden}")
for required in ["onContextMenu", "onTouchStart", "KnowledgeTreeNodeMenu", "openMenuAt"]:
    if required not in panel:
        raise SystemExit(f"panel missing context menu token: {required}")
panel_path.write_text(panel, encoding="utf-8")

contract_path = Path("frontend/src/lib/__tests__/knowledgeTreeSidebarContract.test.ts")
contract = contract_path.read_text(encoding="utf-8")
contract = replace_once(
    contract,
    '''    expect(panel).not.toContain("使用旧树");
''',
    '''    expect(panel).not.toContain("使用旧树");
    expect(panel).toContain("KnowledgeTreeNodeMenu");
    expect(panel).toContain("onContextMenu");
    expect(panel).toContain("onTouchStart");
''',
    "context menu contract assertions",
)
contract_path.write_text(contract, encoding="utf-8")

print("integrated knowledge-tree right-click and long-press menu")

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path: str, old: str, new: str) -> None:
    target = ROOT / path
    source = target.read_text(encoding="utf-8")
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}: {old[:120]!r}")
    target.write_text(source.replace(old, new, 1), encoding="utf-8")


path = "frontend/src/components/MarkdownEditorImpl.tsx"
replace_once(
    path,
    'import { useTranslation } from "react-i18next";',
    'import { useTranslation } from "react-i18next";\nimport { useKeyboardVisible } from "@/hooks/useKeyboardVisible";',
)
replace_once(
    path,
    "  Columns2,\n  Film,",
    "  Columns2,\n  ChevronDown,\n  Film,",
)
replace_once(
    path,
    '''  const { t: tr } = useTranslation();
  const { prefs: userPrefs } = useUserPreferences();''',
    '''  const { t: tr } = useTranslation();
  const { prefs: userPrefs } = useUserPreferences();
  const { visible: keyboardVisible } = useKeyboardVisible();
  const compactMobileEditing = editable
    && keyboardVisible
    && typeof window !== "undefined"
    && window.matchMedia("(max-width: 767px)").matches;
  const [mobileToolbarExpanded, setMobileToolbarExpanded] = useState(false);
  useEffect(() => {
    if (compactMobileEditing) setMobileToolbarExpanded(false);
  }, [compactMobileEditing]);
  useEffect(() => setMobileToolbarExpanded(false), [note.id]);''',
)
replace_once(
    path,
    '<div className="flex flex-col h-full overflow-hidden">',
    '<div\n      data-markdown-mobile-editing-compact={compactMobileEditing ? "true" : "false"}\n      className="relative flex flex-col h-full overflow-hidden"\n    >',
)
old_toolbar = '''      {editable && (
        <div
          className={cn(
            "sticky top-0 z-20 flex items-center gap-0.5 px-4 py-2 border-b border-app-border bg-app-surface/95 backdrop-blur supports-[backdrop-filter]:bg-app-surface/70 md:flex-wrap overflow-x-auto hide-scrollbar touch-pan-x transition-colors",
          )}
        >'''
new_toolbar = '''      {editable && (
        <>
          <div
            data-markdown-mobile-toolbar="compact"
            className="sticky top-0 z-20 flex items-center gap-0.5 overflow-x-auto border-b border-app-border bg-app-surface/95 px-2 py-1.5 backdrop-blur md:hidden"
          >
            <ToolbarButton onClick={() => withView((view) => undo(view))} title={tr("tiptap.undo") || "撤销"}>
              <Undo size={16} />
            </ToolbarButton>
            <ToolbarButton onClick={() => withView((view) => redo(view))} title={tr("tiptap.redo") || "重做"}>
              <Redo size={16} />
            </ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton onClick={() => setMarkdownViewMode("source")} title={tr("markdown.view.source") || "源码"}>
              <FileCode size={16} />
            </ToolbarButton>
            <ToolbarButton onClick={() => setMarkdownViewMode("preview")} title={tr("markdown.view.preview") || "预览"}>
              <Eye size={16} />
            </ToolbarButton>
            <ToolbarButton onClick={() => withView((view) => toggleHeading(view, 1))} title={tr("tiptap.heading1") || "一级标题"}>
              <Heading1 size={16} />
            </ToolbarButton>
            <ToolbarButton onClick={() => withView((view) => toggleWrap(view, "**"))} title={tr("tiptap.bold") || "加粗"}>
              <Bold size={16} />
            </ToolbarButton>
            <ToolbarButton onClick={() => withView((view) => toggleBulletList(view))} title={tr("tiptap.bulletList") || "无序列表"}>
              <List size={16} />
            </ToolbarButton>
            <ToolbarButton onClick={() => setMobileToolbarExpanded((value) => !value)} title={tr("common.more") || "更多"}>
              <ChevronDown size={16} className={cn("transition-transform", mobileToolbarExpanded && "rotate-180")} />
            </ToolbarButton>
          </div>
          <div
            data-markdown-mobile-toolbar="expanded"
            className={cn(
              "z-30 items-center gap-0.5 overflow-x-auto border-b border-app-border bg-app-elevated/98 px-3 py-2 backdrop-blur hide-scrollbar touch-pan-x transition-colors md:sticky md:top-0 md:z-20 md:flex md:flex-wrap md:bg-app-surface/95 md:px-4 md:supports-[backdrop-filter]:bg-app-surface/70",
              mobileToolbarExpanded
                ? "flex max-md:absolute max-md:left-0 max-md:right-0 max-md:top-10 max-md:max-h-[38vh] max-md:flex-wrap max-md:overflow-y-auto max-md:shadow-xl"
                : "hidden md:flex",
            )}
          >'''
replace_once(path, old_toolbar, new_toolbar)
replace_once(
    path,
    '''        </div>
      )}

      {/* ������ */}''',
    '''          </div>
        </>
      )}

      {/* ������ */}''',
)
replace_once(
    path,
    '<div className="px-4 md:px-8 pt-4 md:pt-6 pb-2">',
    '<div\n        data-markdown-mobile-title=""\n        className={cn("px-4 md:px-8 pb-2", compactMobileEditing ? "pt-2" : "pt-3 md:pt-6")}\n      >',
)
replace_once(
    path,
    'className="w-full bg-transparent outline-none text-2xl md:text-3xl font-bold text-tx-primary placeholder:text-tx-tertiary/60"',
    'className={cn(\n            "w-full bg-transparent outline-none text-xl md:text-3xl font-bold text-tx-primary placeholder:text-tx-tertiary/60",\n            compactMobileEditing && "text-lg leading-7",\n          )}',
)
replace_once(path, '{!isGuest && (\n          <div className="mt-2">', '{!isGuest && !compactMobileEditing && (\n          <div className="mt-2">')
replace_once(
    path,
    '<div className="px-4 md:px-8 py-1.5 border-t border-app-border/60 text-[11px] text-tx-tertiary flex items-center gap-3 select-none">',
    '<div\n        data-markdown-mobile-status=""\n        className={cn(\n          "px-4 md:px-8 py-1.5 border-t border-app-border/60 text-[11px] text-tx-tertiary items-center gap-3 select-none",\n          compactMobileEditing ? "hidden" : "flex",\n        )}\n      >',
)

# Extend the existing cross-editor contract instead of creating a second test suite.
test_path = ROOT / "frontend/src/lib/__tests__/androidImmersiveEditorContract.test.ts"
test = test_path.read_text(encoding="utf-8")
needle = '''  it("suppresses the mobile space launcher while the IME is open", () => {
    const source = read("src/components/PublicSpaceLauncher.tsx");'''
addition = '''  it("applies the same compact hierarchy to native Markdown documents", () => {
    const source = read("src/components/MarkdownEditorImpl.tsx");
    expect(source).toContain('data-markdown-mobile-editing-compact');
    expect(source).toContain('data-markdown-mobile-toolbar="compact"');
    expect(source).toContain('data-markdown-mobile-toolbar="expanded"');
    expect(source).toContain('data-markdown-mobile-status');
    expect(source).toContain('!compactMobileEditing');
  });

'''
if test.count(needle) != 1:
    raise RuntimeError("immersive contract insertion anchor mismatch")
test_path.write_text(test.replace(needle, addition + needle, 1), encoding="utf-8")

print("Markdown immersive editor patch applied")

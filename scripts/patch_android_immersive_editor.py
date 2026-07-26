from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path: str, old: str, new: str) -> None:
    file_path = ROOT / path
    text = file_path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}: {old[:120]!r}")
    file_path.write_text(text.replace(old, new, 1), encoding="utf-8")


# ---------------------------------------------------------------------------
# EditorPane: collapse the two-row Android header to one row while the IME is
# visible. Low-frequency actions remain available in the existing More menu.
# ---------------------------------------------------------------------------
replace_once(
    "frontend/src/components/EditorPane.tsx",
    'import { useUserPreferences } from "@/hooks/useUserPreferences";',
    'import { useUserPreferences } from "@/hooks/useUserPreferences";\nimport { useKeyboardVisible } from "@/hooks/useKeyboardVisible";',
)
replace_once(
    "frontend/src/components/EditorPane.tsx",
    "  const { t } = useTranslation();",
    "  const { t } = useTranslation();\n  const { visible: keyboardVisible } = useKeyboardVisible();",
)
replace_once(
    "frontend/src/components/EditorPane.tsx",
    "  const showDesktopOutline = showOutline && !state.editorFullscreen;",
    "  const showDesktopOutline = showOutline && !state.editorFullscreen;\n  const compactMobileEditing = keyboardVisible && canEditActiveNote && !effectiveLocked;",
)
replace_once(
    "frontend/src/components/EditorPane.tsx",
    '<header className="flex flex-col border-b border-app-border bg-app-surface/50 md:hidden" style={{ paddingTop: \'var(--safe-area-top)\' }}>',
    '<header\n        data-mobile-editor-compact={compactMobileEditing ? "true" : "false"}\n        className={cn("flex flex-col border-b border-app-border bg-app-surface/50 md:hidden", compactMobileEditing && "shadow-sm")}\n        style={{ paddingTop: \'var(--safe-area-top)\' }}\n      >',
)
replace_once(
    "frontend/src/components/EditorPane.tsx",
    '<div className="flex min-w-0 items-center gap-2 px-3 pt-2 pb-1">',
    '<div className={cn("flex min-w-0 items-center gap-2 px-3 pt-2 pb-1", compactMobileEditing && "hidden")}>',
)
replace_once(
    "frontend/src/components/EditorPane.tsx",
    '<div className="flex items-center gap-1 px-3 pb-2 pt-0.5">',
    '<div className={cn("flex items-center gap-1", compactMobileEditing ? "px-2 py-1" : "px-3 pb-2 pt-0.5")}>\n          {compactMobileEditing && (\n            <button\n              onClick={() => actions.setMobileView("list")}\n              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-accent-primary active:bg-app-hover"\n              aria-label={t(\'editor.back\')}\n            >\n              <ChevronLeft size={22} />\n            </button>\n          )}',
)
replace_once(
    "frontend/src/components/EditorPane.tsx",
    'variant="ghost" size="icon" className="h-8 w-8 shrink-0"\n            onClick={toggleLock}',
    'variant="ghost" size="icon" className={cn("h-8 w-8 shrink-0", compactMobileEditing && "hidden")}\n            onClick={toggleLock}',
)
replace_once(
    "frontend/src/components/EditorPane.tsx",
    'variant="ghost" size="icon" className="h-8 w-8 shrink-0"\n            onClick={() => window.dispatchEvent(new CustomEvent(\'nowen:open-search\'))}',
    'variant="ghost" size="icon" className={cn("h-8 w-8 shrink-0", compactMobileEditing && "hidden")}\n            onClick={() => window.dispatchEvent(new CustomEvent(\'nowen:open-search\'))}',
)
replace_once(
    "frontend/src/components/EditorPane.tsx",
    '<Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={toggleFavorite}',
    '<Button variant="ghost" size="icon" className={cn("h-8 w-8 shrink-0", compactMobileEditing && "hidden")} onClick={toggleFavorite}',
)
replace_once(
    "frontend/src/components/EditorPane.tsx",
    '                  <button\n                    onClick={() => { togglePin(); setShowMobileMenu(false); }}',
    '''                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('nowen:open-search'));
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-tx-secondary active:bg-app-hover transition-colors"
                  >
                    <Search size={15} className="text-tx-tertiary" />
                    <span>{t('editor.searchInNote')}</span>
                  </button>
                  <button
                    onClick={() => { toggleFavorite(); setShowMobileMenu(false); }}
                    disabled={isTrashed}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-tx-secondary active:bg-app-hover transition-colors disabled:opacity-40"
                  >
                    <Star size={15} className={cn(activeNote.isFavorite ? "text-amber-400 fill-amber-400" : "text-tx-tertiary")} />
                    <span>{activeNote.isFavorite ? t('editor.unfavoriteTooltip') : t('editor.favoriteTooltip')}</span>
                  </button>
                  <button
                    onClick={() => { toggleLock(); setShowMobileMenu(false); }}
                    disabled={isTrashed}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-tx-secondary active:bg-app-hover transition-colors disabled:opacity-40"
                  >
                    {effectiveLocked ? <Lock size={15} className="text-orange-500" /> : <Unlock size={15} className="text-tx-tertiary" />}
                    <span>{effectiveLocked ? t('editor.unlockTooltip') : t('editor.lockTooltip')}</span>
                  </button>
                  <div className="h-px bg-app-border mx-2 my-0.5" />
                  <button
                    onClick={() => { togglePin(); setShowMobileMenu(false); }}''',
)

# ---------------------------------------------------------------------------
# TiptapEditor: one compact mobile toolbar, advanced commands behind an overlay,
# and keyboard-aware title/meta/tag/floating-action density.
# ---------------------------------------------------------------------------
replace_once(
    "frontend/src/components/TiptapEditor.tsx",
    'import { useTranslation } from "react-i18next";',
    'import { useTranslation } from "react-i18next";\nimport { useKeyboardVisible } from "@/hooks/useKeyboardVisible";',
)
replace_once(
    "frontend/src/components/TiptapEditor.tsx",
    '''  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, []);''',
    '''  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, []);
  const { visible: keyboardVisible } = useKeyboardVisible();
  const compactMobileEditing = isMobile && editable && keyboardVisible;
  const [mobileToolbarExpanded, setMobileToolbarExpanded] = useState(false);
  useEffect(() => {
    if (!isMobile || compactMobileEditing) setMobileToolbarExpanded(false);
  }, [compactMobileEditing, isMobile]);
  useEffect(() => setMobileToolbarExpanded(false), [note.id]);''',
)
replace_once(
    "frontend/src/components/TiptapEditor.tsx",
    '<div className={cn("flex flex-col relative", scrollLayout.root, presentationMode && "tiptap-presentation-mode")}>',
    '<div\n      data-mobile-editing-compact={compactMobileEditing ? "true" : "false"}\n      className={cn("flex flex-col relative", scrollLayout.root, presentationMode && "tiptap-presentation-mode")}\n    >',
)
old_toolbar_start = '''      {!presentationMode && (
      <div
        ref={outlineToolbarRef}
        className={cn(
          "editor-toolbar-scroll-fade hide-scrollbar sticky top-0 z-20 flex flex-nowrap items-center gap-0.5 overflow-x-auto touch-pan-x border-b border-app-border bg-app-surface/95 px-4 py-2 backdrop-blur transition-shadow duration-200 supports-[backdrop-filter]:bg-app-surface/70 md:flex-wrap md:overflow-visible md:touch-auto",
          // 滚动离顶后加底部阴影，表达「工具栏浮于内容之上」
          toolbarShadow && "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.4)]",
        )}
      >'''
new_toolbar_start = '''      {!presentationMode && (
      <>
        <div
          data-mobile-editor-toolbar="compact"
          className={cn(
            "md:hidden sticky top-0 z-20 flex flex-nowrap items-center gap-0.5 overflow-x-auto touch-pan-x border-b border-app-border bg-app-surface/95 px-2 py-1.5 backdrop-blur transition-shadow duration-200 supports-[backdrop-filter]:bg-app-surface/70",
            toolbarShadow && "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.4)]",
          )}
        >
          <ToolbarButton compact onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title={t('tiptap.undo')}>
            <Undo size={16} />
          </ToolbarButton>
          <ToolbarButton compact onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title={t('tiptap.redo')}>
            <Redo size={16} />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton compact onClick={() => toggleHeadingSmart(editor, 1)} isActive={editor.isActive("heading", { level: 1 })} title={t('tiptap.heading1')}>
            <Heading1 size={16} />
          </ToolbarButton>
          <ToolbarButton compact onClick={() => toggleHeadingSmart(editor, 2)} isActive={editor.isActive("heading", { level: 2 })} title={t('tiptap.heading2')}>
            <Heading2 size={16} />
          </ToolbarButton>
          <ToolbarButton compact onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title={t('tiptap.bold')}>
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton compact onClick={() => toggleBulletListSmart(editor)} isActive={activeListType === "bulletList"} title={t('tiptap.bulletList')}>
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton compact onClick={() => setMobileToolbarExpanded((value) => !value)} isActive={mobileToolbarExpanded} title={t('common.more')}>
            <ChevronDown size={16} className={cn("transition-transform", mobileToolbarExpanded && "rotate-180")} />
          </ToolbarButton>
        </div>
        <div
          ref={outlineToolbarRef}
          data-mobile-editor-toolbar="expanded"
          className={cn(
            "editor-toolbar-scroll-fade hide-scrollbar z-30 flex-nowrap items-center gap-0.5 overflow-x-auto touch-pan-x border-b border-app-border bg-app-elevated/98 px-3 py-2 backdrop-blur transition-shadow duration-200 supports-[backdrop-filter]:bg-app-elevated/90 md:sticky md:top-0 md:z-20 md:flex md:flex-wrap md:overflow-visible md:touch-auto md:bg-app-surface/95 md:px-4 md:supports-[backdrop-filter]:bg-app-surface/70",
            mobileToolbarExpanded
              ? "flex max-md:absolute max-md:left-0 max-md:right-0 max-md:top-10 max-md:max-h-[38vh] max-md:flex-wrap max-md:overflow-y-auto max-md:shadow-xl"
              : "hidden md:flex",
            toolbarShadow && "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.4)]",
          )}
        >'''
replace_once("frontend/src/components/TiptapEditor.tsx", old_toolbar_start, new_toolbar_start)
replace_once(
    "frontend/src/components/TiptapEditor.tsx",
    '''      </div>
      )}

      {/* 查找替换浮窗''',
    '''      </div>
      </>
      )}

      {/* 查找替换浮窗''',
)
replace_once(
    "frontend/src/components/TiptapEditor.tsx",
    '<div className="px-4 md:px-8 pt-4 md:pt-6 pb-0">',
    '<div\n        data-mobile-editor-title=""\n        className={cn("px-4 md:px-8 pb-0", compactMobileEditing ? "pt-2" : "pt-3 md:pt-6")}\n      >',
)
replace_once(
    "frontend/src/components/TiptapEditor.tsx",
    '"w-full bg-transparent text-2xl font-bold text-tx-primary placeholder:text-tx-tertiary focus:outline-none no-focus-ring",',
    '"w-full bg-transparent text-xl md:text-2xl font-bold text-tx-primary placeholder:text-tx-tertiary focus:outline-none no-focus-ring",\n            compactMobileEditing && "text-lg leading-7",',
)
replace_once(
    "frontend/src/components/TiptapEditor.tsx",
    '<div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-2 text-[10px] text-tx-tertiary">',
    '<div\n          data-mobile-editor-metadata=""\n          className={cn("flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-2 text-[10px] text-tx-tertiary", compactMobileEditing && "hidden")}\n        >',
)
replace_once(
    "frontend/src/components/TiptapEditor.tsx",
    '{!isGuest && !windowedSection && (',
    '{!isGuest && !windowedSection && !compactMobileEditing && (',
)
replace_once(
    "frontend/src/components/TiptapEditor.tsx",
    '{showBackToTop && scrollLayout.ownsViewportOverlay && (',
    '{showBackToTop && !compactMobileEditing && scrollLayout.ownsViewportOverlay && (',
)

# ---------------------------------------------------------------------------
# Global space launcher: never compete with the Android IME or document body.
# ---------------------------------------------------------------------------
replace_once(
    "frontend/src/components/PublicSpaceLauncher.tsx",
    'import { cn } from "@/lib/utils";',
    'import { cn } from "@/lib/utils";\nimport { useKeyboardVisible } from "@/hooks/useKeyboardVisible";',
)
replace_once(
    "frontend/src/components/PublicSpaceLauncher.tsx",
    '  const copy = useMemo(resolveCopy, []);',
    '  const copy = useMemo(resolveCopy, []);\n  const { visible: keyboardVisible } = useKeyboardVisible();',
)
replace_once(
    "frontend/src/components/PublicSpaceLauncher.tsx",
    '''  useEffect(() => {
    if (!panel) return;''',
    '''  useEffect(() => {
    if (keyboardVisible) setPanel(null);
  }, [keyboardVisible]);

  useEffect(() => {
    if (!panel) return;''',
)
replace_once(
    "frontend/src/components/PublicSpaceLauncher.tsx",
    '  const renderRailButton = (mount: RailMount) => {\n    const active = panel?.sourceId === mount.id;',
    '  const renderRailButton = (mount: RailMount) => {\n    if (keyboardVisible && mount.rail.classList.contains("md:hidden")) return null;\n    const active = panel?.sourceId === mount.id;',
)

# ---------------------------------------------------------------------------
# Source-level regression contract. The behavioral hook itself already has a
# single native source of truth; this test protects the composition boundaries.
# ---------------------------------------------------------------------------
contract_test = ROOT / "frontend/src/lib/__tests__/androidImmersiveEditorContract.test.ts"
contract_test.write_text('''import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Android immersive editor contract", () => {
  it("collapses the mobile document header while the native keyboard is visible", () => {
    const source = read("src/components/EditorPane.tsx");
    expect(source).toContain('useKeyboardVisible');
    expect(source).toContain('data-mobile-editor-compact');
    expect(source).toContain('compactMobileEditing && "hidden"');
    expect(source).toContain("nowen:open-search");
  });

  it("keeps one compact toolbar and exposes advanced formatting on demand", () => {
    const source = read("src/components/TiptapEditor.tsx");
    expect(source).toContain('data-mobile-editor-toolbar="compact"');
    expect(source).toContain('data-mobile-editor-toolbar="expanded"');
    expect(source).toContain('mobileToolbarExpanded');
    expect(source).toContain('data-mobile-editing-compact');
  });

  it("removes nonessential metadata and floating actions from the keyboard viewport", () => {
    const source = read("src/components/TiptapEditor.tsx");
    expect(source).toContain('data-mobile-editor-metadata');
    expect(source).toContain('!compactMobileEditing && (');
    expect(source).toContain('showBackToTop && !compactMobileEditing');
  });

  it("suppresses the mobile space launcher while the IME is open", () => {
    const source = read("src/components/PublicSpaceLauncher.tsx");
    expect(source).toContain('useKeyboardVisible');
    expect(source).toContain('keyboardVisible && mount.rail.classList.contains("md:hidden")');
  });
});
''', encoding="utf-8")

print("Android immersive editor patch applied")

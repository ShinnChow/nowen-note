from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path: str, old: str, new: str) -> None:
    target = ROOT / path
    source = target.read_text(encoding="utf-8")
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}")
    target.write_text(source.replace(old, new, 1), encoding="utf-8")


replace_once(
    "frontend/src/components/TiptapEditor.tsx",
    '''  useEffect(() => {
    if (!isMobile || compactMobileEditing) setMobileToolbarExpanded(false);
  }, [compactMobileEditing, isMobile]);
  useEffect(() => setMobileToolbarExpanded(false), [note.id]);''',
    '''  useEffect(() => {
    setMobileToolbarExpanded(false);
  }, [keyboardVisible, isMobile, note.id]);''',
)

replace_once(
    "frontend/src/components/MarkdownEditorImpl.tsx",
    '''  useEffect(() => {
    if (compactMobileEditing) setMobileToolbarExpanded(false);
  }, [compactMobileEditing]);
  useEffect(() => setMobileToolbarExpanded(false), [note.id]);''',
    '''  useEffect(() => {
    setMobileToolbarExpanded(false);
  }, [keyboardVisible, note.id]);''',
)

replace_once(
    "frontend/src/components/MarkdownEditorImpl.tsx",
    '''      type="button"
      onClick={onClick}
      disabled={disabled}''',
    '''      type="button"
      onClick={onClick}
      onMouseDown={(event) => event.preventDefault()}
      disabled={disabled}''',
)

path = ROOT / "frontend/src/lib/__tests__/androidImmersiveEditorContract.test.ts"
source = path.read_text(encoding="utf-8")
old = '''    expect(source).toContain('data-markdown-mobile-status');
    expect(source).toContain('!compactMobileEditing');'''
new = '''    expect(source).toContain('data-markdown-mobile-status');
    expect(source).toContain('!compactMobileEditing');
    expect(source).toContain('onMouseDown={(event) => event.preventDefault()}');
    expect(source).toContain('[keyboardVisible, note.id]');'''
if source.count(old) != 1:
    raise RuntimeError("contract focus anchor mismatch")
path.write_text(source.replace(old, new, 1), encoding="utf-8")

print("Immersive toolbar focus fix applied")

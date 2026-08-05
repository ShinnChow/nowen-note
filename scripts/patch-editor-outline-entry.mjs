import { readFileSync, writeFileSync } from "node:fs";

const path = "frontend/src/components/EditorPane.tsx";
let source = readFileSync(path, "utf8").replace(/^\uFEFF/, "");

const desktopMenuAnchor = '          <div className="relative shrink-0" ref={desktopMoreMenuRef}>';
const desktopToolbarEntry = `          {!state.editorFullscreen && (
            <Button
              data-editor-outline-toggle="desktop-toolbar"
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 shrink-0",
                showDesktopOutline && "bg-accent-primary/10 text-accent-primary",
              )}
              onClick={() => setShowOutline((open) => !open)}
              title={showDesktopOutline ? t('editor.hideOutline') : t('editor.showOutline')}
              aria-label={showDesktopOutline ? t('editor.hideOutline') : t('editor.showOutline')}
              aria-pressed={showDesktopOutline}
            >
              <ListTree size={14} />
            </Button>
          )}

          <div data-editor-more-menu="desktop" className="relative shrink-0" ref={desktopMoreMenuRef}>`;

if (!source.includes(desktopMenuAnchor)) {
  throw new Error("desktop more-menu anchor not found");
}
source = source.replace(desktopMenuAnchor, desktopToolbarEntry);

const menuOutlineAction = `                  <button
                    onClick={() => { setShowOutline(!showOutline); setShowDesktopMoreMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-tx-secondary hover:bg-app-hover transition-colors"
                  >
                    <ListTree size={15} className={cn(showDesktopOutline && "text-accent-primary")} />
                    <span>{showDesktopOutline ? t('editor.hideOutline') : t('editor.showOutline')}</span>
                  </button>
`;

if (!source.includes(menuOutlineAction)) {
  throw new Error("desktop outline menu action not found");
}
source = source.replace(menuOutlineAction, "");

writeFileSync(path, source, "utf8");
console.log("Editor outline entry moved to the outer toolbar");

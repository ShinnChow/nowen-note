from pathlib import Path
import re

commands_path = Path('frontend/src/lib/shortcuts/commands.ts')
commands = commands_path.read_text(encoding='utf-8')
customizable = [
    'new-note', 'command-palette', 'shortcut-help', 'toggle-note-list',
    'paragraph', 'bold', 'italic', 'underline', 'strikethrough', 'inline-code',
    'heading-1', 'heading-2', 'heading-3', 'heading-4', 'heading-5', 'heading-6',
]
for command_id in customizable:
    pattern = re.compile(rf'(id: "{re.escape(command_id)}",[\s\S]*?\n(?P<indent>\s*)scope: "[^"]+",)')
    match = pattern.search(commands)
    if not match:
        raise SystemExit(f'command not found: {command_id}')
    block = match.group(1)
    if 'customizable: true' in block:
        continue
    indent = match.group('indent')
    replacement = block + f'\n{indent}customizable: true,'
    commands = commands[:match.start(1)] + replacement + commands[match.end(1):]
commands_path.write_text(commands, encoding='utf-8')

settings_path = Path('frontend/src/components/SettingsModal.tsx')
settings = settings_path.read_text(encoding='utf-8')
replacements = [
    ('ZoomIn, Key, Building2, BookOpen, ToggleLeft, Download, FolderSync', 'ZoomIn, Key, Keyboard, Building2, BookOpen, ToggleLeft, Download, FolderSync'),
    ('import FolderSyncSettings from "@/components/settings/FolderSyncSettings";\n', 'import FolderSyncSettings from "@/components/settings/FolderSyncSettings";\nimport ShortcutSettingsPanel from "@/components/settings/ShortcutSettingsPanel";\n'),
    ('import { cn } from "@/lib/utils";\n', 'import { cn } from "@/lib/utils";\nimport { detectShortcutSurface } from "@/lib/shortcutRegistry";\n'),
    ('type TabId = "appearance" | "switches" | "ai"', 'type TabId = "appearance" | "switches" | "shortcuts" | "ai"'),
    ('  const { siteConfig } = useSiteSettings();\n  const [currentUser,', '  const { siteConfig } = useSiteSettings();\n  const shortcutSurface = detectShortcutSurface();\n  const [currentUser,'),
    ("    { id: \"switches\" as const, label: t('settings.switches'), icon: ToggleLeft },\n    { id: \"ai\" as const,", "    { id: \"switches\" as const, label: t('settings.switches'), icon: ToggleLeft },\n    ...(shortcutSurface !== \"android\" ? [{ id: \"shortcuts\" as const, label: \"快捷键\", icon: Keyboard }] : []),\n    { id: \"ai\" as const,"),
    ('            {activeTab === "switches" && <SwitchesPanel />}\n            {activeTab === "ai"', '            {activeTab === "switches" && <SwitchesPanel />}\n            {activeTab === "shortcuts" && shortcutSurface !== "android" && <ShortcutSettingsPanel />}\n            {activeTab === "ai"'),
]
for old, new in replacements:
    if old not in settings:
        if new in settings:
            continue
        raise SystemExit(f'SettingsModal pattern not found: {old[:80]}')
    settings = settings.replace(old, new, 1)
settings_path.write_text(settings, encoding='utf-8')

bridge_path = Path('frontend/src/components/MobileDrawerUxBridge.tsx')
bridge = bridge_path.read_text(encoding='utf-8')
if 'ShortcutRuntimeBridge' not in bridge:
    bridge = bridge.replace('import ShortcutHelpCenter from "@/components/ShortcutHelpCenter";\n', 'import ShortcutHelpCenter from "@/components/ShortcutHelpCenter";\nimport ShortcutRuntimeBridge from "@/components/ShortcutRuntimeBridge";\n', 1)
    bridge = bridge.replace('      <ShortcutHelpCenter />\n', '      <ShortcutHelpCenter />\n      <ShortcutRuntimeBridge />\n', 1)
bridge_path.write_text(bridge, encoding='utf-8')

help_path = Path('frontend/src/components/ShortcutHelpCenter.tsx')
help_text = help_path.read_text(encoding='utf-8')
if 'SHORTCUT_OVERRIDES_CHANGED_EVENT' not in help_text:
    help_text = help_text.replace('import { installShortcutTooltipBridge } from "@/lib/shortcutTooltipBridge";\n', 'import { installShortcutTooltipBridge } from "@/lib/shortcutTooltipBridge";\nimport { SHORTCUT_OVERRIDES_CHANGED_EVENT } from "@/lib/shortcutOverrides";\n', 1)
    help_text = help_text.replace('  const [query, setQuery] = useState("");\n', '  const [query, setQuery] = useState("");\n  const [shortcutRevision, setShortcutRevision] = useState(0);\n', 1)
    help_text = help_text.replace('  useEffect(() => installShortcutTooltipBridge(), []);\n', '  useEffect(() => installShortcutTooltipBridge(), []);\n\n  useEffect(() => {\n    const refresh = () => setShortcutRevision((value) => value + 1);\n    window.addEventListener(SHORTCUT_OVERRIDES_CHANGED_EVENT, refresh);\n    return () => window.removeEventListener(SHORTCUT_OVERRIDES_CHANGED_EVENT, refresh);\n  }, []);\n', 1)
    help_text = help_text.replace('  }, [platform, query, surface]);\n', '  }, [platform, query, shortcutRevision, surface]);\n', 1)
    help_text = help_text.replace('  const conflicts = useMemo(() => findShortcutConflicts(), []);\n', '  const conflicts = useMemo(() => findShortcutConflicts(), [shortcutRevision]);\n', 1)
help_path.write_text(help_text, encoding='utf-8')

tooltip_path = Path('frontend/src/lib/shortcutTooltipBridge.ts')
tooltip = tooltip_path.read_text(encoding='utf-8')
if 'SHORTCUT_OVERRIDES_CHANGED_EVENT' not in tooltip:
    tooltip = tooltip.replace('} from "./shortcutRegistry";\n', '} from "./shortcutRegistry";\nimport { SHORTCUT_OVERRIDES_CHANGED_EVENT } from "./shortcutOverrides";\n', 1)
    tooltip = tooltip.replace('  return () => {\n    observer.disconnect();\n', '  window.addEventListener(SHORTCUT_OVERRIDES_CHANGED_EVENT, schedule);\n  return () => {\n    observer.disconnect();\n    window.removeEventListener(SHORTCUT_OVERRIDES_CHANGED_EVENT, schedule);\n', 1)
tooltip_path.write_text(tooltip, encoding='utf-8')

menu_path = Path('electron/menu.js')
menu = menu_path.read_text(encoding='utf-8')
removable = [
    '          accelerator: isMac ? "Cmd+N" : "Ctrl+N",\n',
    '          accelerator: "CmdOrCtrl+B",\n', '          accelerator: "CmdOrCtrl+I",\n',
    '          accelerator: "CmdOrCtrl+U",\n', '          accelerator: "CmdOrCtrl+Shift+S",\n',
    '          accelerator: "CmdOrCtrl+E",\n', '          accelerator: "CmdOrCtrl+Alt+1",\n',
    '          accelerator: "CmdOrCtrl+Alt+2",\n', '          accelerator: "CmdOrCtrl+Alt+3",\n',
    '          accelerator: "CmdOrCtrl+Alt+4",\n', '          accelerator: "CmdOrCtrl+Alt+5",\n',
    '          accelerator: "CmdOrCtrl+Alt+6",\n', '          accelerator: "CmdOrCtrl+Alt+0",\n',
    '          accelerator: "CmdOrCtrl+Shift+B",\n', '          accelerator: "CmdOrCtrl+Shift+/",\n',
]
for line in removable:
    menu = menu.replace(line, '', 1)
menu = menu.replace('// 构建跨平台原生菜单；菜单项的 accelerator 即作为窗口快捷键生效。', '// 构建跨平台原生菜单；可自定义命令由 renderer 注册表处理，菜单项保留点击入口。', 1)
menu = menu.replace('// 触发 schema.marks.toggleBold 等。accelerator 与编辑器内的 Mod-B/I/U 保持一致，\n// 让系统菜单成为键位发现入口，但键盘快捷键仍由编辑器实现。', '// 触发 schema.marks.toggleBold 等。键盘触发由 renderer 的可配置注册表统一接管，\n// 避免原生 accelerator 在用户修改键位后继续触发旧默认值。', 1)
menu_path.write_text(menu, encoding='utf-8')

for temporary in [
    Path('.github/workflows/apply-shortcut-customization.yml'),
    Path('scripts/applyShortcutCustomization.py'),
]:
    if temporary.exists():
        temporary.unlink()

from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one anchor, found {count}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


replace_once(
    "frontend/src/components/tasks/TaskDetailPanel.tsx",
    '''      onUpdate(task.id, {
        startDate: startDate || null,
        dueAt: null,
      });''',
    '''      onUpdate(task.id, {
        startDate: startDate || null,
        dueDate: dueDate || null,
        dueAt: null,
      });''',
)

replace_once(
    "frontend/src/components/tasks/__tests__/taskAllDayContract.test.ts",
    '''    expect(source).toContain("dueAt: allDay ? null");
    expect(source).toContain("startDate: allDay ? (startDate || null)");''',
    '''    expect(source).toContain("dueAt: allDay ? null");
    expect(source).toContain("startDate: allDay ? (startDate || null)");
    expect(source).toContain("dueDate: dueDate || null");''',
)

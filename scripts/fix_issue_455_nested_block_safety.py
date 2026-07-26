from pathlib import Path

root = Path(__file__).resolve().parents[1]
helper = root / "frontend/src/lib/formatPainter.ts"
test = root / "frontend/src/lib/__tests__/formatPainter.test.ts"

source = helper.read_text(encoding="utf-8")
old = '''  const targetBlocks = collectSimpleTextBlocks(editor, selection.from, selection.to);
  const canConvertNodeType = targetBlocks.size === 1;
  targetBlocks.forEach((node, pos) => {
    const sourceBlock = format.block;
    if (!sourceBlock) return;

    let nextType = node.type;
    let nextAttrs: Record<string, unknown> = { ...node.attrs };
    nextAttrs.textAlign = sourceBlock.textAlign;
    nextAttrs.lineHeight = sourceBlock.lineHeight;

    if (canConvertNodeType) {
      const desiredType = schema.nodes[sourceBlock.nodeType];
      if (desiredType) {
        nextType = desiredType;
        if (sourceBlock.nodeType === "heading") nextAttrs.level = sourceBlock.headingLevel ?? 1;
      }
    }

    nextAttrs = allowedAttrs(nextType, nextAttrs);
    tr.setNodeMarkup(pos, nextType, nextAttrs, node.marks);
  });

  if (!tr.docChanged) return { ok: true, degraded: targetBlocks.size !== 1 };
  tr.setMeta("formatPainter", true);
  editor.view.dispatch(tr.scrollIntoView());
  return { ok: true, degraded: targetBlocks.size !== 1 };'''
new = '''  const targetBlocks = collectSimpleTextBlocks(editor, selection.from, selection.to);
  const canConvertNodeType = targetBlocks.size === 1;
  let degraded = targetBlocks.size !== 1;
  targetBlocks.forEach((node, pos) => {
    const sourceBlock = format.block;
    if (!sourceBlock) return;

    let nextType = node.type;
    let nextAttrs: Record<string, unknown> = { ...node.attrs };
    nextAttrs.textAlign = sourceBlock.textAlign;
    nextAttrs.lineHeight = sourceBlock.lineHeight;

    if (canConvertNodeType) {
      const desiredType = schema.nodes[sourceBlock.nodeType];
      if (desiredType) {
        if (desiredType === node.type) {
          nextType = desiredType;
          if (sourceBlock.nodeType === "heading") nextAttrs.level = sourceBlock.headingLevel ?? 1;
        } else {
          const $pos = tr.doc.resolve(pos);
          const parent = $pos.parent;
          const index = $pos.index();
          const validReplacement = desiredType.validContent(node.content)
            && parent.canReplaceWith(index, index + 1, desiredType);
          if (validReplacement) {
            nextType = desiredType;
            if (sourceBlock.nodeType === "heading") nextAttrs.level = sourceBlock.headingLevel ?? 1;
          } else {
            degraded = true;
          }
        }
      } else {
        degraded = true;
      }
    }

    nextAttrs = allowedAttrs(nextType, nextAttrs);
    tr.setNodeMarkup(pos, nextType, nextAttrs, node.marks);
  });

  if (!tr.docChanged) return { ok: true, degraded };
  tr.setMeta("formatPainter", true);
  editor.view.dispatch(tr.scrollIntoView());
  return { ok: true, degraded };'''
if source.count(old) != 1:
    raise RuntimeError(f"helper target block count={source.count(old)}")
helper.write_text(source.replace(old, new, 1), encoding="utf-8")

case_source = test.read_text(encoding="utf-8")
anchor = '''  it("rejects unsafe style values and readonly edits", () => {'''
case = '''  it("keeps list structure when the requested heading conversion is invalid", () => {
    const editor = createEditor({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2, textAlign: "center", lineHeight: "1.6" },
          content: [{ type: "text", text: "Source", marks: [{ type: "bold" }] }],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Nested target" }] },
              ],
            },
          ],
        },
      ],
    });

    editor.commands.setTextSelection(findTextRange(editor, "Source"));
    const captured = captureTextFormat(editor);
    if (!captured.ok || !captured.format) throw new Error("format capture failed");
    editor.commands.setTextSelection(findTextRange(editor, "Nested target"));

    expect(applyCapturedTextFormat(editor, captured.format)).toMatchObject({ ok: true, degraded: true });
    expect(blockForText(editor, "Nested target")).toMatchObject({
      type: "paragraph",
      attrs: { textAlign: "center", lineHeight: "1.6" },
    });
    expect(textMarks(editor, "Nested target").bold).toBeDefined();
  });

'''
if case_source.count(anchor) != 1:
    raise RuntimeError(f"test insertion anchor count={case_source.count(anchor)}")
test.write_text(case_source.replace(anchor, case + anchor, 1), encoding="utf-8")
print("Issue #455 nested block conversion guard and regression test applied")

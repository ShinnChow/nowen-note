/** 判断剪贴板 HTML 中是否包含可由富文本编辑器解析的实际内容标签。 */
export function hasMeaningfulClipboardHtml(html: string): boolean {
  return /<(?!html\b|head\b|meta\b|body\b)[a-z][^>]*>/i.test(html);
}

/** 只有没有实际富文本 HTML 时，才允许纯文本 Markdown 自动识别接管粘贴。 */
export function shouldHandleAsMarkdownPaste(html: string, markdownLike: boolean): boolean {
  return markdownLike && !hasMeaningfulClipboardHtml(html);
}

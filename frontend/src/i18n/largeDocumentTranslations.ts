export const zhCNLargeDocumentTranslations = {
  markdown: {
    largeDocument: {
      noPlainText: "该大文档没有可用的纯文本索引。原始内容已受到保护，请导出后在外部工具中查看。",
      richTextSafeMode: "富文本应急保护模式",
      richTextSafeModeDesc: "检测到该笔记的富文本结构可能导致编辑器无响应。为保护原始内容，本次以纯文本索引只读打开；原始富文本不会被修改。",
      charactersCount: "{{count}} 字符",
      approximateNodes: "约 {{count}} 个节点",
      originalProtected: "原始富文本已完整保留",
      plainTextViewer: "大文档纯文本只读视图",
      richFeaturesDisabled: "富文本解析与协同已停用",
      copyAvailable: "支持搜索、选择和复制",
      reasons: {
        serializedSize: "原始内容体积过大",
        lineCount: "文本行数过多",
        longLine: "存在异常超长单行",
        nodeCount: "富文本结构节点过多",
        mediaCount: "图片、附件或嵌入节点过多",
        codeBlockCount: "代码块数量过多",
        initializationTimeout: "编辑器初始化超过时间预算",
        runtimeLongTask: "编辑器连续产生主线程长任务",
      },
    },
  },
} as const;

export const enLargeDocumentTranslations = {
  markdown: {
    largeDocument: {
      noPlainText: "No plain-text index is available for this large document. The original content is protected; export it to inspect it in an external tool.",
      richTextSafeMode: "Rich-text safe mode",
      richTextSafeModeDesc: "This note has a rich-text structure that could make the editor unresponsive. To protect the original content, it is opened read-only using its plain-text index; the original rich text will not be modified.",
      charactersCount: "{{count}} characters",
      approximateNodes: "About {{count}} nodes",
      originalProtected: "Original rich text preserved",
      plainTextViewer: "Large-document plain-text viewer",
      richFeaturesDisabled: "Rich-text parsing and collaboration are disabled",
      copyAvailable: "Search, selection, and copy are available",
      reasons: {
        serializedSize: "Original content is too large",
        lineCount: "Too many text lines",
        longLine: "An unusually long line was detected",
        nodeCount: "Too many rich-text nodes",
        mediaCount: "Too many images, attachments, or embeds",
        codeBlockCount: "Too many code blocks",
        initializationTimeout: "Editor initialization exceeded the time budget",
        runtimeLongTask: "The editor repeatedly produced long main-thread tasks",
      },
    },
  },
} as const;

import { useEffect } from "react";

import {
  applySidebarSearchExperience,
  SIDEBAR_SEARCH_SURFACE_SELECTOR,
} from "@/lib/sidebarSearchExperience";

/**
 * 统一内容树上线后的搜索入口兼容桥。
 *
 * Sidebar 目前仍包含旧笔记本树的大量兼容代码，直接在本次 UI 收敛中整体拆除风险较高。
 * 此桥只负责搜索入口语义，不参与任何业务查询：全文搜索仍由命令面板负责，
 * 内容树输入框继续调用 KnowledgeTreePanel 自己的本地过滤逻辑。
 */
export default function SidebarSearchExperienceBridge() {
  useEffect(() => {
    const applyDocument = () => applySidebarSearchExperience(document);

    applyDocument();

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const addedNode of record.addedNodes) {
          if (!(addedNode instanceof Element)) continue;
          if (
            addedNode.matches(SIDEBAR_SEARCH_SURFACE_SELECTOR)
            || addedNode.querySelector(SIDEBAR_SEARCH_SURFACE_SELECTOR)
          ) {
            applySidebarSearchExperience(addedNode);
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // 工作区切换时移动端/桌面端 Sidebar 可能重新挂载，主动再收敛一次。
    window.addEventListener("nowen:workspace-changed", applyDocument);

    return () => {
      observer.disconnect();
      window.removeEventListener("nowen:workspace-changed", applyDocument);
    };
  }, []);

  return null;
}

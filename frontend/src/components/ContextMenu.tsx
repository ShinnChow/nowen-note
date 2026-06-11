import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  menuRef: React.RefObject<HTMLDivElement | null>;
  onAction: (actionId: string) => void;
  header?: string;
}

export default function ContextMenu({
  isOpen, x, y, items, menuRef, onAction, header,
}: ContextMenuProps) {
  const internalRef = useRef<HTMLDivElement | null>(null);
  const [adjustedPos, setAdjustedPos] = React.useState({ x, y });

  // 同步内部 ref 到外部 menuRef
  useEffect(() => {
    if (!isOpen || !menuRef || !("current" in menuRef)) return;
    const externalRef = menuRef as React.MutableRefObject<HTMLDivElement | null>;
    externalRef.current = internalRef.current;
    return () => {
      if (externalRef.current === internalRef.current) {
        externalRef.current = null;
      }
    };
  }, [isOpen, menuRef]);

  // 位置边界修正：防止菜单超出屏幕
  useEffect(() => {
    if (!isOpen) return;
    // 延迟一帧，等 DOM 渲染后获取菜单尺寸
    requestAnimationFrame(() => {
      const el = internalRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let newX = x;
      let newY = y;
      // 右侧溢出
      if (newX + rect.width > vw - 8) {
        newX = vw - rect.width - 8;
      }
      // 底部溢出
      if (newY + rect.height > vh - 8) {
        newY = vh - rect.height - 8;
      }
      // 左侧溢出
      if (newX < 8) newX = 8;
      // 顶部溢出
      if (newY < 8) newY = 8;
      if (newX !== x || newY !== y) {
        setAdjustedPos({ x: newX, y: newY });
      }
    });
  }, [isOpen, x, y]);

  // x/y 变化时重置 adjustedPos
  useEffect(() => {
    setAdjustedPos({ x, y });
  }, [x, y]);

  if (!isOpen) return null;

  return (
    <div
      ref={internalRef}
      style={{
        position: "fixed",
        top: adjustedPos.y,
        left: adjustedPos.x,
        zIndex: 100,
        animation: "contextMenuIn 0.12s ease-out",
      }}
      className="w-48 backdrop-blur-xl bg-white/90 dark:bg-zinc-900/90 rounded-[12px] shadow-lg shadow-black/[0.08] dark:shadow-black/30 border border-black/[0.06] dark:border-white/[0.08] py-1 select-none"
    >
      {header && (
        <div className="px-3 py-1.5 text-[11px] font-medium text-tx-tertiary border-b border-black/[0.06] dark:border-white/[0.08] mb-0.5 truncate">
          {header}
        </div>
      )}
      {items.map((item) =>
        item.separator ? (
          <div key={item.id} className="h-px bg-black/[0.06] dark:bg-white/[0.08] my-1 mx-2" />
        ) : (
          <button
            key={item.id}
            disabled={item.disabled}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!item.disabled) onAction(item.id);
            }}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors duration-150 ease-out",
              item.disabled && "opacity-40 cursor-not-allowed",
              item.danger
                ? "text-red-600 dark:text-red-400 hover:bg-red-50/60 dark:hover:bg-red-900/20"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-tx-primary"
            )}
          >
            {item.icon && <span className="w-4 h-4 flex items-center justify-center">{item.icon}</span>}
            {item.label}
          </button>
        )
      )}
    </div>
  );
}

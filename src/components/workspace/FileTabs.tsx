/**
 * @file FileTabs.tsx
 * @description Modern, sleek horizontal file tabs bar for switching between open documents.
 * Features smooth hover transitions, file type icon preservation, and easy tab dismissal.
 */

import React from "react";
import { X } from "lucide-react";
import { WorkspaceItem } from "../../types/workspace";
import { getFileIcon } from "./FileTreeItem";

interface FileTabsProps {
  openFileIds: string[];
  activeFileId: string;
  items: WorkspaceItem[];
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

export default function FileTabs({
  openFileIds,
  activeFileId,
  items,
  onSelect,
  onClose,
}: FileTabsProps) {
  if (openFileIds.length === 0) return null;

  return (
    <div className="flex items-center w-full bg-[var(--theme-sidebar,#070c18)] border-b border-[var(--theme-border,#141d30)] overflow-x-auto scrollbar-none shrink-0 select-none">
      <div className="flex items-stretch h-9">
        {openFileIds.map((id) => {
          const item = items.find((i) => i.id === id);
          if (!item) return null;

          const isActive = id === activeFileId;

          return (
            <div
              key={id}
              onClick={() => onSelect(id)}
              className={`flex items-center gap-2 px-3.5 border-r border-[var(--theme-border,#141d30)] cursor-pointer transition-all h-full relative group ${
                isActive
                  ? "bg-[var(--theme-bg,#0c1322)] text-[var(--theme-accent,#10b981)] font-semibold"
                  : "opacity-70 hover:opacity-100 hover:bg-[var(--theme-card,#080d19)] text-[var(--theme-text,#e2e8f0)]"
              }`}
            >
              {/* Active indicator line */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--theme-accent,#10b981)]" />
              )}

              {/* File Icon */}
              <span className="shrink-0 scale-90">
                {getFileIcon(item.name)}
              </span>

              {/* File Name */}
              <span className="text-[11px] font-mono tracking-tight max-w-[120px] truncate">
                {item.name}
              </span>

              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(id);
                }}
                className="p-0.5 rounded text-[var(--theme-text-muted,#94a3b8)] hover:text-[var(--theme-text,#f1f5f9)] hover:bg-[var(--theme-card-hover,#162032)] transition-colors cursor-pointer"
                title="Close file"
              >
                <X size={10} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

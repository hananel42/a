/**
 * @file Header.tsx
 * @description Sleek, modern header component for the workspace document view.
 *
 * Props:
 * - `activeFile`: MarkdownFile - Currently loaded markdown or code file object.
 * - `isSidebarOpen`: boolean - Indicates whether the File Explorer sidebar is expanded.
 * - `setIsSidebarOpen`: (isOpen: boolean) => void - Toggles the sidebar visibility.
 */

import React, { useState, useRef, useEffect } from "react";
import { Menu, ChevronLeft, Printer, FileText, ChevronDown } from "lucide-react";
import { MarkdownFile } from "../../types";

interface HeaderProps {
  activeFile: MarkdownFile;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  onExportPDF?: () => void;
}

/**
 * Top header displaying active document title, file size, sidebar toggle, and print/export action.
 */
export default function Header({
  activeFile,
  isSidebarOpen,
  setIsSidebarOpen,
  onExportPDF,
}: HeaderProps) {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center justify-between border-b border-[var(--theme-border,#141d30)] bg-[var(--theme-card,#101726)] text-[var(--theme-text,#f1f5f9)] px-4 py-2 shrink-0 z-20 h-11">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          className="p-1.5 rounded-lg border border-[var(--theme-border,#141d30)] bg-[var(--theme-bg,#070c18)] hover:bg-[var(--theme-card-hover,#162032)] text-[var(--theme-text-muted,#94a3b8)] hover:text-[var(--theme-text,#f1f5f9)] transition-colors cursor-pointer shrink-0 flex items-center justify-center"
        >
          {isSidebarOpen ? <ChevronLeft size={14} /> : <Menu size={14} />}
        </button>

        {/* Document title & file size info */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs text-[var(--theme-text-muted,#94a3b8)] font-mono hidden sm:inline shrink-0">
            Active File:
          </span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-[var(--theme-text,#f1f5f9)] tracking-tight text-xs sm:text-sm truncate">
              {activeFile.title || "(No file selected)"}
            </span>
            {activeFile.id && (
              <span className="text-[9px] bg-[var(--theme-bg,#070c18)] border border-[var(--theme-border,#141d30)] text-[var(--theme-text-muted,#94a3b8)] font-mono px-1.5 py-0.5 rounded shrink-0">
                {activeFile.content
                  ? `${(activeFile.content.length / 1024).toFixed(2)} KB`
                  : "0 KB"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Export Action Controls */}
      {activeFile.id && activeFile.title?.toLowerCase().endsWith(".md") && (
        <div className="flex items-center gap-2 shrink-0 relative" ref={menuRef}>
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              title="Print & Export options"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--theme-border,#141d30)] bg-[var(--theme-bg,#070c18)] hover:bg-[var(--theme-card-hover,#162032)] text-[var(--theme-text-muted,#94a3b8)] hover:text-[var(--theme-text,#f1f5f9)] transition-colors cursor-pointer text-xs"
            >
              <Printer size={13} />
              <span>Print / Export</span>
              <ChevronDown size={13} />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-[var(--theme-card,#18181b)] border border-[var(--theme-border,#27272a)] rounded-xl shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onExportPDF?.();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--theme-card-hover,#27272a)] text-[var(--theme-text,#f4f4f5)] transition-colors cursor-pointer font-medium"
                >
                  <Printer size={13} className="text-indigo-400" />
                  <span>Print / Save as PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


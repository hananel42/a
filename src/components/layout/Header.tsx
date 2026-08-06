/**
 * @file Header.tsx
 * @description Sleek, modern header component for the workspace document view.
 *
 * Props:
 * - `activeFile`: MarkdownFile - Currently loaded markdown or code file object.
 * - `isSidebarOpen`: boolean - Indicates whether the File Explorer sidebar is expanded.
 * - `setIsSidebarOpen`: (isOpen: boolean) => void - Toggles the sidebar visibility.
 */

import React from "react";
import { Menu, ChevronLeft } from "lucide-react";
import { MarkdownFile } from "../../types";

interface HeaderProps {
  activeFile: MarkdownFile;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

/**
 * Top header displaying active document title, file size, and sidebar toggle.
 */
export default function Header({
  activeFile,
  isSidebarOpen,
  setIsSidebarOpen,
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 shrink-0 z-20 h-11">
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer shrink-0 flex items-center justify-center bg-white dark:bg-slate-950"
        >
          {isSidebarOpen ? <ChevronLeft size={14} /> : <Menu size={14} />}
        </button>

        {/* Document title & file size info */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Active File:
          </span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-white tracking-tight text-xs sm:text-sm">
              {activeFile.title}
            </span>
            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono px-1.5 py-0.5 rounded">
              {activeFile.content
                ? `${(activeFile.content.length / 1024).toFixed(2)} KB`
                : "0 KB"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

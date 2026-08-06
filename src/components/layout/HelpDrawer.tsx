/**
 * @file HelpDrawer.tsx
 * @description Slide-over drawer presenting the Markdown Cheatsheet and usage guide.
 */

import React from "react";
import { X, BookOpen } from "lucide-react";
import MarkdownViewer from "../workspace/MarkdownViewer";
import { markdownDocumentation } from "../../data/cheatsheet";

interface HelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Renders an expandable right drawer containing Markdown documentation.
 */
export default function HelpDrawer({ isOpen, onClose }: HelpDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs select-none">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="w-full max-w-sm sm:max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl relative z-10 animate-slide-left text-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-white">
            <BookOpen
              size={18}
              className="text-indigo-600 dark:text-indigo-400"
            />
            <span>Markdown Cheat Sheet</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin select-text bg-slate-50 dark:bg-slate-950/20">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <MarkdownViewer content={markdownDocumentation} />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Close Help Menu
          </button>
        </div>
      </div>
    </div>
  );
}

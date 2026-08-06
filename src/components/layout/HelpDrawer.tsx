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

      <div className="w-full max-w-sm sm:max-w-md h-full bg-[var(--theme-card,#101726)] text-[var(--theme-text,#f1f5f9)] border-l border-[var(--theme-border,#141d30)] flex flex-col shadow-2xl relative z-10 animate-slide-left text-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--theme-border,#141d30)]">
          <div className="flex items-center gap-2 font-semibold text-[var(--theme-text,#f1f5f9)]">
            <BookOpen
              size={18}
              className="text-[var(--theme-accent,#10b981)]"
            />
            <span>Markdown Cheat Sheet</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--theme-card-hover,#162032)] text-[var(--theme-text-muted,#94a3b8)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin select-text bg-[var(--theme-bg,#070c18)]">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <MarkdownViewer content={markdownDocumentation} />
          </div>
        </div>

        <div className="p-4 border-t border-[var(--theme-border,#141d30)]">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[var(--theme-card-hover,#162032)] hover:opacity-90 text-[var(--theme-text,#f1f5f9)] font-semibold text-xs transition-colors cursor-pointer border border-[var(--theme-border,#141d30)]"
          >
            Close Help Menu
          </button>
        </div>
      </div>
    </div>
  );
}

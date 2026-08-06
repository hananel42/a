/**
 * @file Toolbar.tsx
 * @description Action toolbar for text formatting, dialog triggers, viewing modes, stats, and style switching.
 *
 * Props:
 * - `onFormat`: Callback to apply formatting (bold, italic, headers, lists, etc.).
 * - `onOpenDialog`: Callback to open media/table/link dialogs.
 * - `mode`: Current editor display mode ('split' | 'edit' | 'preview').
 * - `setMode`: Setter for changing editor display mode.
 * - `wordCount`: Live document word count.
 * - `charCount`: Live document character count.
 * - `previewStyle`: Selected markdown preview theme.
 * - `setPreviewStyle`: Setter for changing preview theme.
 */

import React from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Quote,
  Code,
  FileCode,
  List,
  ListOrdered,
  CheckSquare,
  Link,
  Table,
  Image,
  Minus,
} from "lucide-react";
import { FormatType } from "../../utils/formatter";

interface ToolbarProps {
  onFormat: (type: FormatType, additionalData?: any) => void;
  onOpenDialog: (type: "link" | "table" | "media") => void;
  mode: "split" | "edit" | "preview";
  setMode: (mode: "split" | "edit" | "preview") => void;
  wordCount: number;
  charCount: number;
  previewStyle: "standard" | "serif" | "newspaper" | "nord" | "tech";
  setPreviewStyle: (
    style: "standard" | "serif" | "newspaper" | "nord" | "tech",
  ) => void;
  onExportPDF?: () => void;
}

/**
 * Workspace formatting and display mode control toolbar.
 */
export default function Toolbar({
  onFormat,
  onOpenDialog,
  mode,
  setMode,
  wordCount,
  charCount,
  previewStyle,
  setPreviewStyle,
  onExportPDF,
}: ToolbarProps) {
  const formatButtons = [
    {
      group: "emphasis",
      items: [
        {
          id: "bold",
          icon: <Bold size={16} />,
          tooltip: "Bold (Ctrl+B)",
          handler: () => onFormat("bold"),
        },
        {
          id: "italic",
          icon: <Italic size={16} />,
          tooltip: "Italic (Ctrl+I)",
          handler: () => onFormat("italic"),
        },
        {
          id: "strikethrough",
          icon: <Strikethrough size={16} />,
          tooltip: "Strikethrough",
          handler: () => onFormat("strikethrough"),
        },
      ],
    },
    {
      group: "headers",
      items: [
        {
          id: "h1",
          icon: <span className="font-sans font-bold text-xs">H1</span>,
          tooltip: "Heading 1",
          handler: () => onFormat("h1"),
        },
        {
          id: "h2",
          icon: <span className="font-sans font-bold text-xs">H2</span>,
          tooltip: "Heading 2",
          handler: () => onFormat("h2"),
        },
        {
          id: "h3",
          icon: <span className="font-sans font-bold text-xs">H3</span>,
          tooltip: "Heading 3",
          handler: () => onFormat("h3"),
        },
        {
          id: "blockquote",
          icon: <Quote size={15} />,
          tooltip: "Blockquote",
          handler: () => onFormat("blockquote"),
        },
      ],
    },
    {
      group: "code",
      items: [
        {
          id: "code",
          icon: <Code size={16} />,
          tooltip: "Inline Code (Ctrl+/)",
          handler: () => onFormat("code"),
        },
        {
          id: "codeblock",
          icon: <FileCode size={16} />,
          tooltip: "Code Block",
          handler: () => onFormat("codeblock"),
        },
      ],
    },
    {
      group: "lists",
      items: [
        {
          id: "ul",
          icon: <List size={16} />,
          tooltip: "Unordered List",
          handler: () => onFormat("ul"),
        },
        {
          id: "ol",
          icon: <ListOrdered size={16} />,
          tooltip: "Ordered List",
          handler: () => onFormat("ol"),
        },
        {
          id: "task",
          icon: <CheckSquare size={16} />,
          tooltip: "Checklist",
          handler: () => onFormat("task"),
        },
      ],
    },
    {
      group: "inserts",
      items: [
        {
          id: "link",
          icon: <Link size={16} />,
          tooltip: "Add Link (Ctrl+K)",
          handler: () => onOpenDialog("link"),
        },
        {
          id: "table",
          icon: <Table size={16} />,
          tooltip: "Add Table",
          handler: () => onOpenDialog("table"),
        },
        {
          id: "media",
          icon: <Image size={16} />,
          tooltip: "Add Images/Videos",
          handler: () => onOpenDialog("media"),
        },
        {
          id: "hr",
          icon: <Minus size={16} />,
          tooltip: "Horizontal Rule",
          handler: () => onFormat("hr"),
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between border-b border-[var(--theme-border,#141d30)] bg-[var(--theme-card,#101726)] text-[var(--theme-text,#f1f5f9)] px-4 py-2 gap-3.5 select-none shrink-0">
      {/* Editor layout formatting buttons */}
      <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
        {formatButtons.map((group, gIdx) => (
          <React.Fragment key={group.group}>
            {gIdx > 0 && (
              <div className="h-5 w-px bg-[var(--theme-border,#141d30)] mx-1 self-center hidden sm:block" />
            )}
            <div className="flex items-center gap-1 bg-[var(--theme-bg,#070c18)] p-1 border border-[var(--theme-border,#141d30)] rounded-xl shadow-xs">
              {group.items.map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={btn.handler}
                  title={btn.tooltip}
                  disabled={mode === "preview"}
                  className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--theme-accent-subtle,rgba(16,185,129,0.15))] text-[var(--theme-text-muted,#94a3b8)] hover:text-[var(--theme-accent,#10b981)] disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150 cursor-pointer"
                >
                  {btn.icon}
                </button>
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Screen view mode toggles and stats counters */}
      <div className="flex flex-wrap items-center justify-between md:justify-end gap-3.5">
        {/* Statistics info bar */}
        <div className="hidden lg:flex items-center gap-3.5 text-xs text-[var(--theme-text-muted,#94a3b8)] font-mono border-r border-[var(--theme-border,#141d30)] pr-4">
          <div className="flex gap-1">
            <span className="opacity-70">words:</span>
            <span className="font-semibold text-[var(--theme-text,#f1f5f9)]">
              {wordCount}
            </span>
          </div>
          <div className="flex gap-1">
            <span className="opacity-70">chars:</span>
            <span className="font-semibold text-[var(--theme-text,#f1f5f9)]">
              {charCount}
            </span>
          </div>
        </div>

        {/* Minimal Preview Theme Selector dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-[var(--theme-text-muted,#94a3b8)] uppercase tracking-wider hidden xs:inline">
            Style:
          </span>
          <select
            value={previewStyle}
            onChange={(e) => setPreviewStyle(e.target.value as any)}
            className="text-xs font-semibold bg-[var(--theme-bg,#070c18)] text-[var(--theme-text,#f1f5f9)] border border-[var(--theme-border,#141d30)] rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer focus:ring-1 focus:ring-[var(--theme-accent,#10b981)] shadow-xs"
            title="Choose Preview Typography Theme"
          >
            <option value="standard">Standard Sans</option>
            <option value="serif">Editorial Serif</option>
            <option value="newspaper">Vintage News</option>
            <option value="nord">Arctic Nord</option>
            <option value="tech">Cyber Terminal</option>
          </select>
        </div>

        {/* Display modes select segment toggler */}
        <div className="flex bg-[var(--theme-bg,#070c18)] p-1 border border-[var(--theme-border,#141d30)] rounded-xl gap-0.5">
          <button
            onClick={() => setMode("edit")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${mode === "edit" ? "bg-[var(--theme-card,#101726)] text-[var(--theme-accent,#10b981)] shadow-xs" : "text-[var(--theme-text-muted,#94a3b8)] hover:text-[var(--theme-text,#f1f5f9)]"}`}
          >
            Editor Only
          </button>
          <button
            onClick={() => setMode("split")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${mode === "split" ? "bg-[var(--theme-card,#101726)] text-[var(--theme-accent,#10b981)] shadow-xs" : "text-[var(--theme-text-muted,#94a3b8)] hover:text-[var(--theme-text,#f1f5f9)]"}`}
          >
            Split View
          </button>
          <button
            onClick={() => setMode("preview")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${mode === "preview" ? "bg-[var(--theme-card,#101726)] text-[var(--theme-accent,#10b981)] shadow-xs" : "text-[var(--theme-text-muted,#94a3b8)] hover:text-[var(--theme-text,#f1f5f9)]"}`}
          >
            Preview Only
          </button>
        </div>
      </div>
    </div>
  );
}

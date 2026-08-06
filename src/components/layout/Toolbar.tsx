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
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2 gap-3.5 select-none shrink-0">
      {/* Editor layout formatting buttons */}
      <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
        {formatButtons.map((group, gIdx) => (
          <React.Fragment key={group.group}>
            {gIdx > 0 && (
              <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1 self-center hidden sm:block" />
            )}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-950 p-1 border border-slate-200/60 dark:border-slate-800/60 rounded-xl shadow-sm">
              {group.items.map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={btn.handler}
                  title={btn.tooltip}
                  disabled={mode === "preview"}
                  className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150 cursor-pointer"
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
        <div className="hidden lg:flex items-center gap-3.5 text-xs text-slate-400 font-mono border-r border-slate-200 dark:border-slate-800 pr-4">
          <div className="flex gap-1">
            <span className="text-slate-600 dark:text-slate-500">words:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {wordCount}
            </span>
          </div>
          <div className="flex gap-1">
            <span className="text-slate-600 dark:text-slate-500">chars:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {charCount}
            </span>
          </div>
        </div>

        {/* Minimal Preview Theme Selector dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden xs:inline">
            Style:
          </span>
          <select
            value={previewStyle}
            onChange={(e) => setPreviewStyle(e.target.value as any)}
            className="text-xs font-semibold bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500/50 shadow-xs"
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
        <div className="flex bg-slate-200/75 dark:bg-slate-950/70 p-1 border border-slate-200/40 dark:border-slate-800/40 rounded-xl gap-0.5">
          <button
            onClick={() => setMode("edit")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${mode === "edit" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"}`}
          >
            Editor Only
          </button>
          <button
            onClick={() => setMode("split")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${mode === "split" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"}`}
          >
            Split View
          </button>
          <button
            onClick={() => setMode("preview")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${mode === "preview" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"}`}
          >
            Preview Only
          </button>
        </div>
      </div>
    </div>
  );
}

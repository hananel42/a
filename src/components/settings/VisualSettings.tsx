/**
 * @file VisualSettings.tsx
 * @description
 * Redesigned visual visual settings card.
 * Unblocks the Dark Mode toggle to allow switching theme seamlessly.
 * Applies comfortable modern layouts with rounded corners.
 *
 * Props:
 * - darkMode: Active visual theme flag.
 * - setDarkMode: Direct callback to toggle theme.
 * - previewStyle: Text representation of custom markdown render setting.
 * - setPreviewStyle: Direct callback to commit markdown style.
 */

import React, { useState } from "react";
import { Moon, Sun, Palette, ChevronUp, ChevronDown } from "lucide-react";

interface VisualSettingsProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  previewStyle: "standard" | "serif" | "newspaper" | "nord" | "tech";
  setPreviewStyle: (
    style: "standard" | "serif" | "newspaper" | "nord" | "tech",
  ) => void;
}

const STYLE_PRESETS = [
  {
    id: "standard" as const,
    label: "Standard UI",
    desc: "Default modern Inter sans layout",
  },
  {
    id: "serif" as const,
    label: "Editorial Serif",
    desc: "Elegant warm editorial reading type",
  },
  {
    id: "newspaper" as const,
    label: "Broadsheet Broads",
    desc: "Slightly high density news column spacing",
  },
  {
    id: "nord" as const,
    label: "Nordic Monospace",
    desc: "Chilly polar blue coding typography",
  },
  {
    id: "tech" as const,
    label: "Terminal Green",
    desc: "Glowing phosphor matrices, absolute retro focus",
  },
];

export default function VisualSettings({
  darkMode,
  setDarkMode,
  previewStyle,
  setPreviewStyle,
}: VisualSettingsProps) {
  const [defaultThinkingExpanded, setDefaultThinkingExpanded] = useState(() => {
    return localStorage.getItem("default_thinking_expanded") === "true";
  });

  const [foldToolsByDefault, setFoldToolsByDefault] = useState(() => {
    return localStorage.getItem("default_tools_collapsed") !== "false";
  });

  const handleToggleDefaultThinkingExpanded = () => {
    const newVal = !defaultThinkingExpanded;
    setDefaultThinkingExpanded(newVal);
    localStorage.setItem(
      "default_thinking_expanded",
      newVal ? "true" : "false",
    );
  };

  const handleToggleFoldTools = () => {
    const newVal = !foldToolsByDefault;
    setFoldToolsByDefault(newVal);
    localStorage.setItem("default_tools_collapsed", newVal ? "true" : "false");
  };

  return (
    <div className="space-y-4">
      {/* Dark theme toggle row */}
      <div className="flex items-center justify-between py-1">
        <div>
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            {darkMode ? (
              <Moon size={13} className="text-indigo-500" />
            ) : (
              <Sun size={13} className="text-amber-500" />
            )}
            <span>Color Theme</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Switch between dark and light workspace interface.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
        >
          {darkMode ? <Moon size={12} /> : <Sun size={12} />}
          <span>{darkMode ? "Dark Mode" : "Light Mode"}</span>
        </button>
      </div>

      {/* Initial state of thinking blocks toggle row */}
      <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-800/60">
        <div>
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <ChevronDown size={13} className="text-indigo-500" />
            <span>Default Thinking Block State</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Controls whether new Thinking / Thought Process blocks start
            expanded or collapsed.
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggleDefaultThinkingExpanded}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
            defaultThinkingExpanded
              ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
          }`}
        >
          {defaultThinkingExpanded ? (
            <ChevronDown size={12} />
          ) : (
            <ChevronUp size={12} />
          )}
          <span>{defaultThinkingExpanded ? "Expanded" : "Collapsed"}</span>
        </button>
      </div>

      {/* Fold tools by default toggle row */}
      <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-800/60">
        <div>
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <ChevronUp size={13} className="text-indigo-500" />
            <span>Collapse Tool Execution Details by Default</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            When enabled, tool execution steps are collapsed when created
            (default: collapsed).
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggleFoldTools}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
            foldToolsByDefault
              ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
          }`}
        >
          {foldToolsByDefault ? (
            <ChevronUp size={12} />
          ) : (
            <ChevronDown size={12} />
          )}
          <span>{foldToolsByDefault ? "Collapsed" : "Expanded"}</span>
        </button>
      </div>

      {/* Markdown preset selector row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
        <div>
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Palette size={13} className="text-indigo-500" />
            <span>Markdown Render Style</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Typography preset for rendering markdown document previews.
          </p>
        </div>
        <select
          value={previewStyle}
          onChange={(e) => setPreviewStyle(e.target.value as any)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer min-w-[180px]"
        >
          {STYLE_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

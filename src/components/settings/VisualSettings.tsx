/**
 * @file VisualSettings.tsx
 * @description
 * Ultra-compact Visual & Theme Settings component in English.
 * Provides a dropdown selector for all built-in & custom themes,
 * live color swatch preview, and a custom theme builder modal.
 */

import React, { useState } from "react";
import {
  Palette,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  X,
  Check,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";
import {
  AppTheme,
  getAllThemes,
  saveCustomTheme,
  deleteCustomTheme,
  getThemeById,
} from "../../utils/theme";

interface VisualSettingsProps {
  appTheme: AppTheme;
  setAppTheme: (theme: AppTheme) => void;
}

export default function VisualSettings({
  appTheme,
  setAppTheme,
}: VisualSettingsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allThemes, setAllThemes] = useState<AppTheme[]>(() => getAllThemes());

  // Form state for creating a custom theme
  const [customName, setCustomName] = useState("My Custom Theme");
  const [customMode, setCustomMode] = useState<"dark" | "light">("dark");
  const [customMarkdownStyle, setCustomMarkdownStyle] = useState<
    "standard" | "serif" | "newspaper" | "nord" | "tech"
  >("standard");
  const [customBg, setCustomBg] = useState("#0d1117");
  const [customSidebar, setCustomSidebar] = useState("#161b22");
  const [customCard, setCustomCard] = useState("#21262d");
  const [customAccent, setCustomAccent] = useState("#38bdf8");
  const [customText, setCustomText] = useState("#f0f6fc");

  // Behavior settings
  const [defaultThinkingExpanded, setDefaultThinkingExpanded] = useState(() => {
    return localStorage.getItem("default_thinking_expanded") === "true";
  });

  const [foldToolsByDefault, setFoldToolsByDefault] = useState(() => {
    return localStorage.getItem("default_tools_collapsed") !== "false";
  });

  const handleToggleDefaultThinkingExpanded = () => {
    const newVal = !defaultThinkingExpanded;
    setDefaultThinkingExpanded(newVal);
    localStorage.setItem("default_thinking_expanded", newVal ? "true" : "false");
  };

  const handleToggleFoldTools = () => {
    const newVal = !foldToolsByDefault;
    setFoldToolsByDefault(newVal);
    localStorage.setItem("default_tools_collapsed", newVal ? "true" : "false");
  };

  const handleSelectTheme = (id: string) => {
    const theme = getThemeById(id);
    setAppTheme(theme);
  };

  const handleSaveCustomTheme = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `custom-${Date.now()}`;
    const newTheme: AppTheme = {
      id,
      name: customName.trim() || "Custom Theme",
      mode: customMode,
      description: "User created custom theme.",
      markdownStyle: customMarkdownStyle,
      isCustom: true,
      previewColor: {
        bg: customBg,
        sidebar: customSidebar,
        card: customCard,
        accent: customAccent,
        text: customText,
      },
    };

    saveCustomTheme(newTheme);
    const updated = getAllThemes();
    setAllThemes(updated);
    setAppTheme(newTheme);
    setIsModalOpen(false);
  };

  const handleDeleteActiveCustomTheme = () => {
    if (!appTheme.isCustom) return;
    deleteCustomTheme(appTheme.id);
    const updated = getAllThemes();
    setAllThemes(updated);
    setAppTheme(updated[0]);
  };

  return (
    <div className="space-y-3 font-sans text-[var(--theme-text,#f1f5f9)]">
      {/* 1. Ultra-compact Dropdown Theme Selector */}
      <div className="flex flex-col gap-2 p-3 bg-[var(--theme-card,#101726)] rounded-xl border border-[var(--theme-border,#141d30)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Palette size={15} className="text-[var(--theme-accent,#10b981)] shrink-0" />
            <span className="text-xs font-bold text-[var(--theme-text,#f1f5f9)]">
              Application Theme
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Swatch preview dots */}
            <div className="flex items-center gap-1 p-1 rounded-md bg-[var(--theme-bg,#070c18)] border border-[var(--theme-border,#141d30)] shadow-xs">
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/10"
                style={{ backgroundColor: appTheme.previewColor.bg }}
                title="Background"
              />
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/10"
                style={{ backgroundColor: appTheme.previewColor.card }}
                title="Surface / Card"
              />
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: appTheme.previewColor.accent }}
                title="Accent Color"
              />
            </div>

            {/* Mode badge */}
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--theme-card-hover,#162032)] text-[var(--theme-text,#f1f5f9)] flex items-center gap-1">
              {appTheme.mode === "dark" ? <Moon size={10} /> : <Sun size={10} />}
              <span className="capitalize">{appTheme.mode}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Dropdown Select Menu */}
          <select
            value={appTheme.id}
            onChange={(e) => handleSelectTheme(e.target.value)}
            className="flex-1 h-8 px-2.5 rounded-lg text-xs font-medium bg-[var(--theme-bg,#070c18)] border border-[var(--theme-border,#141d30)] text-[var(--theme-text,#f1f5f9)] focus:outline-none focus:border-[var(--theme-accent,#10b981)] cursor-pointer"
          >
            <optgroup label="Preset Themes">
              {allThemes
                .filter((t) => !t.isCustom)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.mode})
                  </option>
                ))}
            </optgroup>
            {allThemes.some((t) => t.isCustom) && (
              <optgroup label="Custom Themes">
                {allThemes
                  .filter((t) => t.isCustom)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      ★ {t.name} ({t.mode})
                    </option>
                  ))}
              </optgroup>
            )}
          </select>

          {/* "+ Custom" Button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="h-8 px-2.5 rounded-lg bg-[var(--theme-accent,#10b981)] hover:opacity-90 text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-xs cursor-pointer shrink-0"
            title="Create Custom Theme"
          >
            <Plus size={13} />
            <span>Custom</span>
          </button>

          {/* Delete Custom Theme Button */}
          {appTheme.isCustom && (
            <button
              type="button"
              onClick={handleDeleteActiveCustomTheme}
              className="h-8 px-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shrink-0"
              title="Delete this custom theme"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Behavior Toggles */}
      <div className="space-y-1.5 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center justify-between py-1">
          <div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <ChevronDown size={13} className="text-indigo-500" />
              <span>Default Thinking Blocks State</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Expand or collapse reasoning logs by default.
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleDefaultThinkingExpanded}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
              defaultThinkingExpanded
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
            }`}
          >
            {defaultThinkingExpanded ? "Expanded" : "Collapsed"}
          </button>
        </div>

        <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-slate-800/60">
          <div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <ChevronUp size={13} className="text-indigo-500" />
              <span>Fold Tool Details</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Automatically collapse tool call step details.
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleFoldTools}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
              foldToolsByDefault
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
            }`}
          >
            {foldToolsByDefault ? "Collapsed" : "Expanded"}
          </button>
        </div>
      </div>

      {/* 3. Custom Theme Builder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Create Custom Theme
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCustomTheme} className="p-4 space-y-3.5">
              {/* Theme Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Theme Name
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Neon Cyber, Sunset Glow..."
                  className="w-full h-8 px-3 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Mode & Markdown Style */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Base Mode
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setCustomMode("dark")}
                      className={`py-1 text-[11px] font-semibold rounded-md flex items-center justify-center gap-1 cursor-pointer transition-all ${
                        customMode === "dark"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      <Moon size={11} /> Dark
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomMode("light")}
                      className={`py-1 text-[11px] font-semibold rounded-md flex items-center justify-center gap-1 cursor-pointer transition-all ${
                        customMode === "light"
                          ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      <Sun size={11} /> Light
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Typography Style
                  </label>
                  <select
                    value={customMarkdownStyle}
                    onChange={(e) => setCustomMarkdownStyle(e.target.value as any)}
                    className="w-full h-8 px-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="standard">Standard Sans</option>
                    <option value="serif">Warm Serif</option>
                    <option value="nord">Nordic Polar</option>
                    <option value="tech">Retro Terminal</option>
                  </select>
                </div>
              </div>

              {/* Color Pickers */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Color Palette
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customBg}
                      onChange={(e) => setCustomBg(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">Background</span>
                      <span className="text-[9px] font-mono text-slate-400">{customBg}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customSidebar}
                      onChange={(e) => setCustomSidebar(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">Sidebar</span>
                      <span className="text-[9px] font-mono text-slate-400">{customSidebar}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customCard}
                      onChange={(e) => setCustomCard(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">Card / Panel</span>
                      <span className="text-[9px] font-mono text-slate-400">{customCard}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customAccent}
                      onChange={(e) => setCustomAccent(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">Accent Color</span>
                      <span className="text-[9px] font-mono text-slate-400">{customAccent}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">Body Text</span>
                      <span className="text-[9px] font-mono text-slate-400">{customText}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview Card */}
              <div
                className="p-3 rounded-xl border transition-all"
                style={{
                  backgroundColor: customCard,
                  borderColor: customAccent + "40",
                  color: customText,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold" style={{ color: customAccent }}>
                    {customName || "Preview Theme"}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                    style={{ backgroundColor: customBg, color: customText }}
                  >
                    Sample Card
                  </span>
                </div>
                <p className="text-[11px] opacity-80 leading-snug">
                  This is how your custom application theme will look across the workspace, document editor, and chat.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Check size={13} /> Save & Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

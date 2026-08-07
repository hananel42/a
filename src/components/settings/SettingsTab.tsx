/**
 * @file SettingsTab.tsx
 * @description
 * Administrative parameters panel for AI Gateway endpoints, Connection Presets,
 * Security rules, Visual themes, and System reset operations.
 */

import React, { useState, useEffect } from "react";
import {
  Cpu,
  ShieldCheck,
  Check,
  Link,
  RefreshCw,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Bookmark,
  Plus,
  Save,
} from "lucide-react";
import { getEnvOpenAIKey } from "../../utils/safeEnv";
import SecuritySettings from "./SecuritySettings";
import VisualSettings from "./VisualSettings";
import { AppTheme } from "../../utils/theme";
import { ApiPreset } from "../../types/preset";
import {
  getSavedPresets,
  getActivePresetId,
  setActivePresetId,
  addOrUpdatePreset,
  deletePreset,
} from "../../utils/presetManager";

interface SettingsTabProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;
  model: string;
  setModel: (m: string) => void;
  connectionStatus: "checking" | "connected" | "offline";
  connectionErrorMessage?: string | null;
  fetchedModels?: string[];
  onRetryConnection: () => void;
  requiresConfirmationTools: string[];
  setRequiresConfirmationTools: (tools: string[]) => void;
  appTheme: AppTheme;
  setAppTheme: (theme: AppTheme) => void;
}

export default function SettingsTab({
  apiKey,
  setApiKey,
  apiBaseUrl,
  setApiBaseUrl,
  model,
  setModel,
  connectionStatus,
  connectionErrorMessage,
  fetchedModels = [],
  onRetryConnection,
  requiresConfirmationTools,
  setRequiresConfirmationTools,
  appTheme,
  setAppTheme,
}: SettingsTabProps) {
  const [localKey, setLocalKey] = useState(apiKey);
  const [localBaseUrl, setLocalBaseUrl] = useState(apiBaseUrl);
  const [localTemperature, setLocalTemperature] = useState(
    () => localStorage.getItem("agent_hub_temperature") || "0.7",
  );

  // Synchronize local input state when parent props change
  useEffect(() => {
    setLocalKey(apiKey);
  }, [apiKey]);

  useEffect(() => {
    setLocalBaseUrl(apiBaseUrl);
  }, [apiBaseUrl]);

  // Model input states
  const [showCustomModelInput, setShowCustomModelInput] = useState(false);
  const [customModelText, setCustomModelText] = useState("");

  // Feedback states
  const [savedKey, setSavedKey] = useState(false);
  const [savedBaseUrl, setSavedBaseUrl] = useState(false);
  const [savedTemp, setSavedTemp] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Connection Presets State
  const [presets, setPresets] = useState<ApiPreset[]>(() => getSavedPresets());
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(
    () => getActivePresetId(),
  );
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [presetNotice, setPresetNotice] = useState<string | null>(null);

  const handleSystemReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(localKey);
    onRetryConnection();
    setSavedKey(true);
    setTimeout(() => setSavedKey(false), 2000);
  };

  const handleSaveBaseUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setApiBaseUrl(localBaseUrl);
    onRetryConnection();
    setSavedBaseUrl(true);
    setTimeout(() => setSavedBaseUrl(false), 2000);
  };

  const handleSaveTemp = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("agent_hub_temperature", localTemperature);
    setSavedTemp(true);
    setTimeout(() => setSavedTemp(false), 2000);
  };

  const handleApplyCustomModel = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customModelText.trim();
    if (clean) {
      setModel(clean);
      setCustomModelText("");
      setShowCustomModelInput(false);
    }
  };

  // Preset Handlers
  const handleSelectPreset = (presetId: string) => {
    if (presetId === "custom") {
      setSelectedPresetId(null);
      setActivePresetId(null);
      return;
    }
    const found = presets.find((p) => p.id === presetId);
    if (!found) return;

    setLocalKey(found.apiKey);
    setApiKey(found.apiKey);

    setLocalBaseUrl(found.apiBaseUrl);
    setApiBaseUrl(found.apiBaseUrl);

    if (found.model) {
      setModel(found.model);
    }

    if (found.temperature) {
      setLocalTemperature(found.temperature);
      localStorage.setItem("agent_hub_temperature", found.temperature);
    }

    setSelectedPresetId(found.id);
    setActivePresetId(found.id);

    onRetryConnection();

    setPresetNotice(`Loaded preset: "${found.name}"`);
    setTimeout(() => setPresetNotice(null), 3000);
  };

  const handleSaveNewPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const created: ApiPreset = {
      id: `preset-${Date.now()}`,
      name: newPresetName.trim(),
      apiBaseUrl: localBaseUrl.trim(),
      apiKey: localKey.trim(),
      model: model.trim() || "gpt-4o",
      temperature: localTemperature,
    };

    const updated = addOrUpdatePreset(created);
    setPresets(updated);
    setSelectedPresetId(created.id);
    setIsSavingPreset(false);
    setNewPresetName("");

    setPresetNotice(`Saved connection profile: "${created.name}"`);
    setTimeout(() => setPresetNotice(null), 3000);
  };

  const handleUpdateSelectedPreset = () => {
    if (!selectedPresetId) return;
    const existing = presets.find((p) => p.id === selectedPresetId);
    if (!existing) return;

    const updatedPreset: ApiPreset = {
      ...existing,
      apiBaseUrl: localBaseUrl.trim(),
      apiKey: localKey.trim(),
      model: model.trim(),
      temperature: localTemperature,
    };

    const updatedList = addOrUpdatePreset(updatedPreset);
    setPresets(updatedList);
    setPresetNotice(`Updated profile: "${existing.name}"`);
    setTimeout(() => setPresetNotice(null), 3000);
  };

  const handleDeletePreset = (id: string) => {
    const existing = presets.find((p) => p.id === id);
    const updatedList = deletePreset(id);
    setPresets(updatedList);
    if (selectedPresetId === id) {
      setSelectedPresetId(null);
    }
    setPresetNotice(`Deleted profile${existing ? `: "${existing.name}"` : ""}`);
    setTimeout(() => setPresetNotice(null), 3000);
  };

  const toggleToolConfirmation = (toolName: string) => {
    if (requiresConfirmationTools.includes(toolName)) {
      setRequiresConfirmationTools(
        requiresConfirmationTools.filter((t) => t !== toolName),
      );
    } else {
      setRequiresConfirmationTools([...requiresConfirmationTools, toolName]);
    }
  };

  const hasEnvKey = !!getEnvOpenAIKey();

  return (
    <div
      id="settings-tab"
      className="flex-1 overflow-y-auto h-full bg-[var(--theme-bg,#070c18)] text-[var(--theme-text,#f1f5f9)] py-8 px-4 sm:px-8 scrollbar-thin transition-colors"
    >
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-[var(--theme-border,#141d30)] pb-5">
          <h1 className="text-xl font-bold tracking-tight text-[var(--theme-text,#f1f5f9)]">
            Workspace Settings
          </h1>
          <p className="text-[var(--theme-text-muted,#94a3b8)] mt-1 text-xs">
            Manage your AI gateway endpoints, saved connection profiles, system
            security rules, appearance, and workspace state.
          </p>
        </div>

        {/* Section 1: API Gateway & Engine */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border,#141d30)]">
            <h2 className="text-sm font-semibold text-[var(--theme-text,#f1f5f9)] flex items-center gap-2">
              <Link size={15} className="text-[var(--theme-accent,#10b981)]" />
              <span>Gateway & AI Engine</span>
            </h2>
            <button
              type="button"
              onClick={onRetryConnection}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                connectionStatus === "connected"
                  ? "bg-[var(--theme-accent-subtle,rgba(16,185,129,0.15))] text-[var(--theme-accent,#10b981)] border border-[var(--theme-accent,#10b981)]"
                  : connectionStatus === "checking"
                    ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30 animate-pulse"
                    : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-800/30"
              }`}
            >
              <RefreshCw
                size={10}
                className={
                  connectionStatus === "checking" ? "animate-spin" : ""
                }
              />
              <span>
                {connectionStatus === "connected"
                  ? "Online"
                  : connectionStatus === "checking"
                    ? "Connecting"
                    : "Offline"}
              </span>
            </button>
          </div>

          {/* Connection Profiles Bar */}
          <div className="p-4 bg-[var(--theme-card,#101726)] rounded-2xl border border-[var(--theme-border,#141d30)] space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bookmark size={16} className="text-indigo-500 shrink-0" />
                <div>
                  <label className="text-xs font-bold text-[var(--theme-text,#f1f5f9)] block">
                    Saved Connection Profiles
                  </label>
                  <span className="text-[11px] text-[var(--theme-text-muted,#94a3b8)]">
                    Save and switch between your custom connection profiles.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={selectedPresetId || "custom"}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-[var(--theme-border,#141d30)] bg-[var(--theme-bg,#070c18)] text-[var(--theme-text,#f1f5f9)] focus:outline-none focus:border-indigo-500 cursor-pointer font-medium max-w-[200px] truncate"
                >
                  <option value="custom">-- Custom / Unsaved Setup --</option>
                  {presets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.model || "Default"})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setIsSavingPreset(!isSavingPreset)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  title="Save current configuration as a named profile"
                >
                  <Plus size={13} />
                  <span>Save Profile</span>
                </button>
              </div>
            </div>

            {/* Notice Toast */}
            {presetNotice && (
              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1.5 rounded-lg flex items-center gap-2 animate-fade-in">
                <Check size={13} className="shrink-0" />
                <span>{presetNotice}</span>
              </div>
            )}

            {/* Save Preset Inline Form */}
            {isSavingPreset && (
              <form
                onSubmit={handleSaveNewPreset}
                className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2.5 animate-fade-in"
              >
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Save size={13} className="text-indigo-400" />
                  <span>Save Current Connection as New Preset</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Profile name (e.g. LM Studio, DeepSeek Cloud)"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-none focus:border-indigo-500 font-sans"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!newPresetName.trim()}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shrink-0"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSavingPreset(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Active preset actions */}
            {selectedPresetId && (
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/40 text-slate-400">
                <span className="font-mono text-[10.5px]">
                  Active Profile ID:{" "}
                  <strong className="text-slate-200">{selectedPresetId}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUpdateSelectedPreset}
                    className="text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Save size={11} />
                    <span>Update Profile</span>
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleDeletePreset(selectedPresetId)}
                    className="text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 size={11} />
                    <span>Delete Profile</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          

          <div className="space-y-4 pt-1 bg-[var(--theme-card,#101726)] p-5 rounded-2xl border border-[var(--theme-border,#141d30)] shadow-xs">
            {/* Secret API Token Row */}
            <form
              onSubmit={handleSaveKey}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="sm:w-1/3">
                <label className="text-xs font-medium text-[var(--theme-text,#f1f5f9)]">
                  Secret API Token
                </label>
                <p className="text-[11px] text-[var(--theme-text-muted,#94a3b8)]">
                  Bearer key for remote gateway authentication.
                </p>
              </div>
              <div className="flex gap-2 sm:w-2/3 max-w-md">
                <input
                  type="password"
                  placeholder="Optional for local servers"
                  value={localKey}
                  onChange={(e) => setLocalKey(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[var(--theme-border,#141d30)] bg-[var(--theme-bg,#070c18)] text-[var(--theme-text,#f1f5f9)] focus:outline-none focus:border-[var(--theme-accent,#10b981)] transition-colors"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-[var(--theme-accent,#10b981)] hover:opacity-90 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors shrink-0"
                >
                  {savedKey ? "Saved" : "Save Key"}
                </button>
              </div>
            </form>

            {/* Base URL Endpoint Row */}
            <form
              onSubmit={handleSaveBaseUrl}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/50"
            >
              <div className="sm:w-1/3">
                <label className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  Base URL Endpoint
                </label>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  OpenAI compatible API base endpoint.
                </p>
              </div>
              <div className="flex gap-2 sm:w-2/3 max-w-md">
                <input
                  type="text"
                  placeholder="e.g. http://localhost:1234/v1"
                  value={localBaseUrl}
                  onChange={(e) => setLocalBaseUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors font-mono"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors shrink-0"
                >
                  {savedBaseUrl ? "Saved" : "Apply URL"}
                </button>
              </div>
            </form>

            {/* Target Model & Temperature */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/50">
              {/* Model Selection */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Cpu size={13} className="text-indigo-500" />
                    <span>Target Model</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setShowCustomModelInput(!showCustomModelInput)
                    }
                    className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {showCustomModelInput ? "Select List" : "Custom Model"}
                  </button>
                </div>

                {showCustomModelInput ? (
                  <form
                    onSubmit={handleApplyCustomModel}
                    className="flex gap-1.5 pt-1"
                  >
                    <input
                      type="text"
                      placeholder="Enter Model ID (e.g. gpt-4o, qwen2.5-72b)"
                      value={customModelText}
                      onChange={(e) => setCustomModelText(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg cursor-pointer shrink-0"
                    >
                      Apply
                    </button>
                  </form>
                ) : (
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-mono"
                  >
                    {!model && <option value="">Select a Model...</option>}

                    {/* Custom model override if not in fetched list */}
                    {model &&
                      fetchedModels &&
                      !fetchedModels.includes(model) && (
                        <option value={model}>[Custom Model] {model}</option>
                      )}

                    {fetchedModels && fetchedModels.length > 0 ? (
                      fetchedModels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))
                    ) : (
                      <option value={model || ""} disabled={!model}>
                        {connectionStatus === "checking"
                          ? "Loading models from server..."
                          : "No models returned from endpoint"}
                      </option>
                    )}
                  </select>
                )}
              </div>

              {/* Temperature */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-800 dark:text-slate-200 block">
                  Temperature
                </label>
                <form onSubmit={handleSaveTemp} className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={localTemperature}
                    onChange={(e) => setLocalTemperature(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors shrink-0"
                  >
                    {savedTemp ? "Saved" : "Set"}
                  </button>
                </form>
              </div>
            </div>

            {hasEnvKey && (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-lg border border-emerald-200/40 dark:border-emerald-800/30 text-xs">
                <ShieldCheck size={14} className="shrink-0" />
                <span>
                  Environment API credentials active and configured in server.
                </span>
              </div>
            )}
          </div>
          {/* Endpoint Connection Error Alert */}
          {connectionStatus === "offline" && connectionErrorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs font-sans flex items-center gap-2 select-text shadow-xs">
              <AlertTriangle size={14} className="shrink-0 text-rose-500" />
              <span className="font-mono text-[11.5px] break-words">{connectionErrorMessage}</span>
            </div>
          )}
        </section>

        {/* Section 2: Appearance */}
        <section className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
          <VisualSettings
            appTheme={appTheme}
            setAppTheme={setAppTheme}
          />
        </section>

        {/* Section 3: Security & Execution Permissions */}
        <section className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
          <SecuritySettings
            requiresConfirmationTools={requiresConfirmationTools}
            onToggleTool={toggleToolConfirmation}
          />
        </section>

        {/* Section 4: System Operations & Factory Reset */}
        <section className="pt-6 border-t border-rose-200/60 dark:border-rose-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <Trash2 size={14} />
                <span>Reset & Clear System</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Permanently clear all local workspace files, custom agents, chat
                history, and restore settings to default initial state.
              </p>
            </div>
          </div>

          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <RotateCcw size={13} />
              <span>Reset & Clear Everything</span>
            </button>
          ) : (
            <div className="p-3.5 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl space-y-2.5 max-w-md">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                <AlertTriangle size={15} />
                <span>Confirm Complete System Reset?</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                This action will delete all workspace files, agent
                configurations, memory files, and saved state. This operation
                cannot be undone.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSystemReset}
                  className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Yes, Wipe Everything
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="py-1.5 px-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

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
import {
  getSavedCustomModels,
  saveCustomModel,
  removeCustomModel,
} from "../../utils/customModels";

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
  onRetryConnection: (overrideBaseUrl?: string, overrideApiKey?: string) => void;
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

  // Custom models state
  const [customModelsList, setCustomModelsList] = useState<string[]>(() =>
    getSavedCustomModels(),
  );
  const [newCustomModelInput, setNewCustomModelInput] = useState("");

  // Feedback states
  const [savedConnectionSettings, setSavedConnectionSettings] = useState(false);
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

  const handleSaveConnectionSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setApiKey(localKey);
    setApiBaseUrl(localBaseUrl);
    localStorage.setItem("agent_hub_temperature", localTemperature);
    onRetryConnection();
    setSavedConnectionSettings(true);
    setTimeout(() => setSavedConnectionSettings(false), 2500);
  };

  const handleAddCustomModel = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCustomModelInput.trim();
    if (clean) {
      const updated = saveCustomModel(clean);
      setCustomModelsList(updated);
      setModel(clean);
      setNewCustomModelInput("");
    }
  };

  const handleRemoveCustomModel = (modelToRemove: string) => {
    const updated = removeCustomModel(modelToRemove);
    setCustomModelsList(updated);
    if (model === modelToRemove) {
      setModel(updated.length > 0 ? updated[0] : "");
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

    // Instantly apply all settings without extra steps
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

    // Auto trigger connection check instantly with profile endpoint & key
    onRetryConnection(found.apiBaseUrl, found.apiKey);

    setPresetNotice(`Loaded profile: "${found.name}"`);
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
  const hasFetchedModels = fetchedModels && fetchedModels.length > 0;

  return (
    <div
      id="settings-tab"
      className="flex-1 overflow-y-auto h-full bg-[var(--theme-bg,#070c18)] text-[var(--theme-text,#f1f5f9)] py-6 px-4 sm:px-8 scrollbar-thin transition-colors"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-[var(--theme-border,#141d30)] pb-3">
          <h1 className="text-lg font-bold tracking-tight text-[var(--theme-text,#f1f5f9)]">
            Settings
          </h1>
        </div>

        {/* Section 1: API Gateway & Engine */}
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-[var(--theme-border,#141d30)]">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-muted,#94a3b8)] flex items-center gap-2">
              <Link size={14} className="text-[var(--theme-accent,#10b981)]" />
              <span>Gateway & Connection</span>
            </h2>
            <button
              type="button"
              onClick={() => onRetryConnection()}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
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
          <div className="p-3 bg-[var(--theme-card,#101726)] rounded-xl border border-[var(--theme-border,#141d30)] space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bookmark size={14} className="text-indigo-500 shrink-0" />
                <span className="text-xs font-semibold text-[var(--theme-text,#f1f5f9)]">
                  Profile
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={selectedPresetId || "custom"}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-[var(--theme-border,#141d30)] bg-[var(--theme-bg,#070c18)] text-[var(--theme-text,#f1f5f9)] focus:outline-none focus:border-indigo-500 cursor-pointer font-medium max-w-[200px] truncate"
                >
                  <option value="custom">Custom Setup</option>
                  {presets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setIsSavingPreset(!isSavingPreset)}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus size={13} />
                  <span>Save</span>
                </button>
              </div>
            </div>

            {/* Notice Toast */}
            {presetNotice && (
              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fade-in">
                <Check size={12} className="shrink-0" />
                <span>{presetNotice}</span>
              </div>
            )}

            {/* Save Preset Inline Form */}
            {isSavingPreset && (
              <form
                onSubmit={handleSaveNewPreset}
                className="p-2.5 bg-slate-900/40 border border-slate-800 rounded-lg space-y-2 animate-fade-in"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Profile name"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-none focus:border-indigo-500 font-sans"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!newPresetName.trim()}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors shrink-0"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSavingPreset(false)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg cursor-pointer transition-colors"
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
                  Active:{" "}
                  <strong className="text-indigo-400">
                    {presets.find((p) => p.id === selectedPresetId)?.name ||
                      selectedPresetId}
                  </strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUpdateSelectedPreset}
                    className="text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Save size={11} />
                    <span>Update</span>
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleDeletePreset(selectedPresetId)}
                    className="text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 size={11} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSaveConnectionSettings}
            className="space-y-3 p-3.5 bg-[var(--theme-card,#101726)] rounded-xl border border-[var(--theme-border,#141d30)]"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--theme-text,#f1f5f9)] block">
                  API Token
                </label>
                <input
                  type="password"
                  placeholder="Secret key (optional for local)"
                  value={localKey}
                  onChange={(e) => setLocalKey(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--theme-border,#141d30)] bg-[var(--theme-bg,#070c18)] text-[var(--theme-text,#f1f5f9)] focus:outline-none focus:border-[var(--theme-accent,#10b981)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--theme-text,#f1f5f9)] block">
                  Base URL
                </label>
                <input
                  type="text"
                  placeholder="http://localhost:1234/v1"
                  value={localBaseUrl}
                  onChange={(e) => setLocalBaseUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--theme-border,#141d30)] bg-[var(--theme-bg,#070c18)] text-[var(--theme-text,#f1f5f9)] focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--theme-border,#141d30)]">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--theme-text,#f1f5f9)] flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Cpu size={13} className="text-indigo-500" />
                    <span>Target Model</span>
                  </span>
                  {hasFetchedModels && (
                    <span className="text-[10px] text-emerald-500 font-normal">
                      ✓ {fetchedModels.length} models
                    </span>
                  )}
                </label>

                {hasFetchedModels ? (
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--theme-border,#141d30)] bg-[var(--theme-bg,#070c18)] text-[var(--theme-text,#f1f5f9)] focus:outline-none focus:border-indigo-500 cursor-pointer font-mono"
                  >
                    {!model && <option value="">Select Model...</option>}
                    {model && !fetchedModels.includes(model) && (
                      <option value={model}>{model} (Saved)</option>
                    )}
                    {fetchedModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-1.5">
                      <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-[var(--theme-border,#141d30)] bg-[var(--theme-bg,#070c18)] text-[var(--theme-text,#f1f5f9)] focus:outline-none focus:border-indigo-500 font-mono"
                      >
                        {!model && (
                          <option value="">Select custom model...</option>
                        )}
                        {model && !customModelsList.includes(model) && (
                          <option value={model}>{model}</option>
                        )}
                        {customModelsList.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>

                      {model && customModelsList.includes(model) && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomModel(model)}
                          className="px-2 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                          title="Remove custom model"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Add model (e.g. gpt-4o)"
                        value={newCustomModelInput}
                        onChange={(e) => setNewCustomModelInput(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-[var(--theme-border,#141d30)] bg-[var(--theme-bg,#070c18)] text-[var(--theme-text,#f1f5f9)] focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomModel}
                        disabled={!newCustomModelInput.trim()}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs rounded-lg cursor-pointer transition-colors shrink-0"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--theme-text,#f1f5f9)] block">
                  Temperature
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={localTemperature}
                  onChange={(e) => setLocalTemperature(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--theme-border,#141d30)] bg-[var(--theme-bg,#070c18)] text-[var(--theme-text,#f1f5f9)] focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {hasEnvKey && (
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1.5 rounded-lg border border-emerald-200/40 dark:border-emerald-800/30 text-[11px]">
                <ShieldCheck size={13} className="shrink-0" />
                <span>Environment API key active</span>
              </div>
            )}

            {/* Unified Save Action Button */}
            <div className="pt-2 border-t border-[var(--theme-border,#141d30)] flex items-center justify-between gap-2">
              <div className="text-xs">
                {savedConnectionSettings && (
                  <span className="flex items-center gap-1 font-medium text-emerald-500 animate-fade-in">
                    <Check size={13} />
                    <span>Saved!</span>
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <Save size={13} />
                <span>Save Settings</span>
              </button>
            </div>
          </form>

          {/* Endpoint Connection Error Alert */}
          {connectionStatus === "offline" && connectionErrorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs font-sans flex items-center gap-2 select-text shadow-xs">
              <AlertTriangle size={14} className="shrink-0 text-rose-500" />
              <span className="font-mono text-[11.5px] break-words">{connectionErrorMessage}</span>
            </div>
          )}
        </section>

        {/* Section 2: Appearance */}
        <section className="space-y-2 pt-3 border-t border-[var(--theme-border,#141d30)]">
          <VisualSettings
            appTheme={appTheme}
            setAppTheme={setAppTheme}
          />
        </section>

        {/* Section 3: Security & Execution Permissions */}
        <section className="space-y-2 pt-3 border-t border-[var(--theme-border,#141d30)]">
          <SecuritySettings
            requiresConfirmationTools={requiresConfirmationTools}
            onToggleTool={toggleToolConfirmation}
          />
        </section>

        {/* Section 4: System Operations & Factory Reset */}
        <section className="pt-4 border-t border-rose-900/30 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-rose-500 flex items-center gap-1.5">
                <Trash2 size={13} />
                <span>Reset Application</span>
              </h3>
            </div>
          </div>

          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="py-1.5 px-3 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw size={12} />
              <span>Reset & Clear All Data</span>
            </button>
          ) : (
            <div className="p-3 bg-rose-950/20 border border-rose-900/50 rounded-xl space-y-2 max-w-md">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                <AlertTriangle size={14} />
                <span>Confirm Reset?</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Deletes all workspace files, agent configurations, and saved state.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSystemReset}
                  className="py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg cursor-pointer transition-colors"
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

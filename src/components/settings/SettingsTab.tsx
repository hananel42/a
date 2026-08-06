/**
 * @file SettingsTab.tsx
 * @description
 * Redesigned administrative parameters panel.
 * Replaces old rigid dark navy backgrounds and cyber brackets with clean, modern, rounded bento cards.
 * Provides intuitive configuration controls for API base endpoints, visual themes, models, and security permissions.
 *
 * Props:
 * - apiKey: String representation of OpenAI connection secret.
 * - setApiKey: Direct parent callback to commit API key changes.
 * - apiBaseUrl: String representation of connection gateway endpoint.
 * - setApiBaseUrl: Parent callback to commit base URL changes.
 * - model: String representation of current LLM target model ID.
 * - setModel: Parent callback to select default model.
 * - connectionStatus: Connection gateway check state.
 * - onRetryConnection: Dispatch request to check connection.
 * - requiresConfirmationTools: Active sandboxed MCP tools requiring manual user confirm.
 * - setRequiresConfirmationTools: Commits updated list of protected tools.
 * - darkMode: Dark visual theme state.
 * - setDarkMode: Parent callback to toggle visual system theme.
 * - previewStyle: Text representation of custom workspace preview.
 * - setPreviewStyle: Direct callback to set visualization layout.
 */

import React, { useState, useEffect } from "react";
import {
  Key,
  Cpu,
  ShieldCheck,
  Check,
  Link,
  RefreshCw,
  Eye,
  Sparkles,
  Trash2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { getEnvOpenAIKey } from "../../utils/safeEnv";
import SecuritySettings from "./SecuritySettings";
import VisualSettings from "./VisualSettings";
import { AppTheme } from "../../utils/theme";

interface SettingsTabProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;
  model: string;
  setModel: (m: string) => void;
  connectionStatus: "checking" | "connected" | "offline";
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
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [showCustomModelInput, setShowCustomModelInput] = useState(false);
  const [customModelText, setCustomModelText] = useState("");
  const [savedKey, setSavedKey] = useState(false);
  const [savedBaseUrl, setSavedBaseUrl] = useState(false);
  const [savedTemp, setSavedTemp] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSystemReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Dynamic model fetching effect
  useEffect(() => {
    let active = true;
    const loadModels = async () => {
      if (!apiBaseUrl) return;
      setIsFetchingModels(true);
      try {
        const headers: Record<string, string> = {};
        if (apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`;
        }
        const res = await fetch(`${apiBaseUrl}/models`, { headers }).catch(
          () => null,
        );
        if (res && res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.data) && active) {
            const list = data.data.map((m: any) => m.id);
            setFetchedModels(list);
            if (list.length > 0 && (!model || !list.includes(model))) {
              setModel(list[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to discover models:", err);
      } finally {
        if (active) setIsFetchingModels(false);
      }
    };
    loadModels();
    return () => {
      active = false;
    };
  }, [apiBaseUrl, apiKey]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(localKey);
    setSavedKey(true);
    setTimeout(() => setSavedKey(false), 2000);
  };

  const handleSaveBaseUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setApiBaseUrl(localBaseUrl);
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
    if (customModelText.trim()) {
      setModel(customModelText.trim());
      setCustomModelText("");
      setShowCustomModelInput(false);
    }
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
            Manage your AI gateway endpoints, system security rules, appearance,
            and workspace state.
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

          <div className="space-y-4 pt-1 bg-[var(--theme-card,#101726)] p-5 rounded-2xl border border-[var(--theme-border,#141d30)] shadow-xs">
            {/* API Token Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
                  type="button"
                  onClick={() => {
                    setApiKey(localKey);
                    setSavedKey(true);
                    setTimeout(() => setSavedKey(false), 2000);
                  }}
                  className="px-3.5 py-1.5 bg-[var(--theme-accent,#10b981)] hover:opacity-90 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors shrink-0"
                >
                  {savedKey ? "Saved" : "Save"}
                </button>
              </div>
            </div>

            {/* Base URL Endpoint Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/50">
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
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => {
                    setApiBaseUrl(localBaseUrl);
                    setSavedBaseUrl(true);
                    setTimeout(() => setSavedBaseUrl(false), 2000);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors shrink-0"
                >
                  {savedBaseUrl ? "Saved" : "Apply"}
                </button>
              </div>
            </div>

            {/* Model Target & Temperature */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/50">
              {/* Model */}
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
                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="Model ID"
                      value={customModelText}
                      onChange={(e) => setCustomModelText(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomModel}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg cursor-pointer shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                ) : (
                  <select
                    value={connectionStatus === "connected" ? model : ""}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={isFetchingModels || fetchedModels.length === 0}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:opacity-60"
                  >
                    {isFetchingModels ? (
                      <option>Loading models...</option>
                    ) : fetchedModels.length === 0 ? (
                      <option value="">None (Disconnected)</option>
                    ) : (
                      fetchedModels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>

              {/* Temperature */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-800 dark:text-slate-200 block">
                  Temperature
                </label>
                <div className="flex gap-2">
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
                    type="button"
                    onClick={() => {
                      localStorage.setItem(
                        "agent_hub_temperature",
                        localTemperature,
                      );
                      setSavedTemp(true);
                      setTimeout(() => setSavedTemp(false), 2000);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors shrink-0"
                  >
                    {savedTemp ? "Saved" : "Set"}
                  </button>
                </div>
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

        {/* Section 4: System Operations & Factory Reset (Bottom Danger Zone) */}
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

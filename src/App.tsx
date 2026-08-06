import React, { useState, useEffect } from "react";
import {
  FileText,
  MessageSquare,
  Users,
  Settings,
  Sparkles,
} from "lucide-react";

import { useWorkspace } from "./hooks/useWorkspace";
import { useAgentSync } from "./hooks/useAgentSync";
import { useConnectionCheck } from "./hooks/useConnectionCheck";
import WorkspaceTab from "./components/workspace/WorkspaceTab";
import ChatTab from "./components/chat/ChatTab";
import AgentsTab from "./components/agents/AgentsTab";
import SettingsTab from "./components/settings/SettingsTab";
import NotificationToast from "./components/layout/NotificationToast";

export default function App() {
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [activeTab, setActiveTab] = useState<
    "workspace" | "chat" | "agents" | "settings"
  >("chat");

  // Load API configurations from localStorage or preset defaults
  const [apiKey, setApiKey] = useState<string>(
    () => localStorage.getItem("agent_hub_openai_key") || "",
  );
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(
    () =>
      localStorage.getItem("agent_hub_api_base_url") ||
      "http://localhost:1234/v1",
  );
  const [model, setModel] = useState<string>(
    () => localStorage.getItem("agent_hub_model") || "",
  );

  // 1. Dark Mode configuration (default to true / twilight dark style)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("agent_hub_dark_mode");
    return saved !== "false";
  });

  useEffect(() => {
    localStorage.setItem("agent_hub_dark_mode", String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // 2. Markdown visual theme configuration
  const [previewStyle, setPreviewStyle] = useState<
    "standard" | "serif" | "newspaper" | "nord" | "tech"
  >(() => {
    return (
      (localStorage.getItem("agent_hub_preview_style") as any) || "standard"
    );
  });

  const handleSetPreviewStyle = (
    style: "standard" | "serif" | "newspaper" | "nord" | "tech",
  ) => {
    setPreviewStyle(style);
    localStorage.setItem("agent_hub_preview_style", style);
  };

  // 3. Sandboxed tools confirmation list configuration
  const [requiresConfirmationTools, setRequiresConfirmationTools] = useState<
    string[]
  >(() => {
    const saved = localStorage.getItem("agent_hub_confirm_tools");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return ["run_python", "write_file", "create_agent"];
  });

  const handleSetRequiresConfirmationTools = (tools: string[]) => {
    setRequiresConfirmationTools(tools);
    localStorage.setItem("agent_hub_confirm_tools", JSON.stringify(tools));
  };

  const showNotification = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Sync state functions with local memory
  const handleSetApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("agent_hub_openai_key", key);
  };

  const handleSetApiBaseUrl = (url: string) => {
    setApiBaseUrl(url);
    localStorage.setItem("agent_hub_api_base_url", url);
  };

  const handleSetModel = (m: string) => {
    setModel(m);
    localStorage.setItem("agent_hub_model", m);
  };

  // Connection Status hook
  const connection = useConnectionCheck(apiBaseUrl, apiKey);

  // Synchronize model state with API-fetched models only if no model is selected
  useEffect(() => {
    if (connection.models && connection.models.length > 0) {
      if (!model) {
        handleSetModel(connection.models[0]);
      }
    }
  }, [connection.models]);

  // Initialize Core Virtual & Physical Workspace FileSystem Hook
  const workspace = useWorkspace(showNotification);

  // Initialize Core Multi-Agent Synchronizer Hook
  const agentSync = useAgentSync(workspace, showNotification);

  return (
    <div
      id="app-agentic-hub"
      className="flex flex-col h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 overflow-hidden font-sans transition-colors duration-200 animate-fade-in"
    >
      {/* 1. TOP HUB HEADER BAR */}
      <header className="h-12 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/40 backdrop-blur-md px-4 flex items-center justify-between shrink-0 select-none z-30 transition-colors">
        {/* Left side: branding */}
        <div className="flex items-center gap-2">
          <div className="w-7.5 h-7.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
            <Sparkles size={14} className="animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-wide uppercase text-slate-800 dark:text-white font-sans flex items-center gap-1.5">
              <span>Agentic Hub</span>
              <span className="text-[9px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded-lg border border-indigo-200/45 dark:border-indigo-900/30">
                v3.0
              </span>
            </span>
          </div>
        </div>

        {/* Center: Main navigation tabs */}
        <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
          {[
            {
              id: "chat" as const,
              label: "Chat",
              icon: <MessageSquare size={13} />,
            },
            {
              id: "workspace" as const,
              label: "Workspace",
              icon: <FileText size={13} />,
            },
            {
              id: "agents" as const,
              label: "Agents",
              icon: <Users size={13} />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800 shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Right side: Model status, Connection status, and Settings */}
        <div className="flex items-center gap-2 text-xs font-sans">
          {/* Model Selection Dropdown */}
          <div className="flex items-center gap-1.5 px-2.5 h-7.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 shadow-2xs">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-sans">
              MODEL:
            </span>
            <select
              value={model}
              onChange={(e) => handleSetModel(e.target.value)}
              className="bg-transparent border-none text-slate-800 dark:text-white font-bold outline-none cursor-pointer text-xs pr-1 bg-white dark:bg-slate-950"
            >
              {connection.models && connection.models.length > 0 ? (
                connection.models.map((m) => (
                  <option
                    key={m}
                    value={m}
                    className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans"
                  >
                    {m}
                  </option>
                ))
              ) : (
                <option
                  value=""
                  className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans"
                >
                  None (No models detected)
                </option>
              )}
            </select>
          </div>

          {/* Connection Status Indicator */}
          <div
            onClick={() => connection.checkConnection()}
            className={`flex items-center gap-2 px-3 h-7.5 rounded-xl border cursor-pointer select-none transition-all active:scale-95 shadow-2xs ${
              connection.status === "connected"
                ? "bg-white dark:bg-slate-950 border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                : connection.status === "checking"
                  ? "bg-white dark:bg-slate-950 border-amber-200 dark:border-amber-900/30 text-amber-500 dark:text-amber-400 animate-pulse"
                  : "bg-white dark:bg-slate-950 border-red-200 dark:border-red-900/30 text-red-500 dark:text-red-400"
            }`}
            title={`API Base: ${apiBaseUrl} (Click to recheck)`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connection.status === "connected"
                  ? "bg-emerald-500"
                  : connection.status === "checking"
                    ? "bg-amber-400 animate-pulse"
                    : "bg-red-400"
              }`}
            />
            <span className="font-bold uppercase tracking-widest text-[9px]">
              {connection.status === "connected"
                ? "Online"
                : connection.status === "checking"
                  ? "Pinging"
                  : "Offline"}
            </span>
          </div>

          {/* Settings Tab */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
            <button
              onClick={() =>
                setActiveTab(activeTab === "settings" ? "chat" : "settings")
              }
              className={`p-1 rounded-lg transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800 shadow-2xs"
                  : "text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
              title="Platform Settings"
            >
              <Settings size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. TABBED MODULE ROUTING DISPLAY */}
      <main className="flex-1 min-h-0 overflow-hidden relative flex">
        {activeTab === "chat" && (
          <ChatTab
            agents={agentSync.agents}
            apiKey={apiKey}
            apiBaseUrl={apiBaseUrl}
            model={model}
            workspaceItems={workspace.items}
            createWorkspaceFile={workspace.createFile}
            createWorkspaceFolder={workspace.createFolder}
            updateWorkspaceFileContent={workspace.updateFileContent}
            deleteWorkspaceItem={workspace.deleteItem}
            processUploadedFiles={workspace.processUploadedFiles}
            onCreateAgent={agentSync.createAgent}
            requiresConfirmationTools={requiresConfirmationTools}
            previewStyle={previewStyle}
            onOpenCreateAgent={() => setActiveTab("agents")}
          />
        )}

        {activeTab === "workspace" && (
          <WorkspaceTab
            workspace={workspace}
            showNotification={showNotification}
          />
        )}

        {activeTab === "agents" && (
          <AgentsTab
            agents={agentSync.agents}
            fetchedModels={connection.models}
            workspaceItems={workspace.items}
            updateWorkspaceFileContent={workspace.updateFileContent}
            createWorkspaceFile={workspace.createFile}
            createWorkspaceFolder={workspace.createFolder}
            onCreateAgent={agentSync.createAgent}
            onUpdateAgent={agentSync.updateAgent}
            onDeleteAgent={agentSync.deleteAgent}
            onSelectAgent={(agentId) => {
              window.dispatchEvent(
                new CustomEvent("select-agent-session", {
                  detail: { agentId },
                }),
              );
              setActiveTab("chat");
            }}
          />
        )}

        {activeTab === "settings" && (
          <SettingsTab
            apiKey={apiKey}
            setApiKey={handleSetApiKey}
            apiBaseUrl={apiBaseUrl}
            setApiBaseUrl={handleSetApiBaseUrl}
            model={model}
            setModel={handleSetModel}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            previewStyle={previewStyle}
            setPreviewStyle={handleSetPreviewStyle}
            requiresConfirmationTools={requiresConfirmationTools}
            setRequiresConfirmationTools={handleSetRequiresConfirmationTools}
            connectionStatus={connection.status}
            onRetryConnection={connection.checkConnection}
          />
        )}
      </main>

      {toast && (
        <NotificationToast toast={toast} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

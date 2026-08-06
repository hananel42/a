/**
 * @file ChatSidebar.tsx
 * @description
 * Sleek, modern, and minimalist sidebar component for the conversational agent workspace.
 * Features:
 * - Fluid collapse/expand functionality with smooth transition.
 * - Dynamic agent selection list with interactive states.
 * - Auto-triggering of new sessions when shifting active agent under empty threads.
 * - Modern, beautiful minimalist rounded design supporting both light and dark mode.
 *
 * API / Props:
 * - `sessions`: ChatSession[] - Array of active chat session threads.
 * - `activeSessionId`: string | null - Currently loaded thread ID.
 * - `setActiveSessionId`: (id: string | null) => void - Setter for active thread.
 * - `agents`: Agent[] - Complete catalog of available system and custom agents.
 * - `onDeleteSession`: (id: string) => void - Handler to decommission a session.
 * - `onCreateSession`: (agentId: string) => void - Handler to spawn a new session.
 * - `activeAgentId`: string - Target active agent configuration ID.
 * - `setActiveAgentId`: (id: string) => void - Setter to switch target agent.
 * - `isCollapsed`: boolean - Controlled sidebar compression state.
 * - `onToggleCollapse`: () => void - Dispatch event to toggle visual mode.
 */

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Download,
  Upload,
  Check,
  X,
  Users,
  Bot,
  Crown,
  Briefcase,
  Code2,
  Folder,
} from "lucide-react";
import { Agent, ChatSession } from "../../types/agent";
import { renderAgentAvatar } from "./ChatMessageList";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  agents: Agent[];
  onDeleteSession: (id: string) => void;
  onCreateSession: (agentId: string) => void;
  onSelectSession: (sessionId: string) => void;
  activeAgentId: string;
  setActiveAgentId: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  setActiveSessionId,
  agents,
  onDeleteSession,
  onCreateSession,
  onSelectSession,
  activeAgentId,
  setActiveAgentId,
  isCollapsed,
  onToggleCollapse,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeAgent = agents.find((a) => a.id === activeAgentId) || agents[0];

  const filteredSessions = sessions.filter((session) => {
    const titleMatch = session.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const agentName = agents.find((a) => a.id === session.agentId)?.name || "";
    return (
      titleMatch || agentName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleAgentSelect = (agentId: string) => {
    setActiveAgentId(agentId);
    // If there are no sessions, automatically instantiate a new conversation with this agent
    if (sessions.length === 0) {
      onCreateSession(agentId);
    }
  };

  React.useEffect(() => {
    const handleSelectAgent = (e: Event) => {
      const customEvent = e as CustomEvent<{ agentId: string }>;
      const agentId = customEvent.detail?.agentId;
      if (agentId) {
        handleAgentSelect(agentId);
      }
    };
    window.addEventListener("select-agent-session", handleSelectAgent);
    return () => {
      window.removeEventListener("select-agent-session", handleSelectAgent);
    };
  }, [sessions]);

  const handleExportAll = () => {
    try {
      const dataStr = JSON.stringify(sessions, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `agent_chats_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setErrorMsg("Export failed.");
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const handleImportClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        if (Array.isArray(imported)) {
          const key = "agentic_hub_chats_v2";
          const existing = localStorage.getItem(key);
          const current = existing ? JSON.parse(existing) : [];
          localStorage.setItem(key, JSON.stringify([...imported, ...current]));
          window.location.reload();
        } else {
          setErrorMsg("Import must be a JSON array.");
          setTimeout(() => setErrorMsg(null), 3000);
        }
      } catch {
        setErrorMsg("Failed to parse file.");
        setTimeout(() => setErrorMsg(null), 3000);
      }
    };
    input.click();
  };

  if (isCollapsed) {
    return (
      <aside
        id="chat-sidebar-collapsed"
        className="w-16 bg-[var(--theme-sidebar,#0b101f)] border-r border-[var(--theme-border,#141d30)] h-full flex flex-col items-center py-4 select-none shrink-0 transition-all duration-300"
      >
        {/* Toggle Expand button */}
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-[var(--theme-card-hover,#162032)] text-[var(--theme-text-muted,#94a3b8)] hover:text-[var(--theme-text,#f1f5f9)] rounded-xl transition-all cursor-pointer mb-6 shadow-xs border border-[var(--theme-border,#141d30)] bg-[var(--theme-card,#101726)]"
          title="Expand sidebar"
        >
          <ChevronRight size={16} />
        </button>

        {/* Short Agents selection */}
        <div className="flex flex-col gap-2.5 items-center w-full flex-1 overflow-y-auto scrollbar-none">
          <span className="text-[9px] font-bold text-[var(--theme-text-muted,#94a3b8)] uppercase tracking-widest font-mono select-none">
            AGENTS
          </span>
          {agents.map((ag) => {
            const isSelected = ag.id === activeAgentId;
            return (
              <button
                key={ag.id}
                onClick={() => handleAgentSelect(ag.id)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[var(--theme-accent-subtle,rgba(16,185,129,0.15))] border border-[var(--theme-accent,#10b981)] text-[var(--theme-accent,#10b981)] scale-105 shadow-xs"
                    : "bg-[var(--theme-card,#101726)] border border-[var(--theme-border,#141d30)] text-[var(--theme-text-muted,#94a3b8)] hover:text-[var(--theme-text,#f1f5f9)] hover:scale-105"
                }`}
                title={ag.name}
              >
                {renderAgentAvatar(ag.avatar, ag.name)}
              </button>
            );
          })}

          <div className="w-8 h-px bg-[var(--theme-border,#141d30)] my-4" />

          {/* New Thread trigger shortcut */}
          <button
            onClick={() => onCreateSession(activeAgentId)}
            className="w-10 h-10 rounded-full bg-[var(--theme-accent,#10b981)] hover:opacity-90 text-white flex items-center justify-center cursor-pointer transition-transform hover:scale-110 shadow-xs"
            title="New Conversation"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Utility tooltips */}
        <div className="flex flex-col gap-3 mt-auto pt-4">
          <button
            onClick={handleExportAll}
            className="p-2 hover:bg-[var(--theme-card-hover,#162032)] text-[var(--theme-text-muted,#94a3b8)] hover:text-[var(--theme-text,#f1f5f9)] rounded-xl transition-colors cursor-pointer"
            title="Export Chats"
          >
            <Download size={15} />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      id="chat-sidebar-full"
      className="w-[280px] bg-[var(--theme-sidebar,#0b101f)] border-r border-[var(--theme-border,#141d30)] h-full flex flex-col text-[var(--theme-text-muted,#94a3b8)] font-sans select-none shrink-0 overflow-hidden transition-all duration-300"
    >
      {/* 1. Header with Collapse button */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-[var(--theme-border,#141d30)] bg-[var(--theme-card,#101726)]">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 bg-[var(--theme-accent,#10b981)] rounded-full shadow-xs" />
          <span className="text-sm font-bold text-[var(--theme-text,#f1f5f9)] tracking-wide font-sans">
            Conversational Hub
          </span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-[var(--theme-card-hover,#162032)] text-[var(--theme-text-muted,#94a3b8)] hover:text-[var(--theme-text,#f1f5f9)] rounded-lg transition-colors cursor-pointer"
          title="Collapse sidebar"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-900/30 px-4 py-2 text-red-500 dark:text-red-400 text-xs">
          {errorMsg}
        </div>
      )}

      {/* 2. Scrollable sidebar body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        {/* Modern Interactive Agent Dropdown Selector */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[var(--theme-text-muted,#94a3b8)] uppercase tracking-widest block">
            Active Agent
          </label>
          <div className="relative">
            <select
              value={activeAgentId}
              onChange={(e) => handleAgentSelect(e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 bg-[var(--theme-card,#101726)] border border-[var(--theme-border,#141d30)] rounded-xl text-xs font-semibold text-[var(--theme-text,#f1f5f9)] focus:outline-none focus:border-[var(--theme-accent,#10b981)] transition-colors shadow-2xs appearance-none cursor-pointer"
            >
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--theme-text-muted,#94a3b8)]">
              <Users size={12} />
            </div>
          </div>
          {activeAgent && (
            <div className="p-3 bg-[var(--theme-accent-subtle,rgba(16,185,129,0.15))] border border-[var(--theme-border,#141d30)] rounded-xl text-[11px] text-[var(--theme-text-muted,#94a3b8)] leading-normal">
              <span className="font-bold text-[var(--theme-text,#f1f5f9)] block mb-0.5">
                {activeAgent.name}
              </span>
              {activeAgent.description}
            </div>
          )}
        </div>

        {/* 3. New Conversation Pill Button */}
        <button
          onClick={() => onCreateSession(activeAgentId)}
          className="w-full flex items-center justify-center gap-2 bg-[var(--theme-accent,#10b981)] hover:opacity-90 text-white py-2 rounded-xl font-bold transition-colors text-xs cursor-pointer shadow-xs"
        >
          <Plus size={14} className="stroke-[3px]" />
          New Conversation
        </button>

        {/* 4. Threads Search / Filter Input */}
        <div className="relative">
          <Search
            size={12}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted,#94a3b8)]"
          />
          <input
            type="text"
            placeholder="Search threads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--theme-card,#101726)] border border-[var(--theme-border,#141d30)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[var(--theme-text,#f1f5f9)] placeholder-[var(--theme-text-muted,#94a3b8)] focus:outline-none focus:border-[var(--theme-accent,#10b981)] transition-colors shadow-xs"
          />
        </div>

        {/* 5. Historical Sessions List */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-[var(--theme-text-muted,#94a3b8)] uppercase tracking-wider block">
            History
          </span>
          <div className="flex flex-col gap-1">
            {filteredSessions.length === 0 ? (
              <div className="text-xs text-[var(--theme-text-muted,#94a3b8)] italic px-2">
                No threads found.
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`group relative flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer border ${
                    activeSessionId === session.id
                      ? "bg-[var(--theme-card,#101726)] border-[var(--theme-accent,#10b981)] text-[var(--theme-text,#f1f5f9)] shadow-xs"
                      : "border-transparent hover:bg-[var(--theme-card-hover,#162032)] hover:text-[var(--theme-text,#f1f5f9)]"
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-6 w-full">
                    <span className="text-xs font-semibold truncate leading-tight flex items-center gap-1.5">
                      <MessageSquare
                        size={11}
                        className={
                          activeSessionId === session.id
                            ? "text-[var(--theme-accent,#10b981)]"
                            : "text-[var(--theme-text-muted,#94a3b8)]"
                        }
                      />
                      {session.title || "Untitled Session"}
                    </span>
                    <span className="text-[9px] text-[var(--theme-text-muted,#94a3b8)] mt-0.5 truncate">
                      {agents.find((a) => a.id === session.agentId)?.name ||
                        "Unknown Agent"}
                    </span>
                  </div>

                  {sessionToDelete === session.id ? (
                    <div className="absolute right-2 flex items-center gap-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 rounded-lg shadow-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                          setSessionToDelete(null);
                        }}
                        className="p-1 hover:bg-green-100 dark:hover:bg-green-950/20 text-green-600 rounded-md"
                        title="Confirm"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToDelete(null);
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-950/20 text-red-500 rounded-md"
                        title="Cancel"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSessionToDelete(session.id);
                      }}
                      className="absolute right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-950/10 text-slate-400 hover:text-red-500 transition-all rounded-lg cursor-pointer"
                      title="Delete thread"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 6. Footer Utility Actions */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-950/40">
        <button
          onClick={handleExportAll}
          className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer shadow-2xs"
        >
          <Download size={12} /> Export
        </button>
        <button
          onClick={handleImportClick}
          className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer shadow-2xs"
        >
          <Upload size={12} /> Import
        </button>
      </div>
    </aside>
  );
}

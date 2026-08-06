/**
 * @file AgentsTab.tsx
 * @description
 * Redesigned administrative hub for managing and provisioning expert computational profiles.
 * Replaces old cyber rigid square borders with a comfortable, sleek, high-end minimalist bento list.
 * Includes a fully functional filterable Search Box.
 *
 * Props:
 * - agents: Global catalog list of systems and custom agents.
 * - onCreateAgent: Callback to provision new custom profiles.
 * - onUpdateAgent: Callback to apply custom parameters on existing agents.
 * - onDeleteAgent: Callback to decommission custom profiles.
 */

import React, { useState } from "react";
import {
  UserPlus,
  Trash2,
  Wrench,
  Shield,
  Edit,
  Search,
  Check,
  X,
  ShieldAlert,
  MessageSquare,
} from "lucide-react";
import { Agent } from "../../types/agent";
import { WorkspaceItem } from "../../types/workspace";
import AgentForm from "./AgentForm";
import { renderAgentAvatar } from "../chat/ChatMessageList";

interface AgentsTabProps {
  agents: Agent[];
  fetchedModels?: string[];
  workspaceItems?: WorkspaceItem[];
  updateWorkspaceFileContent?: (id: string, content: string) => Promise<void>;
  createWorkspaceFile?: (
    name: string,
    parentId: string | null,
    content?: string,
  ) => Promise<string>;
  createWorkspaceFolder?: (
    name: string,
    parentId: string | null,
  ) => Promise<string>;
  onCreateAgent: (
    name: string,
    desc: string,
    instructions: string,
    tools: string[],
    avatar: string,
    allowedReadPaths: string[],
    allowedWritePaths: string[],
    defaultModel?: string,
    promptConfig?: any,
    examplePrompts?: string[],
    allowAgentFolderAccess?: boolean,
  ) => void;
  onUpdateAgent: (id: string, updatedFields: Partial<Agent>) => void;
  onDeleteAgent: (id: string) => void;
  onSelectAgent?: (id: string) => void;
}

export default function AgentsTab({
  agents,
  fetchedModels = [],
  workspaceItems = [],
  updateWorkspaceFileContent,
  createWorkspaceFile,
  createWorkspaceFolder,
  onCreateAgent,
  onUpdateAgent,
  onDeleteAgent,
  onSelectAgent,
}: AgentsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreateSubmit = (data: {
    name: string;
    description: string;
    instructions: string;
    tools: string[];
    avatar: string;
    allowedReadPaths: string[];
    allowedWritePaths: string[];
    defaultModel?: string;
    promptConfig?: any;
    examplePrompts?: string[];
    allowAgentFolderAccess?: boolean;
  }) => {
    onCreateAgent(
      data.name,
      data.description,
      data.instructions,
      data.tools,
      data.avatar,
      data.allowedReadPaths,
      data.allowedWritePaths,
      data.defaultModel,
      data.promptConfig,
      data.examplePrompts,
      data.allowAgentFolderAccess,
    );
    setShowAddForm(false);
  };

  const handleEditSubmit = (data: {
    name: string;
    description: string;
    instructions: string;
    tools: string[];
    avatar: string;
    allowedReadPaths: string[];
    allowedWritePaths: string[];
    defaultModel?: string;
    promptConfig?: any;
    examplePrompts?: string[];
    allowAgentFolderAccess?: boolean;
  }) => {
    if (!editingAgent) return;
    onUpdateAgent(editingAgent.id, {
      description: data.description,
      instructions: data.instructions,
      avatar: data.avatar,
      defaultModel: data.defaultModel,
      promptConfig: data.promptConfig,
      examplePrompts: data.examplePrompts,
      permissions: {
        ...editingAgent.permissions,
        allowedTools: data.tools,
        allowedReadPaths: data.allowedReadPaths,
        allowedWritePaths: data.allowedWritePaths,
        allowAgentFolderAccess: data.allowAgentFolderAccess,
      },
    });
    setEditingAgent(null);
  };

  // Filter agents comfortably by name, ID, or description
  const filteredAgents = agents.filter((ag) => {
    const term = searchQuery.toLowerCase();
    return (
      ag.name.toLowerCase().includes(term) ||
      ag.id.toLowerCase().includes(term) ||
      ag.description.toLowerCase().includes(term) ||
      ag.permissions.allowedTools.some((t) => t.toLowerCase().includes(term))
    );
  });

  return (
    <div
      id="agents-tab"
      className="flex-1 overflow-y-auto h-full bg-slate-50 dark:bg-slate-950 p-6 md:p-8 transition-colors"
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hub Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
              Computational Agents Catalog
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs font-sans max-w-xl">
              Click on any agent to edit its details, system instructions, final
              prompt template, memories, and permissions.
            </p>
          </div>

          {!showAddForm && !editingAgent && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold font-sans rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm shadow-indigo-600/10"
            >
              <UserPlus size={14} />
              <span>Create Agent</span>
            </button>
          )}
        </div>

        {showAddForm ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">
                New Custom Profile
              </span>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                ← Back to catalog
              </button>
            </div>
            <AgentForm
              fetchedModels={fetchedModels}
              workspaceItems={workspaceItems}
              createWorkspaceFolder={createWorkspaceFolder}
              createWorkspaceFile={createWorkspaceFile}
              updateWorkspaceFileContent={updateWorkspaceFileContent}
              onSubmit={handleCreateSubmit}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        ) : editingAgent ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-sans">
                  Agent Editor: {editingAgent.name}
                </span>
              </div>
              <button
                onClick={() => setEditingAgent(null)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                ← Back to catalog
              </button>
            </div>
            <AgentForm
              initialAgent={editingAgent}
              fetchedModels={fetchedModels}
              workspaceItems={workspaceItems}
              createWorkspaceFolder={createWorkspaceFolder}
              createWorkspaceFile={createWorkspaceFile}
              updateWorkspaceFileContent={updateWorkspaceFileContent}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditingAgent(null)}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filter/Search input */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:max-w-md">
                <Search
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Filter agents by name, role, tools, boundaries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-2xs"
                />
              </div>
              <div className="text-[11px] text-slate-400 font-mono font-semibold">
                SHOWING {filteredAgents.length} OF {agents.length} AGENTS
              </div>
            </div>

            {/* Bento Cards layout */}
            {filteredAgents.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <ShieldAlert
                  className="mx-auto text-slate-400 mb-2"
                  size={28}
                />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  No matching computational profiles found.
                </p>
                <p className="text-[11px] text-slate-400 mt-1 font-sans">
                  Try searching with a different term or clear the filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredAgents.map((ag) => {
                  const readPaths = ag.permissions.allowedReadPaths ||
                    ag.permissions.allowedPaths || ["/"];
                  const writePaths = ag.permissions.allowedWritePaths ||
                    ag.permissions.allowedPaths || ["/"];

                  return (
                    <div
                      key={ag.id}
                      onClick={() => setEditingAgent(ag)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800 transition-all duration-200 cursor-pointer group"
                    >
                      <div>
                        {/* Card Header */}
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300 group-hover:border-indigo-500/50 transition-colors">
                              {renderAgentAvatar(ag.avatar, ag.name)}
                            </div>
                            <div>
                              <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                <span>{ag.name}</span>
                                {ag.isDefault && (
                                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 border border-emerald-200/50 dark:border-emerald-900/30 rounded-lg">
                                    SYSTEM
                                  </span>
                                )}
                              </h2>
                              <span className="text-[9.5px] font-mono text-slate-400 block mt-0.5">
                                ID: {ag.id}
                              </span>
                            </div>
                          </div>

                          <div
                            className="flex items-center gap-1.5 select-none shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {onSelectAgent && (
                              <button
                                onClick={() => onSelectAgent(ag.id)}
                                className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white border border-indigo-200/60 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-300 text-[10.5px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Start Chat Session"
                              >
                                <MessageSquare size={12} />
                                <span>Chat</span>
                              </button>
                            )}

                            {!ag.isDefault &&
                              (agentToDelete === ag.id ? (
                                <div className="flex items-center gap-1 bg-white dark:bg-slate-950 border border-red-200 dark:border-red-900/40 p-1 rounded-xl shadow-xs">
                                  <button
                                    onClick={() => {
                                      onDeleteAgent(ag.id);
                                      setAgentToDelete(null);
                                    }}
                                    className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 rounded-lg cursor-pointer"
                                    title="Confirm Decommission"
                                  >
                                    <Check size={12} />
                                  </button>
                                  <button
                                    onClick={() => setAgentToDelete(null)}
                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer"
                                    title="Cancel"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setAgentToDelete(ag.id)}
                                  className="p-1.5 border border-red-200/50 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors cursor-pointer"
                                  title="Decommission Agent"
                                >
                                  <Trash2 size={12} />
                                </button>
                              ))}
                          </div>
                        </div>

                        {/* Description text */}
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans min-h-[36px]">
                          {ag.description}
                        </p>

                        {/* Custom Model & Prompt Overrides Indicator */}
                        <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                          <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40 font-semibold">
                            Model: {ag.defaultModel || "Inherit Global"}
                          </span>
                          {ag.promptConfig?.systemPromptTemplate && (
                            <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40 font-semibold">
                              Custom Prompt Template
                            </span>
                          )}
                        </div>

                        {/* Sandboxed directory bounds */}
                        <div className="mt-4 grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950/60 p-3.5 border border-slate-200/50 dark:border-slate-800/60 text-[10.5px] font-mono rounded-xl">
                          <div>
                            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[9px]">
                              Read Bounds
                            </span>
                            <div
                              className="text-slate-600 dark:text-slate-300 font-semibold mt-1 truncate"
                              title={readPaths.join(", ")}
                            >
                              {readPaths.join(", ")}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[9px]">
                              Write Bounds
                            </span>
                            <div
                              className="text-indigo-600 dark:text-indigo-400 font-semibold mt-1 truncate"
                              title={writePaths.join(", ")}
                            >
                              {writePaths.join(", ")}
                            </div>
                          </div>
                        </div>

                        {/* Allowed Tools */}
                        <div className="mt-4 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-sans flex items-center gap-1.5 mb-2">
                            <Wrench size={10} />
                            <span>
                              Authorized Tools (
                              {ag.permissions.allowedTools.length})
                            </span>
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {ag.permissions.allowedTools.map((t) => (
                              <span
                                key={t}
                                className="text-[9.5px] font-mono font-medium text-slate-600 dark:text-slate-300 px-2 py-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Footer modified timestamp */}
                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                        <span>Click card to view details & edit</span>
                        <span className="flex items-center gap-1">
                          <Shield size={10} className="text-indigo-500" />
                          <span>SANDBOX GUARDIAN ACTIVE</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

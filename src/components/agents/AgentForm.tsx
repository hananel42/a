/**
 * @file AgentForm.tsx
 * @description Master form component for creating or editing AI agents with clean separation
 * into Normal Settings, Advanced Settings, and Permissions/Paths.
 */

import React, { useEffect, useState } from "react";
import { Settings, Sliders, Shield, Wrench, Check } from "lucide-react";
import { Agent, AgentPromptConfig } from "../../types/agent";
import { WorkspaceItem } from "../../types/workspace";
import AgentNormalSettings from "./AgentNormalSettings";
import AgentAdvancedSettings from "./AgentAdvancedSettings";
import AgentPathPermissions from "./AgentPathPermissions";
import { getDefaultSystemPromptTemplate } from "../../utils/promptBuilder";

interface AgentFormProps {
  initialAgent?: Agent;
  fetchedModels?: string[];
  workspaceItems?: WorkspaceItem[];
  createWorkspaceFolder?: (
    name: string,
    parentId: string | null,
  ) => Promise<string>;
  createWorkspaceFile?: (
    name: string,
    parentId: string | null,
    content?: string,
  ) => Promise<string>;
  updateWorkspaceFileContent?: (id: string, content: string) => Promise<void>;
  onSubmit: (data: {
    name: string;
    description: string;
    instructions: string;
    tools: string[];
    avatar: string;
    allowedReadPaths: string[];
    allowedWritePaths: string[];
    defaultModel?: string;
    promptConfig?: AgentPromptConfig;
    examplePrompts?: string[];
    allowAgentFolderAccess?: boolean;
  }) => void;
  onCancel: () => void;
}

const ALL_TOOLS_MAP = [
  {
    name: "read_file",
    label: "Read File",
    desc: "View file contents in allowed read paths",
  },
  {
    name: "write_file",
    label: "Write File",
    desc: "Create and modify workspace files",
  },
  { name: "delete_file", label: "Delete File", desc: "Remove workspace items" },
  {
    name: "search_wikipedia",
    label: "Wikipedia Search",
    desc: "Search live Wikipedia summaries",
  },
  { name: "list_dir", label: "List Directory", desc: "List directory entries" },
  {
    name: "get_info",
    label: "Get Item Info",
    desc: "Get file/folder metadata",
  },
  {
    name: "run_python",
    label: "Run Python",
    desc: "Execute python script processes",
  },
  { name: "call_agent", label: "Invoke Agent", desc: "Trigger a sub-agent" },
  {
    name: "create_agent",
    label: "Register Agent",
    desc: "Provision custom agents",
  },
  {
    name: "save_memory",
    label: "Save Memory",
    desc: "Append note to memory list file",
  },
];

export default function AgentForm({
  initialAgent,
  fetchedModels = [],
  workspaceItems = [],
  createWorkspaceFolder,
  createWorkspaceFile,
  updateWorkspaceFileContent,
  onSubmit,
  onCancel,
}: AgentFormProps) {
  const [activeTab, setActiveTab] = useState<
    "normal" | "advanced" | "permissions"
  >("normal");

  const [name, setName] = useState(initialAgent?.name || "");
  const [description, setDescription] = useState(
    initialAgent?.description || "",
  );
  const [instructions, setInstructions] = useState(
    initialAgent?.instructions || "",
  );
  const [avatar, setAvatar] = useState(initialAgent?.avatar || "crown");
  const [defaultModel, setDefaultModel] = useState<string>(
    initialAgent?.defaultModel || "",
  );

  const [selectedTools, setSelectedTools] = useState<string[]>(
    initialAgent?.permissions.allowedTools || ["read_file", "list_dir"],
  );
  const [allowedReadPaths, setAllowedReadPaths] = useState<string[]>(
    initialAgent?.permissions.allowedReadPaths ||
      initialAgent?.permissions.allowedPaths || ["/"],
  );
  const [allowedWritePaths, setAllowedWritePaths] = useState<string[]>(
    initialAgent?.permissions.allowedWritePaths ||
      initialAgent?.permissions.allowedPaths || ["/"],
  );

  const [promptConfig, setPromptConfig] = useState<AgentPromptConfig>(() => {
    const config = initialAgent?.promptConfig || {
      includeActiveFiles: false,
      includeWorkspaceTree: false,
      includeMemories: true,
    };
    if (!config.systemPromptTemplate) {
      config.systemPromptTemplate = getDefaultSystemPromptTemplate();
    }
    return config;
  });

  const [examplePrompts, setExamplePrompts] = useState<string[]>(
    initialAgent?.examplePrompts || ["", "", ""],
  );

  const [includeMemories, setIncludeMemories] = useState<boolean>(
    initialAgent?.promptConfig?.includeMemories !== false,
  );

  const [allowAgentFolderAccess, setAllowAgentFolderAccess] = useState<boolean>(
    initialAgent?.permissions.allowAgentFolderAccess || false,
  );

  // Memory Content State
  const [memoryContent, setMemoryContent] = useState<string>("");

  const targetAgentId =
    initialAgent?.id || name.toLowerCase().replace(/[^a-z0-9]/g, "-");

  // Synchronize state when initialAgent changes (editing vs creating, or switching agents)
  useEffect(() => {
    if (initialAgent) {
      setName(initialAgent.name || "");
      setDescription(initialAgent.description || "");
      setInstructions(initialAgent.instructions || "");
      setAvatar(initialAgent.avatar || "crown");
      setDefaultModel(initialAgent.defaultModel || "");
      setSelectedTools(
        initialAgent.permissions.allowedTools || ["read_file", "list_dir"],
      );
      setAllowedReadPaths(
        initialAgent.permissions.allowedReadPaths ||
          initialAgent.permissions.allowedPaths || ["/"],
      );
      setAllowedWritePaths(
        initialAgent.permissions.allowedWritePaths ||
          initialAgent.permissions.allowedPaths || ["/"],
      );

      const config = {
        ...(initialAgent.promptConfig || {
          includeActiveFiles: false,
          includeWorkspaceTree: false,
          includeMemories: true,
        }),
      };
      if (!config.systemPromptTemplate) {
        config.systemPromptTemplate = getDefaultSystemPromptTemplate();
      }
      setPromptConfig(config);

      setExamplePrompts(initialAgent.examplePrompts || ["", "", ""]);
      setAllowAgentFolderAccess(
        initialAgent.permissions.allowAgentFolderAccess || false,
      );
      setIncludeMemories(initialAgent.promptConfig?.includeMemories !== false);
    } else {
      setName("");
      setDescription("");
      setInstructions("");
      setAvatar("crown");
      setDefaultModel("");
      setSelectedTools(["read_file", "list_dir"]);
      setAllowedReadPaths(["/"]);
      setAllowedWritePaths(["/"]);
      setPromptConfig({
        includeActiveFiles: false,
        includeWorkspaceTree: false,
        includeMemories: true,
        systemPromptTemplate: getDefaultSystemPromptTemplate(),
      });
      setExamplePrompts(["", "", ""]);
      setAllowAgentFolderAccess(false);
      setIncludeMemories(true);
    }
  }, [initialAgent]);

  const handleToggleIncludeMemories = (enabled: boolean) => {
    setIncludeMemories(enabled);
    setPromptConfig((prev) => ({
      ...prev,
      includeMemories: enabled,
    }));
    if (enabled) {
      if (!selectedTools.includes("save_memory")) {
        setSelectedTools([...selectedTools, "save_memory"]);
      }
    } else {
      setSelectedTools(selectedTools.filter((t) => t !== "save_memory"));
    }
  };

  // Load memory content from virtual workspace items
  useEffect(() => {
    if (!targetAgentId || workspaceItems.length === 0) return;
    const targetPath = `agent/${targetAgentId}/memories.txt`.toLowerCase();

    // Look for memories file directly or in agent folder
    const memoryItem = workspaceItems.find((i) => {
      if (i.type !== "file") return false;
      const lowerName = i.name.toLowerCase();
      if (lowerName === "memories.txt") {
        const parent = workspaceItems.find((p) => p.id === i.parentId);
        if (parent && parent.name.toLowerCase() === targetAgentId.toLowerCase())
          return true;
      }
      return false;
    });

    if (memoryItem && memoryItem.content) {
      setMemoryContent(memoryItem.content);
    }
  }, [targetAgentId, workspaceItems]);

  const toggleTool = (toolName: string) => {
    if (selectedTools.includes(toolName)) {
      setSelectedTools(selectedTools.filter((t) => t !== toolName));
    } else {
      setSelectedTools([...selectedTools, toolName]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !instructions.trim()) return;

    // 1. Save memory content if updated
    if (targetAgentId && updateWorkspaceFileContent) {
      const memoryItem = workspaceItems.find((i) => {
        if (i.type !== "file") return false;
        if (i.name.toLowerCase() === "memories.txt") {
          const parent = workspaceItems.find((p) => p.id === i.parentId);
          if (
            parent &&
            parent.name.toLowerCase() === targetAgentId.toLowerCase()
          )
            return true;
        }
        return false;
      });

      if (memoryItem) {
        await updateWorkspaceFileContent(memoryItem.id, memoryContent);
      } else if (
        createWorkspaceFolder &&
        createWorkspaceFile &&
        memoryContent.trim()
      ) {
        let agentRootFolder = workspaceItems.find(
          (i) =>
            i.type === "folder" &&
            i.name.toLowerCase() === "agent" &&
            i.parentId === null,
        );
        let rootId = agentRootFolder ? agentRootFolder.id : null;
        if (!agentRootFolder)
          rootId = await createWorkspaceFolder("agent", null);

        let agFolder = workspaceItems.find(
          (i) =>
            i.type === "folder" &&
            i.name.toLowerCase() === targetAgentId.toLowerCase() &&
            i.parentId === rootId,
        );
        let agFolderId = agFolder ? agFolder.id : null;
        if (!agFolder)
          agFolderId = await createWorkspaceFolder(targetAgentId, rootId);

        await createWorkspaceFile("memories.txt", agFolderId, memoryContent);
      }
    }

    const cleanedPrompts = examplePrompts.map((p) => p.trim()).filter(Boolean);

    let finalTools = [...selectedTools];
    if (includeMemories) {
      if (!finalTools.includes("save_memory")) {
        finalTools.push("save_memory");
      }
    } else {
      finalTools = finalTools.filter((t) => t !== "save_memory");
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      tools: finalTools,
      avatar,
      allowedReadPaths,
      allowedWritePaths,
      defaultModel: defaultModel.trim() ? defaultModel.trim() : undefined,
      promptConfig: {
        ...promptConfig,
        includeMemories,
      },
      examplePrompts: cleanedPrompts.length > 0 ? cleanedPrompts : undefined,
      allowAgentFolderAccess,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-5xl mx-auto space-y-6"
    >
      {/* Top Header Mode Tabs Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("normal")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "normal"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Settings size={14} />
            <span>Normal Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("advanced")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "advanced"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Sliders size={14} />
            <span>Advanced Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("permissions")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "permissions"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Shield size={14} />
            <span>Permissions & Paths</span>
          </button>
        </div>

        <div className="text-[11px] font-mono font-bold text-slate-400 px-3 hidden md:block">
          {initialAgent ? `AGENT ID: ${initialAgent.id}` : "NEW CUSTOM AGENT"}
        </div>
      </div>

      {/* Main Tab View Rendering */}
      {activeTab === "normal" && (
        <AgentNormalSettings
          name={name}
          onChangeName={setName}
          description={description}
          onChangeDescription={setDescription}
          instructions={instructions}
          onChangeInstructions={setInstructions}
          avatar={avatar}
          onChangeAvatar={setAvatar}
          defaultModel={defaultModel}
          onChangeDefaultModel={setDefaultModel}
          fetchedModels={fetchedModels}
          examplePrompts={examplePrompts}
          onChangeExamplePrompts={setExamplePrompts}
          agentId={targetAgentId}
          memoryContent={memoryContent}
          onChangeMemoryContent={setMemoryContent}
          isEditMode={!!initialAgent}
          includeMemories={includeMemories}
          onChangeIncludeMemories={handleToggleIncludeMemories}
        />
      )}

      {activeTab === "advanced" && (
        <AgentAdvancedSettings
          promptConfig={promptConfig}
          onChangePromptConfig={setPromptConfig}
          agentName={name}
          agentId={targetAgentId}
          agentDescription={description}
          agentInstructions={instructions}
        />
      )}

      {activeTab === "permissions" && (
        <div className="space-y-6">
          {/* Authorized Tools Cards Grid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Wrench size={14} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span>Authorized Tools & Capabilities (MCP)</span>
                    <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200/50 dark:border-indigo-800/30">
                      {selectedTools.length} Tools Enabled
                    </span>
                  </h3>
                  <p className="text-[10.5px] text-slate-400">
                    Control which execution tools this agent can invoke during
                    chat turns.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {ALL_TOOLS_MAP.filter((t) => t.name !== "save_memory").map(
                (tool) => {
                  const active = selectedTools.includes(tool.name);
                  return (
                    <button
                      key={tool.name}
                      type="button"
                      onClick={() => toggleTool(tool.name)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        active
                          ? "bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-500 text-slate-900 dark:text-white shadow-2xs"
                          : "bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          active
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        }`}
                      >
                        {active && <Check size={11} className="stroke-[3px]" />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold font-mono block text-slate-800 dark:text-slate-100 truncate">
                          {tool.name}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                          {tool.desc}
                        </span>
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {/* Path Guardrails Manager */}
          <AgentPathPermissions
            agentId={targetAgentId}
            allowedReadPaths={allowedReadPaths}
            allowedWritePaths={allowedWritePaths}
            onChangeReadPaths={setAllowedReadPaths}
            onChangeWritePaths={setAllowedWritePaths}
            allowAgentFolderAccess={allowAgentFolderAccess}
            onChangeAllowAgentFolderAccess={setAllowAgentFolderAccess}
          />
        </div>
      )}

      {/* Sticky/Fixed Bottom Form Footer Actions */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="text-[11px] text-slate-400 font-mono">
          Tab:{" "}
          <span className="uppercase font-bold text-indigo-500">
            {activeTab}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            {initialAgent ? "Save Configuration" : "Deploy Custom Agent"}
          </button>
        </div>
      </div>
    </form>
  );
}

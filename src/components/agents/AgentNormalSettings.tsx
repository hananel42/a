/**
 * @file AgentNormalSettings.tsx
 * @description Normal settings panel for configuring core agent details:
 * Name, Role Description, Default Model, Avatar, System Instructions, Starter Prompts, and Memories.
 */

import React from "react";
import {
  Crown,
  Briefcase,
  Code2,
  Folder,
  Search,
  Brain,
  Settings,
  Terminal,
  Cpu,
  Shield,
  Activity,
  Plus,
  Trash2,
  MessageSquare,
} from "lucide-react";
import AgentMemoryEditor from "./AgentMemoryEditor";

interface AgentNormalSettingsProps {
  name: string;
  onChangeName: (val: string) => void;
  description: string;
  onChangeDescription: (val: string) => void;
  instructions: string;
  onChangeInstructions: (val: string) => void;
  avatar: string;
  onChangeAvatar: (val: string) => void;
  defaultModel: string;
  onChangeDefaultModel: (val: string) => void;
  fetchedModels: string[];
  examplePrompts: string[];
  onChangeExamplePrompts: (prompts: string[]) => void;
  agentId: string;
  memoryContent: string;
  onChangeMemoryContent: (content: string) => void;
  isEditMode: boolean;
  includeMemories: boolean;
  onChangeIncludeMemories: (enabled: boolean) => void;
}

const AVATAR_ICONS = [
  { id: "crown", label: "Crown" },
  { id: "briefcase", label: "Briefcase" },
  { id: "code", label: "Developer" },
  { id: "folder", label: "Organizer" },
  { id: "search", label: "Search" },
  { id: "brain", label: "Brain" },
  { id: "settings", label: "Settings" },
  { id: "terminal", label: "Terminal" },
  { id: "cpu", label: "Processor" },
  { id: "shield", label: "Security" },
  { id: "activity", label: "Activity" },
];

function FormIconRenderer({ iconId }: { iconId: string }) {
  const iconProps = { size: 14, className: "stroke-[2px]" };
  switch (iconId) {
    case "crown":
      return <Crown {...iconProps} />;
    case "briefcase":
      return <Briefcase {...iconProps} />;
    case "code":
      return <Code2 {...iconProps} />;
    case "folder":
      return <Folder {...iconProps} />;
    case "search":
      return <Search {...iconProps} />;
    case "brain":
      return <Brain {...iconProps} />;
    case "settings":
      return <Settings {...iconProps} />;
    case "terminal":
      return <Terminal {...iconProps} />;
    case "cpu":
      return <Cpu {...iconProps} />;
    case "shield":
      return <Shield {...iconProps} />;
    case "activity":
      return <Activity {...iconProps} />;
    default:
      return null;
  }
}

export default function AgentNormalSettings({
  name,
  onChangeName,
  description,
  onChangeDescription,
  instructions,
  onChangeInstructions,
  avatar,
  onChangeAvatar,
  defaultModel,
  onChangeDefaultModel,
  fetchedModels = [],
  examplePrompts,
  onChangeExamplePrompts,
  agentId,
  memoryContent,
  onChangeMemoryContent,
  isEditMode,
  includeMemories,
  onChangeIncludeMemories,
}: AgentNormalSettingsProps) {
  const handleAddExamplePrompt = () => {
    onChangeExamplePrompts([...examplePrompts, ""]);
  };

  const handleRemoveExamplePrompt = (index: number) => {
    onChangeExamplePrompts(examplePrompts.filter((_, i) => i !== index));
  };

  const handleUpdateExamplePrompt = (index: number, val: string) => {
    onChangeExamplePrompts(
      examplePrompts.map((p, i) => (i === index ? val : p)),
    );
  };

  return (
    <div className="space-y-6">
      {/* Basic Profile Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xs">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">
            Agent Name
          </label>
          <input
            type="text"
            placeholder="e.g., Code Auditor"
            value={name}
            onChange={(e) => onChangeName(e.target.value)}
            disabled={isEditMode}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-sans disabled:opacity-60"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">
            Role Description
          </label>
          <input
            type="text"
            placeholder="e.g., Reviews files and enforces clean code rules."
            value={description}
            onChange={(e) => onChangeDescription(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-sans"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">
            Default Model Override
          </label>
          <select
            value={defaultModel}
            onChange={(e) => onChangeDefaultModel(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-sans cursor-pointer"
          >
            <option value="">Global Default (Inherit platform model)</option>
            {fetchedModels && fetchedModels.length > 0 ? (
              fetchedModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No API models detected
              </option>
            )}
          </select>
        </div>
      </div>

      {/* Grid: Instructions & Avatar selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: System Instructions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xs space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              System Instructions
            </label>
            <textarea
              placeholder="Describe your agent's role, persona, domain expertise, and operational guidelines..."
              value={instructions}
              onChange={(e) => onChangeInstructions(e.target.value)}
              rows={6}
              className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
              required
            />
          </div>

          {/* Starter Prompts */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={12} className="text-indigo-500" />
                <span>Example Starter Prompts</span>
              </label>
              <button
                type="button"
                onClick={handleAddExamplePrompt}
                className="flex items-center gap-1 text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                <Plus size={11} />
                <span>Add Example</span>
              </button>
            </div>

            <div className="space-y-2">
              {examplePrompts.map((promptText, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0 w-5">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    placeholder={`e.g., Starter prompt #${idx + 1}`}
                    value={promptText}
                    onChange={(e) =>
                      handleUpdateExamplePrompt(idx, e.target.value)
                    }
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveExamplePrompt(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Remove prompt"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Avatar Icon Pick */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xs space-y-3 h-fit">
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Avatar Icon
          </label>
          <div className="grid grid-cols-4 gap-2">
            {AVATAR_ICONS.map((iconItem) => (
              <button
                key={iconItem.id}
                type="button"
                onClick={() => onChangeAvatar(iconItem.id)}
                className={`h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                  avatar === iconItem.id
                    ? "bg-indigo-600 text-white shadow-xs scale-105"
                    : "bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
                title={iconItem.label}
              >
                <FormIconRenderer iconId={iconItem.id} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Embedded Long-Term Memory Manager Setting card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Brain size={14} className="text-indigo-500" />
              <span>Enable Long-Term Memory</span>
            </h3>
            <p className="text-[10.5px] text-slate-400">
              Allows the agent to retain knowledge across sessions. This
              automatically grants the model the <code>save_memory</code> tool.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={includeMemories}
            onClick={() => onChangeIncludeMemories(!includeMemories)}
            className={`w-11 h-6 rounded-full transition-colors relative inline-flex items-center shrink-0 p-0.5 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 ${
              includeMemories
                ? "bg-indigo-600"
                : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm pointer-events-none ${
                includeMemories ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {includeMemories && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
            <AgentMemoryEditor
              agentId={agentId || name.toLowerCase().replace(/[^a-z0-9]/g, "-")}
              memoryContent={memoryContent}
              onChangeMemoryContent={onChangeMemoryContent}
            />
          </div>
        )}
      </div>
    </div>
  );
}

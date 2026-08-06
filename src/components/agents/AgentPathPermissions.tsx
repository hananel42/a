/**
 * @file AgentPathPermissions.tsx
 * @description Intuitive, high-usability interface for managing agent read/write directory guardrails.
 */

import React, { useState } from "react";
import { Shield, Folder, Plus, X, Lock, CheckCircle2 } from "lucide-react";

interface AgentPathPermissionsProps {
  agentId: string;
  allowedReadPaths: string[];
  allowedWritePaths: string[];
  onChangeReadPaths: (paths: string[]) => void;
  onChangeWritePaths: (paths: string[]) => void;
  allowAgentFolderAccess?: boolean;
  onChangeAllowAgentFolderAccess?: (val: boolean) => void;
}

export default function AgentPathPermissions({
  agentId,
  allowedReadPaths,
  allowedWritePaths,
  onChangeReadPaths,
  onChangeWritePaths,
  allowAgentFolderAccess,
  onChangeAllowAgentFolderAccess,
}: AgentPathPermissionsProps) {
  const [newReadInput, setNewReadInput] = useState("");
  const [newWriteInput, setNewWriteInput] = useState("");

  const PRESET_PATHS = [
    { label: "All Workspace ( / )", value: "/" },
    { label: "Source Code ( /src )", value: "/src" },
    {
      label: `Agent Folder ( agent/${agentId || "id"} )`,
      value: `agent/${agentId || "id"}`,
    },
    { label: "Outputs ( /outputs )", value: "/outputs" },
    { label: "Docs ( /docs )", value: "/docs" },
  ];

  const handleToggleReadPreset = (val: string) => {
    if (allowedReadPaths.includes(val)) {
      onChangeReadPaths(allowedReadPaths.filter((p) => p !== val));
    } else {
      onChangeReadPaths([...allowedReadPaths, val]);
    }
  };

  const handleToggleWritePreset = (val: string) => {
    if (allowedWritePaths.includes(val)) {
      onChangeWritePaths(allowedWritePaths.filter((p) => p !== val));
    } else {
      onChangeWritePaths([...allowedWritePaths, val]);
    }
  };

  const handleAddReadPath = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newReadInput.trim();
    if (clean && !allowedReadPaths.includes(clean)) {
      onChangeReadPaths([...allowedReadPaths, clean]);
      setNewReadInput("");
    }
  };

  const handleAddWritePath = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newWriteInput.trim();
    if (clean && !allowedWritePaths.includes(clean)) {
      onChangeWritePaths([...allowedWritePaths, clean]);
      setNewWriteInput("");
    }
  };

  const handleRemoveReadPath = (pathToRemove: string) => {
    onChangeReadPaths(allowedReadPaths.filter((p) => p !== pathToRemove));
  };

  const handleRemoveWritePath = (pathToRemove: string) => {
    onChangeWritePaths(allowedWritePaths.filter((p) => p !== pathToRemove));
  };

  return (
    <div className="space-y-6">
      {/* System Directory Access Guardrail */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Lock size={14} className="text-indigo-500 font-sans" />
              <span>Sandbox Access to Agent Configurations</span>
            </h3>
            <p className="text-[10.5px] text-slate-400">
              Allow this agent to read and list the <code>/agent</code> system
              folder containing other agents' instructions, memories, and
              parameters. (Disabled by default)
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={allowAgentFolderAccess}
            onClick={() =>
              onChangeAllowAgentFolderAccess?.(!allowAgentFolderAccess)
            }
            className={`w-11 h-6 rounded-full transition-colors relative inline-flex items-center shrink-0 p-0.5 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 ${
              allowAgentFolderAccess
                ? "bg-indigo-600"
                : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm pointer-events-none ${
                allowAgentFolderAccess ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Read Path Guardrails Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Folder size={14} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span>Read Path Boundaries</span>
                <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200/50 dark:border-emerald-800/30">
                  {allowedReadPaths.length} Scopes Active
                </span>
              </h3>
              <p className="text-[10.5px] text-slate-400">
                Directories and files the agent is authorized to read.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Presets Chips */}
        <div>
          <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Quick Path Presets
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_PATHS.map((preset) => {
              const active = allowedReadPaths.includes(preset.value);
              return (
                <button
                  key={`read-${preset.value}`}
                  type="button"
                  onClick={() => handleToggleReadPreset(preset.value)}
                  className={`px-2.5 py-1 rounded-xl text-[10.5px] font-sans font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shadow-2xs"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                  }`}
                >
                  {active && (
                    <CheckCircle2 size={11} className="text-emerald-500" />
                  )}
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Read Badges */}
        <div className="space-y-2">
          <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
            Active Read Paths
          </span>
          {allowedReadPaths.length === 0 ? (
            <p className="text-xs text-amber-500 font-semibold italic">
              Warning: No read paths configured. The agent won't be able to read
              any files.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {allowedReadPaths.map((path) => (
                <span
                  key={`read-active-${path}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
                >
                  <Folder size={12} className="text-emerald-500 shrink-0" />
                  <span>{path}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveReadPath(path)}
                    className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Remove path"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Custom Read Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add custom read path (e.g. '/workspace/docs')..."
            value={newReadInput}
            onChange={(e) => setNewReadInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddReadPath();
              }
            }}
            className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
          />
          <button
            type="button"
            onClick={() => handleAddReadPath()}
            disabled={!newReadInput.trim()}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={13} />
            <span>Add Path</span>
          </button>
        </div>
      </div>

      {/* Write Path Guardrails Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Shield size={14} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span>Write Path Boundaries</span>
                <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200/50 dark:border-indigo-800/30">
                  {allowedWritePaths.length} Scopes Active
                </span>
              </h3>
              <p className="text-[10.5px] text-slate-400">
                Directories and files the agent is authorized to modify or
                create.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Presets Chips */}
        <div>
          <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Quick Path Presets
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_PATHS.map((preset) => {
              const active = allowedWritePaths.includes(preset.value);
              return (
                <button
                  key={`write-${preset.value}`}
                  type="button"
                  onClick={() => handleToggleWritePreset(preset.value)}
                  className={`px-2.5 py-1 rounded-xl text-[10.5px] font-sans font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-2xs"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                  }`}
                >
                  {active && (
                    <CheckCircle2 size={11} className="text-indigo-500" />
                  )}
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Write Badges */}
        <div className="space-y-2">
          <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
            Active Write Paths
          </span>
          {allowedWritePaths.length === 0 ? (
            <p className="text-xs text-amber-500 font-semibold italic">
              Warning: No write paths configured. The agent won't be able to
              modify or create files.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {allowedWritePaths.map((path) => (
                <span
                  key={`write-active-${path}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
                >
                  <Shield size={12} className="text-indigo-500 shrink-0" />
                  <span>{path}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveWritePath(path)}
                    className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Remove path"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Custom Write Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add custom write path (e.g. '/outputs')..."
            value={newWriteInput}
            onChange={(e) => setNewWriteInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddWritePath();
              }
            }}
            className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
          />
          <button
            type="button"
            onClick={() => handleAddWritePath()}
            disabled={!newWriteInput.trim()}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={13} />
            <span>Add Path</span>
          </button>
        </div>
      </div>
    </div>
  );
}

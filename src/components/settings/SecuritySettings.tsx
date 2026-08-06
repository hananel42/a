/**
 * @file SecuritySettings.tsx
 * @description
 * Redesigned security barrier policy parameters list.
 * Integrates comfortable rounded-2xl panels with warm yellow warning highlights instead of heavy borders.
 *
 * Props:
 * - requiresConfirmationTools: Array of strings representing active protected tools.
 * - onToggleTool: Direct callback to toggle the security requirement of a tool.
 */

import React from "react";
import { ShieldAlert, CheckSquare, Square } from "lucide-react";

interface SecuritySettingsProps {
  requiresConfirmationTools: string[];
  onToggleTool: (toolName: string) => void;
}

const ALL_SYSTEM_TOOLS = [
  {
    name: "read_file",
    label: "Read File",
    desc: "Read sandbox workspace content",
  },
  {
    name: "write_file",
    label: "Write File",
    desc: "Mutate or overwrite workspace files",
  },
  {
    name: "list_dir",
    label: "List Directory",
    desc: "Query directory structural indices",
  },
  {
    name: "get_info",
    label: "Get Metadata",
    desc: "Analyze size and storage stats",
  },
  {
    name: "run_python",
    label: "Run Python",
    desc: "Execute inline calculation engines",
  },
  {
    name: "call_agent",
    label: "Invoke Agent",
    desc: "Trigger recursive sub-agent runs",
  },
  {
    name: "create_agent",
    label: "Register Agent",
    desc: "Dynamically launch brand new agents",
  },
];

export default function SecuritySettings({
  requiresConfirmationTools,
  onToggleTool,
}: SecuritySettingsProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <ShieldAlert size={13} className="text-amber-500" />
          <span>Execution Security & Manual Confirmations</span>
        </h3>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
          Select workspace tools that require user confirmation before
          executing:
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 select-none pt-1">
        {ALL_SYSTEM_TOOLS.map((tool) => {
          const isGuarded = requiresConfirmationTools.includes(tool.name);
          return (
            <button
              key={tool.name}
              type="button"
              onClick={() => onToggleTool(tool.name)}
              className={`flex items-center gap-2 p-2 border transition-all text-left cursor-pointer rounded-lg text-xs ${
                isGuarded
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300"
                  : "bg-slate-50/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="shrink-0">
                {isGuarded ? (
                  <CheckSquare
                    size={13}
                    className="text-amber-500 stroke-[2px]"
                  />
                ) : (
                  <Square
                    size={13}
                    className="text-slate-400 dark:text-slate-600 stroke-[2px]"
                  />
                )}
              </div>
              <span className="font-medium truncate">{tool.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

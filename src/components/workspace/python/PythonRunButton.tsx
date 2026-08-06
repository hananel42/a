/**
 * @file PythonRunButton.tsx
 * @description Compact, sleek execution and stop controls for Python scripts.
 * Designed to fit cleanly in editor footers/toolbars without visual clutter.
 */

import React from "react";
import {
  Play,
  Square,
  Loader2,
  Terminal,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { PythonExecutionState } from "../../../types/python";

interface PythonRunButtonProps {
  onRun: () => void;
  onStop?: () => void;
  state: PythonExecutionState;
  onToggleConsole?: () => void;
  isConsoleOpen?: boolean;
}

export default function PythonRunButton({
  onRun,
  onStop,
  state,
  onToggleConsole,
  isConsoleOpen = false,
}: PythonRunButtonProps) {
  const isRunning = state === "running" || state === "awaiting_input";

  return (
    <div className="flex items-center gap-1.5 select-none">
      {!isRunning ? (
        <button
          onClick={onRun}
          title="Run Python Script (Ctrl + Enter)"
          className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded transition-colors shadow-xs"
        >
          <Play size={11} className="fill-current" />
          <span>Run</span>
          <kbd className="hidden sm:inline-block ml-0.5 px-1 text-[9px] bg-sky-700/50 rounded font-mono opacity-80">
            Ctrl+↵
          </kbd>
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded">
            <Loader2 size={11} className="animate-spin" />
            <span>
              {state === "awaiting_input" ? "Waiting Input..." : "Running..."}
            </span>
          </span>
          {onStop && (
            <button
              onClick={onStop}
              title="Stop Execution"
              className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded transition-colors"
            >
              <Square size={10} className="fill-current" />
              <span>Stop</span>
            </button>
          )}
        </div>
      )}

      {onToggleConsole && (
        <button
          onClick={onToggleConsole}
          title={
            isConsoleOpen ? "Hide Terminal Output" : "Show Terminal Output"
          }
          className={`p-1 rounded text-xs transition-colors border ${
            isConsoleOpen
              ? "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Terminal size={12} />
        </button>
      )}
    </div>
  );
}

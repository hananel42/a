/**
 * @file PythonConsole.tsx
 * @description Streamlined Python output console component.
 * Displays stdout/stderr outputs, status lines, dividers between runs,
 * and workspace file sync notifications. Automatically pushes previous run
 * history up when a new run begins, creating a clean fresh console view while
 * preserving scrollable history.
 */

import React, { useRef, useEffect, useState } from "react";
import {
  Terminal,
  Trash2,
  Copy,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { PythonConsoleLog, PythonExecutionState } from "../../../types/python";

interface PythonConsoleProps {
  logs: PythonConsoleLog[];
  state: PythonExecutionState;
  durationMs?: number;
  syncedPaths?: string[];
  onClearLogs: () => void;
  onClose: () => void;
  fileName: string;
}

export default function PythonConsole({
  logs,
  state,
  durationMs,
  syncedPaths = [],
  onClearLogs,
  onClose,
  fileName,
}: PythonConsoleProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const logContainerRef = useRef<HTMLDivElement | null>(null);
  const latestRunRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs.length]);

  const handleCopyLogs = () => {
    const text = logs.map((l) => l.text).join("\n");
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isRunning = state === "running" || state === "awaiting_input";

  return (
    <div className="flex flex-col border-t border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 font-mono text-xs shadow-2xl transition-all duration-200">
      {/* Console Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-slate-800 select-none">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-sky-400" />
          <span className="font-semibold text-slate-200 text-xs">
            Python Terminal
          </span>
          <span className="text-slate-500 text-[11px] truncate max-w-[160px]">
            ({fileName})
          </span>
 
          {/* Execution Status Badge */}
          <div className="ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-sans">
            {isRunning ? (
              <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                <Loader2 size={11} className="animate-spin" />
                {state === "awaiting_input" ? "Waiting Input..." : "Running..."}
              </span>
            ) : state === "success" ? (
              <span className="flex items-center gap-1 text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-full border border-sky-400/20">
                <CheckCircle2 size={11} /> Exit Code 0{" "}
                {durationMs ? `(${(durationMs / 1000).toFixed(2)}s)` : ""}
              </span>
            ) : state === "error" ? (
              <span className="flex items-center gap-1 text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full border border-rose-400/20">
                <AlertCircle size={11} /> Process Failed
              </span>
            ) : null}
          </div>
        </div>
 
        {/* Header Right Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyLogs}
            disabled={logs.length === 0}
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 disabled:opacity-40 transition-colors"
            title="Copy Output"
          >
            {isCopied ? (
              <Check size={13} className="text-sky-400" />
            ) : (
              <Copy size={13} />
            )}
          </button>
          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 disabled:opacity-40 transition-colors"
            title="Clear Console Output"
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
            title={isCollapsed ? "Expand Terminal" : "Collapse Terminal"}
          >
            {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
            title="Close Console"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Main Console Content Body */}
      {!isCollapsed && (
        <div
          ref={logContainerRef}
          className="h-48 sm:h-56 overflow-y-auto p-3 font-mono text-[12px] leading-relaxed select-text scrollbar-thin scrollbar-thumb-slate-700 bg-slate-900/90 relative"
        >
          {logs.length === 0 ? (
            <div className="text-slate-500 italic py-6 text-center">
              Console output empty. Click "Run" or press Ctrl+Enter to execute.
            </div>
          ) : (
            logs.map((log) => {
              if (log.type === "divider") {
                return (
                  <div
                    key={log.id}
                    className="py-2 flex items-center gap-2 select-none"
                  >
                    <div className="h-[1px] flex-1 bg-slate-800" />
                    <span className="text-[10px] font-sans uppercase tracking-wider text-slate-500 font-semibold">
                      New Run • {log.timestamp}
                    </span>
                    <div className="h-[1px] flex-1 bg-slate-800" />
                  </div>
                );
              }

              let colorClass = "text-slate-200";
              if (log.type === "stderr")
                colorClass = "text-rose-400 font-semibold";
              else if (log.type === "stdout") colorClass = "text-slate-100";
              else if (log.type === "system")
                colorClass =
                  "text-slate-400 font-sans italic text-[11px] py-0.5 my-1";
              else if (log.type === "input")
                colorClass = "text-amber-300 font-semibold";

              return (
                <span
                  key={log.id}
                  className={`${colorClass} whitespace-pre-wrap break-words inline`}
                >
                  {log.text}
                </span>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

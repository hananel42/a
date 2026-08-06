/**
 * @file TaskTreeVisualizer.tsx
 * @description UI Component rendering sub-task breakdowns, sub-agent assignments,
 * execution states, and outcomes for tasks that decomposed into child sub-tasks.
 */

import React, { useState } from "react";
import {
  GitBranch,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Bot,
  HelpCircle,
} from "lucide-react";
import { Task, TaskStatus } from "../../types/task";
import { Agent } from "../../types/agent";
import { renderAgentAvatar } from "../chat/ChatMessageList";

interface TaskTreeVisualizerProps {
  rootTask: Task;
  allTasks: Task[];
  agents: Agent[];
}

export default function TaskTreeVisualizer({
  rootTask,
  allTasks,
  agents,
}: TaskTreeVisualizerProps) {
  const [expanded, setExpanded] = useState(true);

  // Find direct sub-tasks
  const subTasks = allTasks.filter((t) => t.parentTaskId === rootTask.id);

  if (subTasks.length === 0) return null;

  const renderStatusBadge = (status: TaskStatus, success?: boolean) => {
    switch (status) {
      case "completed":
        return success !== false ? (
          <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold font-mono">
            <CheckCircle2 size={12} /> Done: Yes
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-amber-500 font-bold font-mono">
            <AlertCircle size={12} /> Done: No
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center gap-1 text-[10px] text-rose-500 font-bold font-mono">
            <AlertCircle size={12} /> Failed
          </span>
        );
      case "running":
      case "thinking":
        return (
          <span className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold font-mono animate-pulse">
            <Loader2 size={12} className="animate-spin" /> In Progress
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
            <Clock size={12} /> Pending
          </span>
        );
    }
  };

  return (
    <div className="my-3 border border-slate-200 dark:border-slate-800/80 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 p-3.5 font-sans">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <GitBranch size={15} className="text-indigo-500" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
            Sub-Task Breakdown & Sub-Agents ({subTasks.length})
          </span>
        </div>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2.5 border-t border-slate-200/60 dark:border-slate-800/60 pt-2.5">
          {subTasks.map((st) => {
            const assignedAgent = agents.find(
              (a) => a.id === st.assignedAgentId,
            );
            return (
              <div
                key={st.id}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-[10px]">
                      {renderAgentAvatar(
                        assignedAgent?.avatar,
                        assignedAgent?.name || "Agent",
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {st.title}
                    </span>
                  </div>
                  {renderStatusBadge(st.status, st.result?.success)}
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-400">
                      ID:{" "}
                      <code className="text-slate-700 dark:text-slate-300 font-mono">
                        {st.id}
                      </code>
                    </span>
                    <span className="text-slate-400">
                      Agent:{" "}
                      <strong className="text-slate-600 dark:text-slate-300">
                        {assignedAgent?.name || st.assignedAgentId}
                      </strong>
                    </span>
                  </div>
                  <span className="block text-slate-600 dark:text-slate-300">
                    Goal: {st.goal}
                  </span>
                  {st.result && (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-300">
                      <span className="font-bold block text-[10px] text-slate-400 uppercase tracking-wider">
                        Summary / Response:
                      </span>
                      <p className="line-clamp-3 text-[11px] whitespace-pre-wrap">
                        {st.result.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

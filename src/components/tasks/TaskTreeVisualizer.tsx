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
    <div className="my-3 border border-[var(--theme-border,#141d30)] rounded-2xl bg-[var(--theme-bg,#070c18)] p-3.5 font-sans text-[var(--theme-text,#f1f5f9)]">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <GitBranch size={15} className="text-[var(--theme-accent,#10b981)]" />
          <span className="text-xs font-bold text-[var(--theme-text,#f1f5f9)] uppercase tracking-wider font-mono">
            Sub-Task Breakdown & Sub-Agents ({subTasks.length})
          </span>
        </div>
        <button className="text-[var(--theme-text-muted,#94a3b8)] hover:text-[var(--theme-text,#f1f5f9)]">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2.5 border-t border-[var(--theme-border,#141d30)] pt-2.5">
          {subTasks.map((st) => {
            const assignedAgent = agents.find(
              (a) => a.id === st.assignedAgentId,
            );
            return (
              <div
                key={st.id}
                className="p-2.5 rounded-xl bg-[var(--theme-card,#101726)] border border-[var(--theme-border,#141d30)] space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-[var(--theme-accent-subtle,rgba(16,185,129,0.15))] text-[var(--theme-accent,#10b981)] flex items-center justify-center shrink-0 text-[10px]">
                      {renderAgentAvatar(
                        assignedAgent?.avatar,
                        assignedAgent?.name || "Agent",
                      )}
                    </div>
                    <span className="text-xs font-bold text-[var(--theme-text,#f1f5f9)] truncate">
                      {st.title}
                    </span>
                  </div>
                  {renderStatusBadge(st.status, st.result?.success)}
                </div>

                <div className="text-[11px] text-[var(--theme-text-muted,#94a3b8)] font-mono bg-[var(--theme-bg,#070c18)] p-2 rounded-lg border border-[var(--theme-border,#141d30)] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--theme-text-muted,#94a3b8)]">
                      ID:{" "}
                      <code className="text-[var(--theme-text,#f1f5f9)] font-mono">
                        {st.id}
                      </code>
                    </span>
                    <span className="text-[var(--theme-text-muted,#94a3b8)]">
                      Agent:{" "}
                      <strong className="text-[var(--theme-text,#f1f5f9)]">
                        {assignedAgent?.name || st.assignedAgentId}
                      </strong>
                    </span>
                  </div>
                  <span className="block text-[var(--theme-text,#f1f5f9)]">
                    Goal: {st.goal}
                  </span>
                  {st.result && (
                    <div className="mt-1.5 pt-1.5 border-t border-[var(--theme-border,#141d30)] text-[var(--theme-text,#f1f5f9)]">
                      <span className="font-bold block text-[10px] text-[var(--theme-text-muted,#94a3b8)] uppercase tracking-wider">
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

/**
 * @file ThinkingBlock.tsx
 * @description Minimalist, frameless UI component for displaying model reasoning and tools invoked during thinking.
 * Eliminates heavy borders and container frames for a clean, minimalist layout.
 * Delegates internal chronological content rendering directly to AgentActivityRenderer.
 */

import React, { useState, useEffect } from "react";
import { Brain, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { MessagePart, ToolCallStep } from "../../types/agent";
import AgentActivityRenderer, {
  findPendingApprovalSteps,
  PendingApprovalSideActions,
} from "./AgentActivityRenderer";

interface ThinkingBlockProps {
  part?: MessagePart;
  reasoning?: string;
  isStreaming?: boolean;
  thinkingTimeMs?: number;
  previewStyle?: "standard" | "serif" | "newspaper" | "nord" | "tech";
  defaultExpanded?: boolean;
  steps?: ToolCallStep[];
  parts?: MessagePart[];
  onApproveTool?: (stepId: string) => void;
  onRejectTool?: (stepId: string) => void;
}

export default function ThinkingBlock({
  part,
  reasoning,
  isStreaming = false,
  thinkingTimeMs,
  previewStyle = "standard",
  defaultExpanded,
  steps = [],
  parts = [],
  onApproveTool,
  onRejectTool,
}: ThinkingBlockProps) {
  const effectiveParts = part?.parts || parts;
  const effectiveSteps = part?.steps || steps;
  const effectiveReasoning = part?.content || reasoning || "";
  const effectiveTime =
    part?.thinkingTimeMs !== undefined ? part.thinkingTimeMs : thinkingTimeMs;
  const effectiveStreaming =
    part?.isStreamingReasoning !== undefined
      ? part.isStreamingReasoning
      : isStreaming;

  const pendingSteps = findPendingApprovalSteps(effectiveParts, effectiveSteps);

  const toolCount =
    effectiveParts && effectiveParts.length > 0
      ? effectiveParts.filter((p) => p.type === "tool").length
      : effectiveSteps
        ? effectiveSteps.length
        : 0;

  const hasActiveStep =
    effectiveParts && effectiveParts.length > 0
      ? effectiveParts.some(
          (p) =>
            p.type === "tool" &&
            p.step &&
            (p.step.status === "running" ||
              p.step.status === "pending_approval" ||
              p.step.status === "queued"),
        )
      : effectiveSteps.some(
          (s) =>
            s.status === "running" ||
            s.status === "pending_approval" ||
            s.status === "queued",
        );

  const isPaused = Boolean(part?.isPaused || pendingSteps.length > 0);

  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (defaultExpanded !== undefined) return defaultExpanded;
    return localStorage.getItem("default_thinking_expanded") === "true";
  });

  const lastTimeRef = React.useRef({
    time: effectiveTime || 0,
    updatedAt: Date.now(),
  });

  if (
    effectiveTime !== undefined &&
    effectiveTime !== lastTimeRef.current.time
  ) {
    lastTimeRef.current = { time: effectiveTime, updatedAt: Date.now() };
  }

  const [, setTick] = useState<number>(0);
  useEffect(() => {
    if (!effectiveStreaming || isPaused) return;
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 100);
    return () => clearInterval(timer);
  }, [effectiveStreaming, isPaused]);

  let liveMs =
    effectiveTime !== undefined ? effectiveTime : lastTimeRef.current.time;
  if (effectiveStreaming && !isPaused) {
    liveMs =
      lastTimeRef.current.time + (Date.now() - lastTimeRef.current.updatedAt);
  }

  const durationText =
    liveMs > 0
      ? `${(liveMs / 1000).toFixed(1)}s`
      : effectiveStreaming
        ? "0.0s"
        : "Complete";

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  const hasContentToRender =
    Boolean(effectiveReasoning?.trim()) ||
    effectiveStreaming ||
    (effectiveParts && effectiveParts.length > 0) ||
    (effectiveSteps && effectiveSteps.length > 0);
  if (!hasContentToRender) return null;

  if (!effectiveReasoning?.trim() && !effectiveStreaming) {
    return (
      <AgentActivityRenderer
        parts={
          effectiveParts && effectiveParts.length > 0
            ? effectiveParts
            : undefined
        }
        steps={
          (!effectiveParts || effectiveParts.length === 0) &&
          effectiveSteps &&
          effectiveSteps.length > 0
            ? effectiveSteps
            : undefined
        }
        onApproveTool={onApproveTool}
        onRejectTool={onRejectTool}
        previewStyle={previewStyle}
      />
    );
  }

  return (
    <div className="my-2 select-none font-sans">
      {/* Minimalist Frameless Header */}
      <div className="flex items-center gap-2">
        <div className="group flex flex-1 items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors cursor-pointer text-left overflow-hidden">
          {/* Clickable Header Label & Info */}
          <div
            onClick={handleToggleExpand}
            className="flex flex-1 items-center gap-2 overflow-hidden py-0.5"
          >
            <div className="flex items-center gap-1.5 shrink-0 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300">
              {effectiveStreaming ? (
                <Sparkles
                  size={13}
                  className="animate-spin text-indigo-500 shrink-0"
                />
              ) : (
                <Brain size={13} className="shrink-0" />
              )}
            </div>

            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 font-sans tracking-tight shrink-0">
              Thought Process
            </span>

            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-medium shrink-0">
              ({durationText})
            </span>

            {toolCount > 0 && (
              <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40 dark:border-indigo-800/40 shrink-0 ml-1">
                {toolCount} {toolCount === 1 ? "tool" : "tools"}
              </span>
            )}
          </div>

          {/* Quick Action Side Button when Collapsed */}
          {!isExpanded && pendingSteps.length > 0 && (
            <PendingApprovalSideActions
              pendingSteps={pendingSteps}
              onApproveTool={onApproveTool}
              onRejectTool={onRejectTool}
              onExpand={() => setIsExpanded(true)}
            />
          )}

          {/* Inspect / Toggle Button */}
          <button
            type="button"
            onClick={handleToggleExpand}
            className="ml-auto flex items-center gap-1 text-slate-400 dark:text-slate-500 shrink-0 p-1 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <span className="text-[10px] font-mono uppercase text-slate-400">
              {isExpanded ? "Hide" : "Inspect"}
            </span>
            {isExpanded ? (
              <ChevronDown size={13} />
            ) : (
              <ChevronRight size={13} />
            )}
          </button>
        </div>
      </div>

      {/* Minimalist Frameless Content Body */}
      {isExpanded && (
        <div className="mt-1.5 pl-3 ml-2 border-l-2 border-indigo-500/25 dark:border-indigo-500/20 space-y-2 transition-all">
          <AgentActivityRenderer
            parts={
              effectiveParts && effectiveParts.length > 0
                ? effectiveParts
                : undefined
            }
            steps={
              (!effectiveParts || effectiveParts.length === 0) &&
              effectiveSteps &&
              effectiveSteps.length > 0
                ? effectiveSteps
                : undefined
            }
            content={
              (!effectiveParts || effectiveParts.length === 0) &&
              (!effectiveSteps || effectiveSteps.length === 0)
                ? effectiveReasoning
                : undefined
            }
            onApproveTool={onApproveTool}
            onRejectTool={onRejectTool}
            previewStyle={previewStyle}
            isStreaming={effectiveStreaming}
            isNested
          />
        </div>
      )}
    </div>
  );
}

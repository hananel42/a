/**
 * @file AgentActivityRenderer.tsx
 * @description Dedicated orchestrator for rendering chronological agent actions, reasoning steps,
 * tool streams, and content blocks. Supports nesting and direct recursive invocation for trace visualization.
 */

import React from "react";
import { MessagePart, ToolCallStep } from "../../types/agent";
import ToolCallStepRenderer from "./ToolCallStepRenderer";
import ThinkingBlock from "./ThinkingBlock";
import MarkdownViewer from "../workspace/MarkdownViewer";
import { FileUp, Shield, Check, XCircle, AlertTriangle } from "lucide-react";

export function renderErrorAlertCard(errorText: string) {
  const cleanMessage = errorText
    .replace(/^\*\*API Connection Error\*\*:\s*/i, "")
    .replace(/^\*\*Execution Error\*\*:\s*/i, "")
    .trim();

  return (
    <div className="my-2 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs font-sans space-y-1.5 select-text shadow-xs">
      <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
        <AlertTriangle size={15} className="shrink-0 text-rose-500" />
        <span>Execution / API Error</span>
      </div>
      <div className="pl-5 font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap break-words text-rose-700 dark:text-rose-300 bg-rose-100/50 dark:bg-rose-900/30 p-2 rounded-lg border border-rose-200/50 dark:border-rose-800/40">
        {cleanMessage}
      </div>
      <div className="pl-5 text-[10px] text-rose-500 dark:text-rose-400 font-sans italic">
        Error logged to console. Check API key, model availability, or rate limit in Settings.
      </div>
    </div>
  );
}

interface AgentActivityRendererProps {
  parts?: MessagePart[];
  steps?: ToolCallStep[];
  content?: string;
  onApproveTool?: (stepId: string) => void;
  onRejectTool?: (stepId: string) => void;
  previewStyle?: "standard" | "serif" | "newspaper" | "nord" | "tech";
  isStreaming?: boolean;
  isNested?: boolean;
}

/**
 * Recursively scans message parts or steps tree to find all tool calls requiring user confirmation.
 */
export function findPendingApprovalSteps(
  parts?: MessagePart[],
  steps?: ToolCallStep[],
): ToolCallStep[] {
  const pending: ToolCallStep[] = [];
  if (parts && parts.length > 0) {
    for (const part of parts) {
      if (part.type === "tool" && part.step) {
        if (part.step.status === "pending_approval") {
          pending.push(part.step);
        }
        if (part.step.subParts || part.step.subSteps) {
          pending.push(
            ...findPendingApprovalSteps(part.step.subParts, part.step.subSteps),
          );
        }
      } else if (part.type === "thinking") {
        pending.push(...findPendingApprovalSteps(part.parts, part.steps));
      }
    }
  } else if (steps && steps.length > 0) {
    for (const step of steps) {
      if (step.status === "pending_approval") {
        pending.push(step);
      }
      if (step.subParts || step.subSteps) {
        pending.push(...findPendingApprovalSteps(step.subParts, step.subSteps));
      }
    }
  }
  return pending;
}

interface PendingApprovalSideActionsProps {
  pendingSteps: ToolCallStep[];
  onApproveTool?: (stepId: string) => void;
  onRejectTool?: (stepId: string) => void;
  onExpand?: () => void;
}

/**
 * Renders quick side action controls for tool approval when a block or sub-trace is collapsed.
 */
export function PendingApprovalSideActions({
  pendingSteps,
  onApproveTool,
  onRejectTool,
  onExpand,
}: PendingApprovalSideActionsProps) {
  if (!pendingSteps || pendingSteps.length === 0) return null;

  if (pendingSteps.length === 1) {
    const step = pendingSteps[0];
    return (
      <div
        className="inline-flex items-center gap-1.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {onApproveTool && (
          <button
            type="button"
            onClick={() => onApproveTool(step.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-bold shadow-md hover:shadow-emerald-500/25 transition-all cursor-pointer ring-2 ring-emerald-500/30 active:scale-95"
            title={`Approve ${step.toolName || "tool"}`}
          >
            <Check size={13} className="stroke-[3]" />
            <span>Approve</span>
            {step.toolName && (
              <span className="bg-emerald-700/50 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded text-[9.5px] font-mono font-medium max-w-[100px] truncate">
                {step.toolName}
              </span>
            )}
          </button>
        )}
        {onRejectTool && (
          <button
            type="button"
            onClick={() => onRejectTool(step.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:border-rose-500/50 text-[10.5px] font-semibold transition-all cursor-pointer active:scale-95"
            title="Reject execution"
          >
            <XCircle size={12} />
            <span>Reject</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (onExpand) onExpand();
      }}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-all cursor-pointer animate-pulse shrink-0 shadow-sm"
    >
      <Shield size={13} className="text-amber-500" />
      <span>{pendingSteps.length} Approvals Required</span>
    </button>
  );
}

export function renderUploadAlertCard(fileNames: string[]) {
  return (
    <div className="flex flex-wrap gap-2 my-2 select-none">
      {fileNames.map((name, i) => (
        <div
          key={i}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-mono"
        >
          <FileUp size={13} className="text-indigo-500 shrink-0" />
          <span className="font-medium truncate max-w-xs">{name}</span>
          <span className="text-[10px] text-slate-400 font-sans">
            (/uploads/)
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Merges adjacent thinking parts in a message unless separated by a text output part.
 * Includes tool calls executed in-between into the thinking trace.
 */
export function mergeAdjacentThinkingParts(
  parts?: MessagePart[],
): MessagePart[] {
  if (!parts || parts.length === 0) return [];

  const result: MessagePart[] = [];

  for (const part of parts) {
    if (result.length === 0) {
      result.push(part);
      continue;
    }

    const last = result[result.length - 1];

    if (part.type === "thinking" && last.type === "thinking") {
      const combinedSteps = [...(last.steps || [])];
      if (part.steps) {
        for (const s of part.steps) {
          if (!combinedSteps.some((existing) => existing.id === s.id)) {
            combinedSteps.push(s);
          }
        }
      }

      const combinedSubParts = [...(last.parts || [])];
      if (part.parts) {
        for (const sp of part.parts) {
          combinedSubParts.push(sp);
        }
      }

      const combinedContent =
        (last.content || "") +
        (last.content && part.content ? "\n" : "") +
        (part.content || "");

      result[result.length - 1] = {
        ...last,
        content: combinedContent,
        steps: combinedSteps,
        parts: combinedSubParts,
        thinkingTimeMs: (last.thinkingTimeMs || 0) + (part.thinkingTimeMs || 0),
        isStreamingReasoning:
          last.isStreamingReasoning || part.isStreamingReasoning,
      };
    } else if (part.type === "tool" && part.step && last.type === "thinking") {
      const existingSteps = last.steps || [];
      const existingParts = last.parts || [];
      const updatedSteps = existingSteps.some((s) => s.id === part.step!.id)
        ? existingSteps
        : [...existingSteps, part.step];
      const updatedParts = existingParts.some(
        (sp) => sp.type === "tool" && sp.step?.id === part.step!.id,
      )
        ? existingParts
        : [...existingParts, part];

      result[result.length - 1] = {
        ...last,
        steps: updatedSteps,
        parts: updatedParts,
      };
    } else if (part.type === "thinking" && last.type === "tool") {
      let prevThinkingIndex = -1;
      let hasTextBetween = false;
      for (let i = result.length - 1; i >= 0; i--) {
        if (
          result[i].type === "text" &&
          result[i].content &&
          result[i].content.trim()
        ) {
          hasTextBetween = true;
          break;
        }
        if (result[i].type === "thinking") {
          prevThinkingIndex = i;
          break;
        }
      }

      if (prevThinkingIndex !== -1 && !hasTextBetween) {
        const targetThinking = result[prevThinkingIndex];
        const combinedSteps = [...(targetThinking.steps || [])];
        if (part.steps) {
          for (const s of part.steps) {
            if (!combinedSteps.some((existing) => existing.id === s.id)) {
              combinedSteps.push(s);
            }
          }
        }

        const combinedSubParts = [...(targetThinking.parts || [])];
        if (
          last.step &&
          !combinedSubParts.some(
            (sp) => sp.type === "tool" && sp.step?.id === last.step!.id,
          )
        ) {
          combinedSubParts.push(last);
        }
        if (part.parts) {
          for (const sp of part.parts) {
            combinedSubParts.push(sp);
          }
        }

        const combinedContent =
          (targetThinking.content || "") +
          (targetThinking.content && part.content ? "\n" : "") +
          (part.content || "");

        result[prevThinkingIndex] = {
          ...targetThinking,
          content: combinedContent,
          steps: combinedSteps,
          parts: combinedSubParts,
          thinkingTimeMs:
            (targetThinking.thinkingTimeMs || 0) + (part.thinkingTimeMs || 0),
          isStreamingReasoning:
            targetThinking.isStreamingReasoning || part.isStreamingReasoning,
        };
        result.pop();
      } else {
        result.push(part);
      }
    } else {
      result.push(part);
    }
  }

  return result;
}

export default function AgentActivityRenderer({
  parts,
  steps,
  content,
  onApproveTool,
  onRejectTool,
  previewStyle = "standard",
  isStreaming = false,
  isNested = false,
}: AgentActivityRendererProps) {
  const normalizedParts =
    parts && parts.length > 0 ? mergeAdjacentThinkingParts(parts) : undefined;
  const hasParts = normalizedParts && normalizedParts.length > 0;
  const hasSteps = steps && steps.length > 0;
  const hasContent = Boolean(content && content.trim());

  if (hasParts) {
    const isErrorText = (txt?: string) =>
      Boolean(
        txt &&
          (txt.includes("**API Connection Error**:") ||
            txt.includes("API Provider Authorization Failed") ||
            txt.includes("API Provider Quota / Rate Limit") ||
            txt.includes("Agent execution failed due to tool error") ||
            txt.includes("Execution Error")),
      );

    const partsConcatText = normalizedParts!
      .filter((p) => p.type === "text" && p.content)
      .map((p) => p.content)
      .join("\n");

    const extraErrorInContent =
      content && isErrorText(content) && !partsConcatText.includes(content);

    return (
      <div className={`space-y-3 font-sans ${isNested ? "my-1" : ""}`}>
        {normalizedParts!.map((part) => {
          if (
            part.type === "thinking" &&
            (part.content ||
              part.isStreamingReasoning ||
              (part.steps && part.steps.length > 0) ||
              (part.parts && part.parts.length > 0))
          ) {
            return (
              <div key={part.id} className="max-w-3xl">
                <ThinkingBlock
                  part={part}
                  reasoning={part.content || ""}
                  isStreaming={part.isStreamingReasoning}
                  thinkingTimeMs={part.thinkingTimeMs}
                  previewStyle={previewStyle}
                  steps={part.steps}
                  parts={part.parts}
                  onApproveTool={onApproveTool}
                  onRejectTool={onRejectTool}
                />
              </div>
            );
          } else if (part.type === "text" && part.content) {
            if (isErrorText(part.content)) {
              return (
                <div key={part.id} className="max-w-3xl">
                  {renderErrorAlertCard(part.content)}
                </div>
              );
            }
            const isUploadAlert = part.content.startsWith(
              "System Alert: User has uploaded the following file(s)",
            );
            if (isUploadAlert) {
              let fileNames: string[] = [];
              const match = part.content.match(/folder:\s*([^.]+)\./);
              if (match && match[1]) {
                fileNames = match[1].split(",").map((name) => name.trim());
              }
              return (
                <div key={part.id} className="max-w-3xl">
                  {renderUploadAlertCard(fileNames)}
                </div>
              );
            }
            return (
              <div
                key={part.id}
                className={
                  isNested
                    ? "text-slate-500 dark:text-slate-400 text-[11.5px] leading-relaxed italic [&_p]:my-1 max-w-none select-text"
                    : "max-w-none text-[13px] leading-relaxed select-text text-slate-800 dark:text-slate-100"
                }
              >
                <MarkdownViewer
                  content={part.content}
                  previewStyle={previewStyle}
                  isStreaming={isStreaming}
                />
              </div>
            );
          } else if (part.type === "tool" && part.step) {
            return (
              <div key={part.id} className="max-w-3xl">
                <ToolCallStepRenderer
                  step={part.step}
                  onApproveTool={onApproveTool}
                  onRejectTool={onRejectTool}
                  previewStyle={previewStyle}
                />
              </div>
            );
          }
          return null;
        })}

        {extraErrorInContent && (
          <div className="max-w-3xl">
            {renderErrorAlertCard(content!)}
          </div>
        )}
      </div>
    );
  }

  if (hasSteps || hasContent) {
    const isErrorText =
      content &&
      (content.includes("**API Connection Error**:") ||
        content.includes("API Provider Authorization Failed") ||
        content.includes("API Provider Quota / Rate Limit") ||
        content.includes("Agent execution failed due to tool error") ||
        content.includes("Execution Error"));

    return (
      <div className={`space-y-3 font-sans ${isNested ? "my-1" : ""}`}>
        {hasSteps && (
          <div className="space-y-2 max-w-3xl">
            {steps!.map((step) => (
              <ToolCallStepRenderer
                key={step.id}
                step={step}
                onApproveTool={onApproveTool}
                onRejectTool={onRejectTool}
                previewStyle={previewStyle}
              />
            ))}
          </div>
        )}
        {hasContent && (
          <div className="max-w-3xl">
            {isErrorText ? (
              renderErrorAlertCard(content!)
            ) : (
              <div
                className={
                  isNested
                    ? "text-slate-500 dark:text-slate-400 text-[11.5px] leading-relaxed italic [&_p]:my-1 max-w-none select-text"
                    : "max-w-none text-[13px] leading-relaxed select-text text-slate-800 dark:text-slate-100"
                }
              >
                <MarkdownViewer
                  content={content!}
                  previewStyle={previewStyle}
                  isStreaming={isStreaming}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (isStreaming) {
    return (
      <div className="flex items-center gap-2 py-1 text-slate-400 select-none">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-sans">
          {isNested ? "Sub-agent executing..." : "Agent starting..."}
        </span>
        <div className="flex items-center gap-1">
          <span
            className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    );
  }

  return null;
}

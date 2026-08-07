/**
 * @file ToolCallStepRenderer.tsx
 * @description Sleek, minimalist component for rendering real-time tool execution steps.
 * Provides real-time parameter streaming, live payload previews, and interactive approval flows.
 */

import React, { useState } from "react";
import {
  Terminal,
  Shield,
  Check,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  FileCode,
  Play,
  Folder,
  Search,
  Cpu,
  Wrench,
} from "lucide-react";
import { ToolCallStep, MessagePart } from "../../types/agent";
import MarkdownViewer from "../workspace/MarkdownViewer";
import CodeBlock from "../../markdown-engine/components/CodeBlock";
import { cleanTextFromPseudoTools } from "../../services/openai";
import AgentActivityRenderer, {
  findPendingApprovalSteps,
  PendingApprovalSideActions,
} from "./AgentActivityRenderer";

/**
 * Detects programming language from file extension, tool name, or content heuristics for Syntax Highlighting.
 */
function detectLanguage(
  filePath?: string,
  toolName?: string,
  content?: string,
): string {
  if (toolName === "run_python") return "python";
  if (toolName === "run_command" || toolName === "bash") return "bash";

  if (filePath) {
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    switch (ext) {
      case "js":
      case "mjs":
      case "cjs":
        return "javascript";
      case "ts":
      case "mts":
      case "cts":
        return "typescript";
      case "jsx":
        return "jsx";
      case "tsx":
        return "tsx";
      case "json":
        return "json";
      case "css":
      case "scss":
      case "less":
        return "css";
      case "html":
      case "htm":
        return "markup";
      case "py":
        return "python";
      case "sh":
      case "bash":
      case "zsh":
        return "bash";
      case "sql":
        return "sql";
      case "yaml":
      case "yml":
        return "yaml";
      case "md":
      case "markdown":
        return "markdown";
      case "xml":
      case "svg":
        return "markup";
    }
  }

  if (content) {
    const trimmed = content.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
    if (
      trimmed.startsWith("<") &&
      (trimmed.endsWith(">") || trimmed.includes("</"))
    )
      return "markup";
    if (
      /^(import|export|const|let|var|function|interface|type)\s/.test(trimmed)
    )
      return "typescript";
    if (/^(def |class |import |from |\s*#)/.test(trimmed)) return "python";
  }

  return "text";
}

/**
 * Maps tool names to visual icons.
 */
function getToolIcon(name: string) {
  switch (name) {
    case "read_file":
    case "write_file":
    case "edit_file":
    case "delete_file":
      return <FileCode size={13} className="text-emerald-400 shrink-0" />;
    case "run_python":
    case "run_command":
      return <Play size={13} className="text-amber-400 shrink-0" />;
    case "list_dir":
    case "get_info":
      return <Folder size={13} className="text-sky-400 shrink-0" />;
    case "search_wikipedia":
    case "search_files":
      return <Search size={13} className="text-indigo-400 shrink-0" />;
    case "create_agent":
    case "call_agent":
      return <Cpu size={13} className="text-purple-400 shrink-0" />;
    default:
      return <Terminal size={13} className="text-slate-400 shrink-0" />;
  }
}

/**
 * Extracts the primary parameter string to display in the header summary line.
 */
function getPrimaryHeaderDetail(args: Record<string, any> | undefined): string {
  if (!args) return "";
  return (
    args["agent-id"] ||
    args.agentId ||
    args.TargetFile ||
    args.path ||
    args.filePath ||
    args.targetFile ||
    args.target_file ||
    args.filename ||
    args.SourcePath ||
    args.DestinationPath ||
    args.query ||
    args.name ||
    args.command ||
    ""
  );
}

const PAYLOAD_KEYS = new Set([
  "content",
  "code",
  "script",
  "replacementContent",
  "ReplacementContent",
  "fileContent",
  "body",
  "text",
]);

/**
 * Data-driven parameter renderer for all tools.
 * Eliminates duplicate JSX layouts by formatting parameter key-value pairs cleanly.
 */
function ToolArgumentsView({
  args,
}: {
  args: Record<string, any> | undefined;
}) {
  if (!args || Object.keys(args).length === 0) {
    return (
      <div className="text-slate-500 italic text-[11px]">
        No parameters provided.
      </div>
    );
  }

  const entries = Object.entries(args).filter(
    ([key]) => !PAYLOAD_KEYS.has(key),
  );
  if (entries.length === 0) return null;

  return (
    <div className="space-y-1 text-[11px] font-mono text-slate-300">
      {entries.map(([key, val]) => {
        let displayVal: React.ReactNode;
        if (Array.isArray(val)) {
          displayVal = (
            <div className="flex flex-wrap gap-1">
              {val.map((item, i) => (
                <span
                  key={i}
                  className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded text-[10px]"
                >
                  {typeof item === "object"
                    ? JSON.stringify(item)
                    : String(item)}
                </span>
              ))}
            </div>
          );
        } else if (typeof val === "object" && val !== null) {
          displayVal = (
            <span className="text-slate-300">{JSON.stringify(val)}</span>
          );
        } else {
          displayVal = (
            <span className="text-emerald-400 break-all whitespace-pre-wrap">
              {String(val)}
            </span>
          );
        }

        const formattedLabel = key.replace(/([A-Z])/g, " $1").toLowerCase();

        return (
          <div key={key} className="flex items-start gap-2">
            <span className="text-slate-500 font-bold w-24 shrink-0 font-sans capitalize">
              {formattedLabel}:
            </span>
            <div className="min-w-0 flex-1">{displayVal}</div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Universal code/content payload viewer for tools like write_file, edit_file, or run_python.
 * Supports real-time streaming of code content.
 */
function ToolPayloadView({
  toolName,
  args,
}: {
  toolName: string;
  args: Record<string, any> | undefined;
}) {
  if (!args) return null;

  const payloadContent =
    args.content ||
    args.code ||
    args.script ||
    args.replacementContent ||
    args.ReplacementContent ||
    args.fileContent ||
    args.text ||
    args.body;

  if (!payloadContent) return null;

  const targetPath =
    args.TargetFile ||
    args.path ||
    args.filePath ||
    args.targetFile ||
    args.target_file ||
    args.filename ||
    args.SourcePath ||
    args.DestinationPath ||
    "";

  const lang = detectLanguage(targetPath, toolName, payloadContent);

  return (
    <div className="mt-2.5">
      <CodeBlock className={`language-${lang}`} fileName={targetPath}>
        {payloadContent}
      </CodeBlock>
    </div>
  );
}

interface ToolCallStepRendererProps {
  step: ToolCallStep;
  onApproveTool?: (stepId: string) => void;
  onRejectTool?: (stepId: string) => void;
  previewStyle?: "standard" | "serif" | "newspaper" | "nord" | "tech";
}

export default function ToolCallStepRenderer({
  step,
  onApproveTool,
  onRejectTool,
  previewStyle = "standard",
}: ToolCallStepRendererProps) {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(() => {
    const isDefaultCollapsed =
      localStorage.getItem("default_tools_collapsed") !== "false";
    return !isDefaultCollapsed;
  });
  const [isNestedExpanded, setIsNestedExpanded] = useState(true);

  const isPending = step.status === "pending_approval";
  const isError = step.status === "error";

  const showDetails = isDetailsExpanded;

  const primaryDetail = getPrimaryHeaderDetail(step.args);
  const borderColor = isPending
    ? "border-amber-500/80 bg-amber-500/5"
    : "border-slate-800";

  return (
    <div
      className={`border rounded-xl p-3 my-2.5 font-sans transition-all bg-slate-900/40 ${borderColor}`}
    >
      {/* 1. Header Line */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setIsDetailsExpanded((prev) => !prev)}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
        >
          {isDetailsExpanded ? (
            <ChevronDown size={14} className="text-slate-400 shrink-0" />
          ) : (
            <ChevronRight size={14} className="text-slate-400 shrink-0" />
          )}
          {getToolIcon(step.toolName)}
          <span className="text-xs font-bold font-mono text-slate-200 tracking-wide">
            {step.toolName}
          </span>
          {primaryDetail && (
            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[240px]">
              {primaryDetail}
            </span>
          )}
        </button>

        {/* Status Indicator Badge */}
        <div className="shrink-0 uppercase tracking-wider text-[9px] font-mono font-bold flex items-center">
          {step.status === "queued" && (
            <span className="text-slate-400 flex items-center gap-1 bg-slate-950/40 px-2 py-0.5 rounded border border-slate-800">
              <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-pulse" />
              Queued
            </span>
          )}
          {step.status === "running" && (
            <span className="text-sky-400 animate-pulse flex items-center gap-1.5 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
              <span className="h-1.5 w-1.5 bg-sky-400 rounded-full animate-ping" />
              Running
            </span>
          )}
          {step.status === "pending_approval" && (
            <span className="text-amber-400 animate-pulse flex items-center gap-1 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60">
              <Shield size={10} />
              Requires Approval
            </span>
          )}
          {step.status === "success" && (
            <span className="text-emerald-400 flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/30">
              <Check size={10} />
              Done
            </span>
          )}
          {step.status === "error" && (
            <span className="text-rose-400 flex items-center gap-1 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/30">
              <XCircle size={10} />
              Failed
            </span>
          )}
          {step.status === "cancelled" && (
            <span className="text-amber-500 flex items-center gap-1 bg-amber-950/20 px-2 py-0.5 rounded border border-amber-800/30">
              <XCircle size={10} className="text-amber-500" />
              Cancelled
            </span>
          )}
        </div>
      </div>

      {/* 2. Collapsible Details: Input Parameters & Output Model Response */}
      {showDetails && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-3">
          {/* Input Section */}
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono block mb-1">
              Input (Tool Arguments)
            </span>
            <ToolArgumentsView args={step.args} />
          </div>

          {/* Output Section */}
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono block mb-1">
              Output (Result Returned to Model)
            </span>

            {step.status === "running" && !step.output && (
              <div className="p-2 rounded-lg bg-sky-950/20 border border-sky-800/30 text-sky-300 text-[11px] font-mono flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping shrink-0" />
                Executing tool... awaiting output...
              </div>
            )}

            {step.status === "error" && step.output && (
              <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 text-[11px] font-mono leading-relaxed whitespace-pre-wrap">
                {cleanTextFromPseudoTools(step.output)}
              </div>
            )}

            {step.output &&
              step.status !== "error" &&
              (step.toolName === "call_agent" &&
              (step.subSteps?.length ||
                step.subParts?.length ||
                step.streamedText) ? (
                <div className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-800/30 text-indigo-200 text-[11px] leading-relaxed max-h-60 overflow-y-auto scrollbar-thin">
                  <MarkdownViewer
                    content={cleanTextFromPseudoTools(step.output)}
                    previewStyle={previewStyle}
                  />
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/60 text-slate-300 text-[11px] font-mono leading-relaxed max-h-60 overflow-y-auto scrollbar-thin whitespace-pre-wrap">
                  {cleanTextFromPseudoTools(step.output)}
                </div>
              ))}

            {!step.output && step.status === "success" && (
              <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-emerald-300 text-[11px] font-mono italic">
                Execution completed. No string output returned.
              </div>
            )}
          </div>
        </div>
      )}
      <ToolPayloadView toolName={step.toolName} args={step.args} />
      {/* 3. Pending Approval Action Panel */}
      {isPending && (
        <div className="mt-3 bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-400 shrink-0" />
            <div className="text-[11px] text-amber-200">
              <strong className="block font-bold">
                Action Requires User Approval
              </strong>
              <span className="text-[10px] text-amber-300/80 font-mono">
                Tool{" "}
                <code className="text-amber-200 font-bold">
                  {step.toolName}
                </code>{" "}
                requested write/system access on{" "}
                <code className="text-amber-200">
                  {step.args?.path || "workspace"}
                </code>
                .
              </span>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onApproveTool?.(step.id)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase font-mono rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <Check size={12} /> Approve
            </button>
            <button
              onClick={() => onRejectTool?.(step.id)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-800 font-bold text-[10px] uppercase font-mono rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <XCircle size={12} /> Reject
            </button>
          </div>
        </div>
      )}

      {/* 7. Nested Agent Sub-Steps Stream */}
      {(step.subParts ||
        step.streamedText ||
        step.streamedReasoning ||
        (step.subSteps && step.subSteps.length > 0) ||
        (step.toolName === "call_agent" && step.status === "running")) &&
        (() => {
          const activeSubParts = step.subParts || [];
          let finalSubParts = activeSubParts;
          if (finalSubParts.length === 0) {
            const subParts: MessagePart[] = [];
            if (step.streamedReasoning) {
              subParts.push({
                id: `${step.id}-reasoning`,
                type: "thinking",
                content: cleanTextFromPseudoTools(step.streamedReasoning),
                isStreamingReasoning: step.status === "running",
                steps: step.subSteps,
              });
            } else if (step.subSteps && step.subSteps.length > 0) {
              step.subSteps.forEach((s) => {
                subParts.push({
                  id: s.id,
                  type: "tool",
                  step: s,
                });
              });
            }
            if (step.streamedText) {
              subParts.push({
                id: `${step.id}-text`,
                type: "text",
                content: cleanTextFromPseudoTools(step.streamedText),
              });
            }
            finalSubParts = subParts;
          }

          const pendingSubSteps = findPendingApprovalSteps(
            finalSubParts,
            step.subSteps,
          );

          return (
            <div className="mt-3 pt-2.5 border-t border-slate-800/60">
              <div className="flex items-center justify-between gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setIsNestedExpanded(!isNestedExpanded)}
                  className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-slate-200 font-mono uppercase tracking-wider cursor-pointer select-none"
                >
                  {isNestedExpanded ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                  <span>Nested Sub-Agent Trace</span>
                  {step.subSteps && step.subSteps.length > 0 && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                      {step.subSteps.length}{" "}
                      {step.subSteps.length === 1 ? "action" : "actions"}
                    </span>
                  )}
                </button>

                {!isNestedExpanded && pendingSubSteps.length > 0 && (
                  <PendingApprovalSideActions
                    pendingSteps={pendingSubSteps}
                    onApproveTool={onApproveTool}
                    onRejectTool={onRejectTool}
                    onExpand={() => setIsNestedExpanded(true)}
                  />
                )}
              </div>

              {isNestedExpanded && (
                <div className="border-l-2 border-indigo-500/30 pl-3 ml-1 font-sans">
                  <AgentActivityRenderer
                    parts={finalSubParts.length > 0 ? finalSubParts : undefined}
                    steps={
                      finalSubParts.length === 0 ? step.subSteps : undefined
                    }
                    onApproveTool={onApproveTool}
                    onRejectTool={onRejectTool}
                    previewStyle={previewStyle}
                    isStreaming={step.status === "running"}
                    isNested
                  />
                </div>
              )}
            </div>
          );
        })()}
    </div>
  );
}

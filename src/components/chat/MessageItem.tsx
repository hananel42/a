/**
 * @file MessageItem.tsx
 * @description Single conversation message bubble card component with inline actions (Copy, Edit, Fork, Regenerate).
 */

import React, { useState } from "react";
import {
  User,
  Copy,
  Check,
  PenLine,
  GitFork,
  RefreshCw,
  FileUp,
} from "lucide-react";
import { Message, Agent } from "../../types/agent";
import MarkdownViewer from "../workspace/MarkdownViewer";
import AgentActivityRenderer from "./AgentActivityRenderer";
import { renderAgentAvatar } from "./AgentAvatar";

interface MessageItemProps {
  msg: Message;
  index: number;
  totalMessages: number;
  agents: Agent[];
  isStreaming: boolean;
  editingMessageId: string | null;
  setEditingMessageId: (id: string | null) => void;
  editBuffer: string;
  setEditBuffer: (buf: string) => void;
  onSaveEdit: () => void;
  onSplitChat?: (idx: number) => void;
  onRegenerate?: (msgId: string) => void;
  onApproveTool?: (stepId: string) => void;
  onRejectTool?: (stepId: string) => void;
  previewStyle?: "standard" | "serif" | "newspaper" | "nord" | "tech";
  lastUserMessageId: string | null;
}

function renderUploadAlertCard(fileNames: string[]) {
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

export default function MessageItem({
  msg,
  index,
  totalMessages,
  agents,
  isStreaming,
  editingMessageId,
  setEditingMessageId,
  editBuffer,
  setEditBuffer,
  onSaveEdit,
  onSplitChat,
  onRegenerate,
  onApproveTool,
  onRejectTool,
  previewStyle,
  lastUserMessageId,
}: MessageItemProps) {
  const [isCopied, setIsCopied] = useState(false);
  const isUser = msg.sender === "user";
  const isLastMessage = index === totalMessages - 1;
  const agent = agents.find((a) => a.id === msg.sender);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative flex gap-4 group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] p-4 rounded-2xl -mx-4 transition-all duration-200 pb-5">
      {/* Profile Avatar indicator */}
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100/30 dark:border-indigo-900/10 flex items-center justify-center text-indigo-500 text-sm">
            <User size={13} className="stroke-[2.5px]" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100/30 dark:border-emerald-900/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm">
            {renderAgentAvatar(agent?.avatar, agent?.name || "Assistant")}
          </div>
        )}
      </div>

      {/* Message Details */}
      <div className="flex-1 min-w-0 font-sans">
        <div className="flex items-center gap-2 mb-1.5 opacity-60">
          <span className="font-extrabold text-[9px] uppercase tracking-widest font-sans text-slate-400 dark:text-slate-500">
            {isUser ? "USER" : agent?.name || "ASSISTANT"}
          </span>
          <span className="text-[9px] text-slate-400 font-mono">
            {new Date(msg.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Active Message Editor */}
        {editingMessageId === msg.id ? (
          <div className="space-y-2.5 mt-2 max-w-2xl">
            <textarea
              value={editBuffer}
              onChange={(e) => setEditBuffer(e.target.value)}
              className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 leading-relaxed shadow-xs"
              rows={4}
            />
            <div className="flex gap-2 select-none">
              <button
                onClick={onSaveEdit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-[11px] cursor-pointer rounded-xl transition-all active:scale-95 shadow-sm shadow-indigo-600/10"
              >
                Save & Run
              </button>
              <button
                onClick={() => setEditingMessageId(null)}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-sans text-[11px] cursor-pointer rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 font-sans">
            {isUser ? (
              <div className="max-w-none text-[13px] leading-relaxed select-text text-slate-800 dark:text-slate-100">
                {msg.content.startsWith(
                  "System Alert: User has uploaded the following file(s)",
                ) ? (
                  (() => {
                    let fileNames: string[] = [];
                    const match = msg.content.match(/folder:\s*([^.]+)\./);
                    if (match && match[1]) {
                      fileNames = match[1]
                        .split(",")
                        .map((name) => name.trim());
                    }
                    return renderUploadAlertCard(fileNames);
                  })()
                ) : (
                  <MarkdownViewer
                    content={msg.content}
                    previewStyle={previewStyle}
                    isStreaming={isStreaming && isLastMessage}
                  />
                )}
              </div>
            ) : (
              <AgentActivityRenderer
                parts={msg.parts}
                steps={msg.steps}
                content={msg.content}
                onApproveTool={onApproveTool}
                onRejectTool={onRejectTool}
                previewStyle={previewStyle}
                isStreaming={isStreaming && isLastMessage}
              />
            )}
          </div>
        )}
      </div>

      {/* Hover Action Toolbar */}
      <div className="absolute right-2 bottom-1 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs px-1.5 py-1 rounded-xl backdrop-blur-xs select-none">
        <button
          onClick={handleCopy}
          title="Copy message text"
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          {isCopied ? (
            <Check size={13} className="text-emerald-500" />
          ) : (
            <Copy size={13} />
          )}
        </button>

        {isUser && lastUserMessageId === msg.id && (
          <button
            onClick={() => {
              setEditingMessageId(msg.id);
              setEditBuffer(msg.content);
            }}
            title="Edit query and re-run"
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <PenLine size={13} />
          </button>
        )}

        {onSplitChat && (
          <button
            onClick={() => onSplitChat(index)}
            title="Fork conversation from this message"
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <GitFork size={13} />
          </button>
        )}

        {!isUser && isLastMessage && onRegenerate && (
          <button
            onClick={() => onRegenerate(msg.id)}
            title="Regenerate response"
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * @file ChatMessageList.tsx
 * @description High-performance scroller feed rendering a dialog of expert system and user messages.
 * Uses MarkdownViewer for consistent markdown presentation based on selected presets.
 */

import React from "react";
import { ArrowDown, Sparkles, ArrowRight, AlertTriangle } from "lucide-react";
import { Message, Agent } from "../../types/agent";
import { Task } from "../../types/task";
import MessageItem from "./MessageItem";
import { renderAgentAvatar } from "./AgentAvatar";
import TaskTreeVisualizer from "../tasks/TaskTreeVisualizer";
import { isModelSupported } from "../../data/models";
import {
  getThemeBackgroundClasses,
  getThemeTextClasses,
} from "../../markdown-engine/styles";
import { useAutoScroll } from "../../hooks/useAutoScroll";

export { renderAgentAvatar };

interface ChatMessageListProps {
  messages: Message[];
  agents: Agent[];
  activeAgent?: Agent;
  onSelectPrompt?: (text: string) => void;
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
  activeTask?: Task | null;
  allTasks?: Task[];
}

export default function ChatMessageList({
  messages,
  agents,
  activeAgent,
  onSelectPrompt,
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
  previewStyle = "standard",
  activeTask,
  allTasks = [],
}: ChatMessageListProps) {
  const {
    scrollRef,
    contentRef,
    showScrollDown,
    scrollToBottom,
    handleScroll,
  } = useAutoScroll({
    dependencies: [messages, isStreaming, activeTask, allTasks],
    atBottomThreshold: 20,
  });

  const currentAgent = activeAgent || agents[0];
  const examplePrompts =
    currentAgent?.examplePrompts && currentAgent.examplePrompts.length > 0
      ? currentAgent.examplePrompts.slice(0, 3)
      : [
          `Analyze the workspace files and summarize the structure.`,
          `Write a clean modular TypeScript function for data processing.`,
          `Inspect the project documentation and create a concise summary.`,
        ];

  const hasInvalidModel =
    currentAgent?.defaultModel && !isModelSupported(currentAgent.defaultModel);

  if (!messages || messages.length === 0) {
    return (
      <div
        className={`h-full flex flex-col items-center justify-center p-6 md:p-10 select-none overflow-y-auto transition-colors ${getThemeBackgroundClasses(previewStyle)} ${getThemeTextClasses(previewStyle)}`}
      >
        <div className="max-w-md w-full text-center space-y-6">
          {hasInvalidModel && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800/70 text-amber-800 dark:text-amber-200 text-xs font-sans text-left flex items-start gap-2.5 shadow-xs">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="font-bold">Model Notice:</strong> The configured model <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded text-[11px]">{currentAgent.defaultModel}</code> for agent <strong>{currentAgent.name}</strong> is unavailable. Requests will automatically fall back to the active global model.
              </div>
            </div>
          )}

          <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/50 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
            {renderAgentAvatar(
              currentAgent?.avatar,
              currentAgent?.name || "Agent",
            )}
          </div>

          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-800 dark:text-white font-sans">
              {currentAgent?.name || "Assistant"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-sans max-w-sm mx-auto">
              {currentAgent?.description ||
                "Select an example prompt below or enter a custom instruction."}
            </p>
          </div>

          <div className="space-y-2.5 text-left pt-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block text-center font-mono">
              Suggested Example Prompts
            </span>
            {examplePrompts.map((promptText, i) => (
              <button
                key={i}
                onClick={() => onSelectPrompt?.(promptText)}
                className="w-full text-left p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500 dark:hover:border-indigo-500 text-xs font-sans text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all duration-200 shadow-2xs hover:shadow-xs group flex items-start justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-start gap-2.5">
                  <Sparkles
                    size={14}
                    className="text-indigo-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform"
                  />
                  <span className="leading-snug">{promptText}</span>
                </div>
                <ArrowRight
                  size={13}
                  className="text-slate-400 group-hover:text-indigo-500 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const lastUserMsg = [...messages].reverse().find((m) => m.sender === "user");
  const lastUserMessageId = lastUserMsg ? lastUserMsg.id : null;

  return (
    <div
      className={`flex-1 relative min-h-0 transition-colors ${getThemeBackgroundClasses(previewStyle)} ${getThemeTextClasses(previewStyle)}`}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto p-4 md:p-6 scrollbar-thin"
      >
        <div ref={contentRef} className="space-y-6">
          {hasInvalidModel && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800/70 text-amber-800 dark:text-amber-200 text-xs font-sans flex items-start gap-2.5 shadow-xs max-w-3xl">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="font-bold">Model Notice:</strong> The configured model <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded text-[11px]">{currentAgent.defaultModel}</code> for agent <strong>{currentAgent.name}</strong> is unavailable. Requests will automatically fall back to the active global model.
              </div>
            </div>
          )}

          {activeTask && allTasks.length > 0 && (
            <div className="mb-4">
              <TaskTreeVisualizer
                rootTask={activeTask}
                allTasks={allTasks}
                agents={agents}
              />
            </div>
          )}

          {messages.map((msg, index) => (
            <MessageItem
              key={msg.id}
              msg={msg}
              index={index}
              totalMessages={messages.length}
              agents={agents}
              isStreaming={isStreaming}
              editingMessageId={editingMessageId}
              setEditingMessageId={setEditingMessageId}
              editBuffer={editBuffer}
              setEditBuffer={setEditBuffer}
              onSaveEdit={onSaveEdit}
              onSplitChat={onSplitChat}
              onRegenerate={onRegenerate}
              onApproveTool={onApproveTool}
              onRejectTool={onRejectTool}
              previewStyle={previewStyle}
              lastUserMessageId={lastUserMessageId}
            />
          ))}
        </div>
      </div>

      {showScrollDown && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-4 right-6 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95 cursor-pointer z-10"
        >
          <ArrowDown size={16} />
        </button>
      )}
    </div>
  );
}

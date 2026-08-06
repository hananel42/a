/**
 * @file ChatTab.tsx
 * @description Orchestrates the conversational agent workspace interface.
 * Implements a completely square, flat, high-contrast minimalist grid design without rounded corners.
 * Relies on the modular useChatSessions hook for robust state orchestration and streaming.
 *
 * Capabilities:
 * - Thread-safe real-time text stream delta rendering.
 * - Flat layout styling with single-pixel border definitions.
 * - Integration of ChatSidebar, ChatMessageList, and ChatInput.
 */

import React, { useState } from "react";
import { Agent } from "../../types/agent";
import { useChatSessions } from "../../hooks/useChatSessions";
import ChatSidebar from "./ChatSidebar";
import ChatMessageList, { renderAgentAvatar } from "./ChatMessageList";
import ChatInput from "./ChatInput";

interface ChatTabProps {
  agents: Agent[];
  apiBaseUrl: string;
  apiKey: string;
  model: string;
  workspaceItems: any[];
  createWorkspaceFile: (
    name: string,
    parentId: string | null,
    content?: string,
  ) => Promise<string>;
  createWorkspaceFolder: (
    name: string,
    parentId: string | null,
  ) => Promise<string>;
  updateWorkspaceFileContent: (id: string, content: string) => Promise<void>;
  deleteWorkspaceItem?: (id: string) => Promise<void>;
  onCreateAgent: (
    name: string,
    desc: string,
    instructions: string,
    tools: string[],
    avatar?: string,
    allowedReadPaths?: string[],
    allowedWritePaths?: string[],
    defaultModel?: string,
  ) => Promise<string>;
  requiresConfirmationTools: string[];
  previewStyle?: "standard" | "serif" | "newspaper" | "nord" | "tech";
  onOpenCreateAgent?: () => void;
  processUploadedFiles?: (
    uploadedFiles: File[],
    parentId: string | null,
  ) => void;
}

import { Task } from "../../types/task";
import {
  getThemeContainerClasses,
  getThemeBackgroundClasses,
  getThemeTextClasses,
} from "../../markdown-engine/styles";

export default function ChatTab({
  agents,
  apiBaseUrl,
  apiKey,
  model,
  workspaceItems,
  createWorkspaceFile,
  createWorkspaceFolder,
  updateWorkspaceFileContent,
  deleteWorkspaceItem,
  onCreateAgent,
  requiresConfirmationTools,
  previewStyle = "standard",
  onOpenCreateAgent,
  processUploadedFiles,
}: ChatTabProps) {
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    activeAgentId,
    setActiveAgentId,
    inputText,
    setInputText,
    isStreaming,
    editingMessageId,
    setEditingMessageId,
    editBuffer,
    setEditBuffer,
    handleCreateSession,
    handleDeleteSession,
    handleSelectSession,
    handleSendMessage,
    handleSaveUserMessageEdit,
    handleSplitChat,
    handleRegenerate,
    handleStopStreaming,
    handleApproveTool,
    handleRejectTool,
    handleResumeTaskWithInstruction,
    activeSession,
  } = useChatSessions({
    agents,
    apiKey,
    apiBaseUrl,
    model,
    workspaceItems,
    createWorkspaceFile,
    createWorkspaceFolder,
    updateWorkspaceFileContent,
    deleteWorkspaceItem,
    onCreateAgent,
    requiresConfirmationTools,
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const activeAgent = agents.find((a) => a.id === activeSession?.agentId);

  const activeTask: Task | null = activeSession
    ? {
        id: activeSession.id,
        title: activeSession.title,
        goal:
          activeSession.messages.find((m) => m.sender === "user")?.content ||
          activeSession.title,
        creator: { type: "human", id: "user", name: "User" },
        assignedAgentId: activeSession.agentId,
        status:
          activeSession.taskStatus || (isStreaming ? "running" : "completed"),
        subTaskIds: [],
        messages: activeSession.messages,
        createdAt: activeSession.createdAt,
        updatedAt: activeSession.updatedAt,
      }
    : null;

  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);

  const handleUploadFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;

    let uploadsFolder = workspaceItems.find(
      (item: any) =>
        item.type === "folder" &&
        item.name.toLowerCase() === "uploads" &&
        item.parentId === null,
    );
    let uploadsFolderId = uploadsFolder?.id;
    if (!uploadsFolderId) {
      uploadsFolderId = await createWorkspaceFolder("uploads", null);
    }

    if (processUploadedFiles) {
      await processUploadedFiles(files, uploadsFolderId);
    }

    const fileNames = files.map((f) => f.name);
    setAttachedFiles((prev) => [...prev, ...fileNames]);
  };

  const handleRemoveAttachedFile = (fileName: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f !== fileName));
  };

  const handleSubmitUserMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && attachedFiles.length === 0) return;

    let finalPrompt = inputText.trim();
    if (attachedFiles.length > 0) {
      const fileList = attachedFiles.map((f) => `/uploads/${f}`).join(", ");
      finalPrompt = finalPrompt
        ? `${finalPrompt}\n\n[Attached workspace files: ${fileList}]`
        : `Please inspect the attached workspace files: ${fileList}`;
    }

    setInputText("");
    setAttachedFiles([]);
    handleSendMessage(finalPrompt);
  };

  return (
    <div
      id="chat-tab"
      className={`flex-1 flex h-full overflow-hidden transition-colors ${getThemeBackgroundClasses(previewStyle)} ${getThemeTextClasses(previewStyle)}`}
    >
      {/* 1. Left Sidebar panel */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        agents={agents}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
        onSelectSession={handleSelectSession}
        activeAgentId={activeAgentId}
        setActiveAgentId={setActiveAgentId}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* 2. Chat Feed & input panels wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative transition-colors bg-[var(--theme-bg,#070c18)] text-[var(--theme-text,#f1f5f9)]">
        {/* Active Session Header details */}
        <div className="px-5 py-3.5 border-b border-[var(--theme-border,#141d30)] bg-[var(--theme-card,#101726)] flex items-center justify-between select-none shrink-0">
          {activeSession ? (
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 flex items-center justify-center bg-[var(--theme-sidebar,#0b101f)] border border-[var(--theme-border,#141d30)] rounded-xl shrink-0">
                {renderAgentAvatar(
                  activeAgent?.avatar,
                  activeAgent?.name || "Agent",
                )}
              </span>
              <div>
                <h2 className="text-xs font-bold text-[var(--theme-text,#f1f5f9)] tracking-wide uppercase font-sans">
                  {activeAgent?.name || "Agent"}
                </h2>
                <p className="text-[10px] text-[var(--theme-text-muted,#94a3b8)] mt-0.5 font-mono">
                  ACTIVE AGENT ID:{" "}
                  <span className="text-[var(--theme-text,#f1f5f9)] font-semibold">
                    {activeAgent?.id}
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-mono text-[var(--theme-accent,#10b981)]">&gt;_</span>
              <div>
                <h2 className="text-xs font-bold text-[var(--theme-text-muted,#94a3b8)] tracking-wider uppercase font-mono">
                  STANDBY
                </h2>
              </div>
            </div>
          )}
        </div>

        {/* 3. Messages render area */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <ChatMessageList
            messages={activeSession?.messages || []}
            agents={agents}
            activeAgent={activeAgent}
            onSelectPrompt={(text) => handleSendMessage(text)}
            isStreaming={isStreaming}
            editingMessageId={editingMessageId}
            setEditingMessageId={setEditingMessageId}
            editBuffer={editBuffer}
            setEditBuffer={setEditBuffer}
            onSaveEdit={handleSaveUserMessageEdit}
            onSplitChat={handleSplitChat}
            onRegenerate={handleRegenerate}
            onApproveTool={handleApproveTool}
            onRejectTool={handleRejectTool}
            previewStyle={previewStyle}
            activeTask={activeTask}
          />
        </div>

        {/* 4. Text submission area */}
        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          isStreaming={isStreaming}
          onSendMessage={handleSubmitUserMessage}
          onStopStreaming={handleStopStreaming}
          onUploadFiles={handleUploadFiles}
          attachedFiles={attachedFiles}
          onRemoveAttachedFile={handleRemoveAttachedFile}
        />
      </div>
    </div>
  );
}

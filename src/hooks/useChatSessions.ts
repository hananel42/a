/**
 * @file useChatSessions.ts
 * @description Highly modular React Hook managing multi-agent chat sessions, thread state,
 * streaming delta aggregators, message branching/editing, and step-by-step tool approval.
 * Implements functional state updates to eliminate closure-stale memory race conditions.
 *
 * Capabilities:
 * - Session creation, storage synchronization, and absolute state thread safety.
 * - Handles non-stale updates on streaming LLM token chunks and step mutations.
 * - Dynamic AbortController registration for cancelable stream execution.
 */

import { useState, useEffect, useRef } from "react";
import {
  Agent,
  ChatSession,
  Message,
  ToolCallStep,
  MessagePart,
} from "../types/agent";
import { runAgentConversation } from "../services/agentEngine";

const CHAT_SESSIONS_STORAGE_KEY = "agentic_hub_chats_v2";

interface UseChatSessionsParams {
  agents: Agent[];
  apiKey: string;
  apiBaseUrl: string;
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
}

export function useChatSessions({
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
}: UseChatSessionsParams) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeAgentId, setActiveAgentId] = useState<string>(() => {
    return (
      localStorage.getItem("agent_hub_active_agent_id") ||
      agents[0]?.id ||
      "assistant"
    );
  });
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingConfirmationsRef = useRef<
    Record<string, (allowed: boolean) => void>
  >({});
  const subHistoriesRef = useRef<Record<string, Message[]>>({});
  const agentsRef = useRef<Agent[]>(agents);
  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);

  const hasLoadedRef = useRef(false);

  // 1. Sync Sessions on Mount
  useEffect(() => {
    if (agents.length === 0 || hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const saved = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
    let loaded: ChatSession[] = [];
    if (saved) {
      try {
        loaded = JSON.parse(saved);
      } catch {
        loaded = [];
      }
    }
    if (loaded.length > 0) {
      setSessions(loaded);
      const lastActiveSessionId = localStorage.getItem(
        "agent_hub_active_session_id",
      );
      const exists = loaded.some((s) => s.id === lastActiveSessionId);
      if (lastActiveSessionId && exists) {
        setActiveSessionId(lastActiveSessionId);
      } else {
        setActiveSessionId(loaded[0].id);
      }
    } else {
      const defaultAgentId =
        localStorage.getItem("agent_hub_active_agent_id") || "admin";
      const agent = agents.find((a) => a.id === defaultAgentId) || agents[0];
      if (agent) {
        const initialSession: ChatSession = {
          id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          agentId: agent.id,
          title: `Chat with ${agent.name}`,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSessions([initialSession]);
        setActiveSessionId(initialSession.id);
        localStorage.setItem(
          CHAT_SESSIONS_STORAGE_KEY,
          JSON.stringify([initialSession]),
        );
      }
    }
  }, [agents]);

  // Persist activeSessionId changes
  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem("agent_hub_active_session_id", activeSessionId);
    }
  }, [activeSessionId]);

  const saveSessionsState = (next: ChatSession[]) => {
    setSessions(next);
    localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(next));
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  const handleSetActiveAgentId = (id: string) => {
    setActiveAgentId(id);
    localStorage.setItem("agent_hub_active_agent_id", id);

    setSessions((prev) => {
      // Find non-empty existing session for this agent
      const agentSession = prev.find(
        (s) => s.agentId === id && s.messages.length > 0,
      );
      if (agentSession) {
        const cleaned = prev.filter(
          (s) => s.id === agentSession.id || s.messages.length > 0,
        );
        localStorage.setItem(
          CHAT_SESSIONS_STORAGE_KEY,
          JSON.stringify(cleaned),
        );
        setActiveSessionId(agentSession.id);
        return cleaned;
      }

      // Check if an empty session already exists for this agent
      const existingEmpty = prev.find(
        (s) => s.agentId === id && s.messages.length === 0,
      );
      if (existingEmpty) {
        const cleaned = prev.filter(
          (s) => s.id === existingEmpty.id || s.messages.length > 0,
        );
        localStorage.setItem(
          CHAT_SESSIONS_STORAGE_KEY,
          JSON.stringify(cleaned),
        );
        setActiveSessionId(existingEmpty.id);
        return cleaned;
      }

      // Create a brand new empty session for this agent and purge other unpopulated empty sessions
      const agent = agents.find((a) => a.id === id);
      const newSession: ChatSession = {
        id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        agentId: id,
        title: agent ? `Chat with ${agent.name}` : "New Chat",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const cleanedPrev = prev.filter((s) => s.messages.length > 0);
      const updated = [newSession, ...cleanedPrev];
      localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(updated));
      setActiveSessionId(newSession.id);
      return updated;
    });
  };

  const handleSelectSession = (sessionId: string) => {
    setSessions((prev) => {
      const session = prev.find((s) => s.id === sessionId);
      if (!session) return prev;

      // Purge any unpopulated empty sessions when switching active session
      const cleaned = prev.filter(
        (s) => s.id === sessionId || s.messages.length > 0,
      );
      localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(cleaned));
      setActiveSessionId(session.id);
      setActiveAgentId(session.agentId);
      localStorage.setItem("agent_hub_active_agent_id", session.agentId);
      return cleaned;
    });
  };

  // 2. Create Session
  const handleCreateSession = (agentId?: string) => {
    const targetAgentId =
      agentId ||
      activeAgentId ||
      (agents && agents.length > 0 ? agents[0].id : "");
    const agent = agents.find((a) => a.id === targetAgentId) || agents[0];
    if (!agent) return;

    const newSession: ChatSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      agentId: agent.id,
      title: `Chat with ${agent.name}`,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSessions((prev) => {
      const cleanedPrev = prev.filter((s) => s.messages.length > 0);
      const updated = [newSession, ...cleanedPrev];
      localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(updated));
      setActiveSessionId(newSession.id);
      setActiveAgentId(agent.id);
      localStorage.setItem("agent_hub_active_agent_id", agent.id);
      return updated;
    });
  };

  // 3. Delete Session
  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    if (updated.length === 0) {
      // Re-initialize default session for active agent
      const agent = agents.find((a) => a.id === activeAgentId) || agents[0];
      if (agent) {
        const initialSession: ChatSession = {
          id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          agentId: agent.id,
          title: `Chat with ${agent.name}`,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        saveSessionsState([initialSession]);
        setActiveSessionId(initialSession.id);
        setActiveAgentId(initialSession.agentId);
      }
    } else {
      saveSessionsState(updated);
      if (activeSessionId === id) {
        const nextSession = updated[0];
        setActiveSessionId(nextSession.id);
        setActiveAgentId(nextSession.agentId);
        localStorage.setItem("agent_hub_active_agent_id", nextSession.agentId);
      }
    }
  };

  // 4. Trigger Agent reply pipeline
  const triggerAgentReply = async (
    sessionToRun: ChatSession,
    customHistory?: Message[],
  ) => {
    const agent = agents.find((a) => a.id === sessionToRun.agentId);
    if (!agent) return;

    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const historyToFeed = customHistory || sessionToRun.messages;
    const assistantMsgId = `assistant-msg-${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      sender: "assistant",
      agentId: agent.id,
      content: "",
      timestamp: new Date().toISOString(),
      steps: [],
    };

    // Pre-insert assistant message placeholder
    setSessions((prev) => {
      const next = prev.map((s) => {
        if (s.id !== sessionToRun.id) return s;
        return {
          ...s,
          messages: [...historyToFeed, initialAssistantMsg],
          updatedAt: new Date().toISOString(),
        };
      });
      localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    const currentAgentsList = agentsRef.current.length > 0 ? agentsRef.current : agents;
    try {
      await runAgentConversation({
        agent,
        allAgents: currentAgentsList,
        chatHistory: historyToFeed,
        apiKey,
        baseURL: apiBaseUrl,
        model,
        workspaceItems,
        toolContext: {
          items: workspaceItems,
          createFile: createWorkspaceFile,
          createFolder: createWorkspaceFolder,
          updateFileContent: updateWorkspaceFileContent,
          deleteFile: deleteWorkspaceItem,
          allAgents: currentAgentsList,
          onCreateAgent: async (
            name,
            desc,
            instructions,
            allowedTools,
            avatar,
            allowedReadPaths,
            allowedWritePaths,
            defaultModel,
          ) => {
            return await onCreateAgent(
              name,
              desc,
              instructions,
              allowedTools,
              avatar || "brain",
              allowedReadPaths || ["/"],
              allowedWritePaths || ["/"],
              defaultModel,
            );
          },
          onTriggerAgent: async (
            targetAgentId: string,
            promptText: string,
            resumeId?: string,
            onProgress?: (
              subContent: string,
              subParts?: MessagePart[],
              subSteps?: ToolCallStep[],
            ) => void,
          ) => {
            const triggerSubAgent = async (
              subTargetId: string,
              subPromptText: string,
              subResumeId?: string,
              subOnProgress?: (
                subContent: string,
                subParts?: MessagePart[],
                subSteps?: ToolCallStep[],
              ) => void,
            ): Promise<{ status: string; id: string; msg: string }> => {
              const currentAgents = agentsRef.current.length > 0 ? agentsRef.current : agents;
              const targetAgent = currentAgents.find(
                (a) =>
                  a.id.toLowerCase() === subTargetId.toLowerCase() ||
                  a.name.toLowerCase() === subTargetId.toLowerCase(),
              );
              if (!targetAgent) {
                return {
                  status: "failed",
                  id: subResumeId || "",
                  msg: `Error: Sub-agent "${subTargetId}" not found. Available agents: ${currentAgents.map((a) => a.id).join(", ")}`,
                };
              }

              const subSessionId =
                subResumeId && subResumeId.trim()
                  ? subResumeId.trim()
                  : `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

              const existingHistory = subHistoriesRef.current[subSessionId] || [];

              const userMessage: Message = {
                id: `msg-sub-user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                sender: "user",
                content: subPromptText,
                timestamp: new Date().toISOString(),
              };

              const historyToFeed: Message[] = [...existingHistory, userMessage];

              try {
                const subResultText = await runAgentConversation({
                  agent: targetAgent,
                  allAgents: currentAgents,
                  chatHistory: historyToFeed,
                  apiKey,
                  baseURL: apiBaseUrl,
                  model,
                  workspaceItems,
                  toolContext: {
                    items: workspaceItems,
                    createFile: createWorkspaceFile,
                    createFolder: createWorkspaceFolder,
                    updateFileContent: updateWorkspaceFileContent,
                    deleteFile: deleteWorkspaceItem,
                    allAgents: currentAgents,
                    onCreateAgent: async (
                      name,
                      desc,
                      instructions,
                      allowedTools,
                      avatar,
                      allowedReadPaths,
                      allowedWritePaths,
                      defaultModel,
                    ) => {
                      return await onCreateAgent(
                        name,
                        desc,
                        instructions,
                        allowedTools,
                        avatar || "brain",
                        allowedReadPaths || ["/"],
                        allowedWritePaths || ["/"],
                        defaultModel,
                      );
                    },
                    onTriggerAgent: (
                      nestedTargetId,
                      nestedPrompt,
                      nestedResumeId,
                      nestedProgress,
                    ) => {
                      return triggerSubAgent(
                        nestedTargetId,
                        nestedPrompt,
                        nestedResumeId,
                        nestedProgress,
                      );
                    },
                    requiresConfirmationTools,
                    requestConfirmation: async (toolName, args, stepId) => {
                      return new Promise<boolean>((resolve) => {
                        pendingConfirmationsRef.current[
                          stepId || "pending-step"
                        ] = resolve;
                      });
                    },
                  },
                  signal: controller.signal,
                  onMessageUpdate: (subContent, subParts, subSteps) => {
                    if (subOnProgress) {
                      subOnProgress(subContent, subParts, subSteps);
                    }
                  },
                });

                if (!subResultText || !subResultText.trim()) {
                  throw new Error(`Sub-agent "${targetAgent.name}" (${targetAgent.id}) produced an empty response.`);
                }

                const assistantMessage: Message = {
                  id: `msg-sub-assistant-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  sender: "assistant",
                  agentId: targetAgent.id,
                  content: subResultText,
                  timestamp: new Date().toISOString(),
                };

                subHistoriesRef.current[subSessionId] = [
                  ...historyToFeed,
                  assistantMessage,
                ];

                return {
                  status: "completed",
                  id: subSessionId,
                  msg: subResultText,
                };
              } catch (err: any) {
                const errorMsg = `Error running sub-agent "${targetAgent.name}": ${err.message || String(err)}`;
                console.error(`[useChatSessions] Sub-agent failure (${targetAgent.id}):`, err);
                return {
                  status: "failed",
                  id: subSessionId,
                  msg: errorMsg,
                };
              }
            };

            return await triggerSubAgent(
              targetAgentId,
              promptText,
              resumeId,
              onProgress,
            );
          },
          requiresConfirmationTools,
          requestConfirmation: async (toolName, args, stepId) => {
            return new Promise<boolean>((resolve) => {
              pendingConfirmationsRef.current[stepId || "pending-step"] =
                resolve;
            });
          },
        },
        signal: controller.signal,
        onMessageUpdate: (content, parts, steps) => {
          setSessions((prev) => {
            const next = prev.map((s) => {
              if (s.id !== sessionToRun.id) return s;
              return {
                ...s,
                messages: s.messages.map((m) => {
                  if (m.id === assistantMsgId) {
                    return { ...m, content, parts, steps };
                  }
                  return m;
                }),
              };
            });
            localStorage.setItem(
              CHAT_SESSIONS_STORAGE_KEY,
              JSON.stringify(next),
            );
            return next;
          });
        },
      });
    } catch (err: any) {
      console.error("[useChatSessions] Main agent conversation error:", err);
      const isAborted = err.name === "AbortError" || controller.signal.aborted;
      const errorSuffix = isAborted
        ? "\n\n*Stream cancelled by user.*"
        : `\n\n**API Connection Error**: ${err.message || err}`;

      setSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id !== sessionToRun.id) return s;
          return {
            ...s,
            messages: s.messages.map((m) => {
              if (m.id === assistantMsgId) {
                const cleanedParts = m.parts?.map((p) =>
                  p.type === "thinking"
                    ? { ...p, isStreamingReasoning: false }
                    : p,
                ) || [];
                const cleanedSteps = m.steps?.map((step) =>
                  step.status === "running" ||
                  step.status === "queued" ||
                  step.status === "pending_approval"
                    ? { ...step, status: "cancelled" as const }
                    : step,
                );

                const hasErrorAlready = cleanedParts.some(
                  (p) => p.type === "text" && p.content?.includes(errorSuffix.trim()),
                );
                const updatedParts = hasErrorAlready
                  ? cleanedParts
                  : [
                      ...cleanedParts,
                      {
                        id: `part-err-${Date.now()}`,
                        type: "text" as const,
                        content: errorSuffix,
                      },
                    ];

                return {
                  ...m,
                  content:
                    (m.content || "") +
                    (isAborted && m.content.includes("cancelled by user")
                      ? ""
                      : m.content.includes(errorSuffix.trim())
                      ? ""
                      : errorSuffix),
                  parts: updatedParts,
                  steps: cleanedSteps,
                };
              }
              return m;
            }),
          };
        });
        localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // 5. Send User Message
  const handleSendMessage = async (
    e?: React.FormEvent | string,
    directText?: string,
  ) => {
    if (e && typeof e !== "string" && "preventDefault" in e) {
      e.preventDefault();
    }

    const messageText = typeof e === "string" ? e : directText || inputText;
    if (!messageText.trim() || isStreaming) return;

    let targetSession = activeSession;
    if (!targetSession) {
      const agent = agents.find((a) => a.id === activeAgentId) || agents[0];
      const newSession: ChatSession = {
        id: `session-${Date.now()}`,
        agentId: agent.id,
        title: messageText.substring(0, 30) + "...",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      targetSession = newSession;
      setActiveSessionId(newSession.id);
    }

    const userMessage: Message = {
      id: `user-msg-${Date.now()}`,
      sender: "user",
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    const updatedSession = {
      ...targetSession,
      messages: [...targetSession.messages, userMessage],
      title:
        targetSession.messages.length === 0
          ? messageText.substring(0, 30) + "..."
          : targetSession.title,
      updatedAt: new Date().toISOString(),
    };

    if (typeof e !== "string" && !directText) {
      setInputText("");
    }
    setSessions((prev) => {
      const exists = prev.find((s) => s.id === updatedSession.id);
      let next;
      if (exists) {
        next = prev.map((s) =>
          s.id === updatedSession.id ? updatedSession : s,
        );
      } else {
        next = [updatedSession, ...prev];
      }
      localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    await triggerAgentReply(updatedSession, updatedSession.messages);
  };

  // 6. User Edit Message
  const handleSaveUserMessageEdit = async () => {
    if (
      !activeSession ||
      !editingMessageId ||
      !editBuffer.trim() ||
      isStreaming
    )
      return;

    const targetIdx = activeSession.messages.findIndex(
      (m) => m.id === editingMessageId,
    );
    if (targetIdx === -1) return;

    const truncatedMessages = activeSession.messages
      .slice(0, targetIdx + 1)
      .map((m) =>
        m.id === editingMessageId
          ? { ...m, content: editBuffer, timestamp: new Date().toISOString() }
          : m,
      );

    const updatedSession = {
      ...activeSession,
      messages: truncatedMessages,
      updatedAt: new Date().toISOString(),
    };

    setEditingMessageId(null);
    setEditBuffer("");

    setSessions((prev) => {
      const next = prev.map((s) =>
        s.id === activeSession.id ? updatedSession : s,
      );
      localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    await triggerAgentReply(updatedSession, truncatedMessages);
  };

  // 7. Split Conversation
  const handleSplitChat = (idx: number) => {
    if (!activeSession) return;
    const splitMessages = activeSession.messages.slice(0, idx + 1);

    const newSession: ChatSession = {
      id: `session-split-${Date.now()}`,
      agentId: activeSession.agentId,
      title: `${activeSession.title} (Branch)`,
      messages: splitMessages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newSession, ...sessions];
    saveSessionsState(updated);
    setActiveSessionId(newSession.id);
  };

  // 8. Regenerate last message
  const handleRegenerate = async () => {
    if (!activeSession || isStreaming || activeSession.messages.length < 2)
      return;
    const withoutLast = activeSession.messages.slice(0, -1);
    const updatedSession = {
      ...activeSession,
      messages: withoutLast,
    };

    setSessions((prev) => {
      const next = prev.map((s) =>
        s.id === activeSession.id ? updatedSession : s,
      );
      localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    await triggerAgentReply(updatedSession, withoutLast);
  };

  // 9. Abort operations
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Resolve any pending confirmation promises immediately so they don't block
    Object.values(pendingConfirmationsRef.current).forEach((resolve) =>
      resolve(false),
    );
    pendingConfirmationsRef.current = {};
    setIsStreaming(false);
  };

  // 10. Confirmation resolution
  const handleApproveTool = (stepId: string) => {
    const resolve =
      pendingConfirmationsRef.current[stepId] ||
      pendingConfirmationsRef.current["pending-step"];
    if (resolve) {
      resolve(true);
      delete pendingConfirmationsRef.current[stepId];
      delete pendingConfirmationsRef.current["pending-step"];
    }

    setSessions((prev) => {
      const next = prev.map((s) => {
        if (s.id !== activeSessionId) return s;
        return {
          ...s,
          messages: s.messages.map((m) => {
            if (!m.steps) return m;
            return {
              ...m,
              steps: m.steps.map((step) =>
                step.id === stepId
                  ? { ...step, status: "running" as const }
                  : step,
              ),
            };
          }),
        };
      });
      localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleRejectTool = (stepId: string) => {
    const resolve =
      pendingConfirmationsRef.current[stepId] ||
      pendingConfirmationsRef.current["pending-step"];
    if (resolve) {
      resolve(false);
      delete pendingConfirmationsRef.current[stepId];
      delete pendingConfirmationsRef.current["pending-step"];
    }

    setSessions((prev) => {
      const next = prev.map((s) => {
        if (s.id !== activeSessionId) return s;
        return {
          ...s,
          messages: s.messages.map((m) => {
            if (!m.steps) return m;
            return {
              ...m,
              steps: m.steps.map((step) =>
                step.id === stepId
                  ? {
                      ...step,
                      status: "error" as const,
                      output: "Rejected by security check.",
                    }
                  : step,
              ),
            };
          }),
        };
      });
      localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleResumeTaskWithInstruction = (
    sessionId: string,
    instructionText: string,
  ) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    handleSendMessage(instructionText);
  };

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    activeAgentId,
    setActiveAgentId: handleSetActiveAgentId,
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
  };
}

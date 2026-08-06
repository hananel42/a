/**
 * @file taskEngine.ts
 * @description Task Execution Engine. Orchestrates Task processing, agent execution loops,
 * non-recursive sub-task queue delegation, and clarification pause/resume state machine logic.
 *
 * Key Responsibilities:
 * - Executes tasks assigned to Agents using the streaming agent engine.
 * - Non-recursive sub-task creation and queue orchestration.
 * - Pauses execution when an agent requests clarification from user/creator.
 * - Resumes task execution when clarification answers are provided.
 */

import { Task, TaskCreator, TaskStatus } from "../types/task";
import { Agent, Message, ToolCallStep, MessagePart } from "../types/agent";
import { runAgentConversation } from "./agentEngine";
import { TaskQueueEngine } from "./taskQueue";
import { ToolContext } from "./mcpExecutor";
import { DEFAULT_PERMISSIONS } from "../data/defaultAgents";

export interface TaskEngineParams {
  task: Task;
  agent: Agent;
  allAgents: Agent[];
  apiKey: string;
  baseURL?: string;
  model: string;
  workspaceItems: any[];
  queueEngine: TaskQueueEngine;
  signal: AbortSignal;
  onTaskUpdate: (updatedTask: Task) => void;
  onSubTaskCreated?: (subTask: Task) => void;
  requestConfirmation?: (toolName: string, args: any) => Promise<boolean>;
  requiresConfirmationTools?: string[];
  createFile?: (
    name: string,
    parentId: string | null,
    content?: string,
  ) => Promise<string>;
  createFolder?: (name: string, parentId: string | null) => Promise<string>;
  updateFileContent?: (id: string, content: string) => Promise<void>;
  deleteFile?: (id: string) => Promise<void>;
  onCreateAgent: (
    name: string,
    desc: string,
    instructions: string,
    allowedTools: string[],
    avatar?: string,
    allowedReadPaths?: string[],
    allowedWritePaths?: string[],
    defaultModel?: string,
  ) => Promise<string>;
  onProgress?: (
    subContent: string,
    subParts?: MessagePart[],
    subSteps?: ToolCallStep[],
  ) => void;
}

/**
 * Executes a single Task unit through the streaming agent engine.
 */
export async function executeTaskUnit({
  task,
  agent,
  allAgents,
  apiKey,
  baseURL,
  model,
  workspaceItems,
  queueEngine,
  signal,
  onTaskUpdate,
  onSubTaskCreated,
  requestConfirmation,
  requiresConfirmationTools,
  createFile,
  createFolder,
  updateFileContent,
  deleteFile,
  onCreateAgent,
  onProgress,
}: TaskEngineParams): Promise<Task> {
  const mutableAllAgents = [...allAgents];
  let currentTask = {
    ...task,
    status: "thinking" as TaskStatus,
    updatedAt: new Date().toISOString(),
  };
  onTaskUpdate(currentTask);
  queueEngine.updateTask(currentTask.id, currentTask);

  // Prepare Assistant message container in history if needed
  let assistantMessageId = `msg-ast-${Date.now()}`;
  let existingAssistantMsg = currentTask.messages.find(
    (m) => m.id === assistantMessageId,
  );
  if (!existingAssistantMsg) {
    existingAssistantMsg = {
      id: assistantMessageId,
      sender: "assistant",
      agentId: agent.id,
      content: "",
      timestamp: new Date().toISOString(),
      steps: [],
      parts: [],
    };
    currentTask = {
      ...currentTask,
      status: "running",
      messages: [...currentTask.messages, existingAssistantMsg],
      updatedAt: new Date().toISOString(),
    };
    onTaskUpdate(currentTask);
    queueEngine.updateTask(currentTask.id, currentTask);
  }

  // Define handler for Sub-task creation / re-triggering (delegation)
  const handleTriggerAgent = async (
    targetAgentId: string,
    subTaskMessage: string,
    existingTaskId?: string,
    subOnProgress?: (
      subContent: string,
      subParts?: MessagePart[],
      subSteps?: ToolCallStep[],
    ) => void,
  ): Promise<string> => {
    const targetAgent = mutableAllAgents.find((a) => a.id === targetAgentId);
    if (!targetAgent) {
      return `Error: Target agent "${targetAgentId}" not found. Available agents: ${mutableAllAgents.map((a) => a.id).join(", ")}`;
    }

    let subTask: Task;

    if (existingTaskId && queueEngine.getTask(existingTaskId)) {
      // Re-trigger / Resume existing task by ID
      const existing = queueEngine.getTask(existingTaskId)!;
      subTask = {
        ...existing,
        status: "pending",
        assignedAgentId: targetAgent.id,
        messages: [
          ...existing.messages,
          {
            id: `msg-sub-usr-${Date.now()}`,
            sender: "user",
            content: `[Follow-up instruction on task ${existingTaskId}]: ${subTaskMessage}`,
            timestamp: new Date().toISOString(),
          },
        ],
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Create new sub-task with unique auto-generated ID
      const subTaskId = `task-sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      subTask = {
        id: subTaskId,
        title: `Sub-task: ${subTaskMessage.slice(0, 30)}...`,
        goal: subTaskMessage,
        creator: { type: "agent", id: agent.id, name: agent.name },
        assignedAgentId: targetAgent.id,
        status: "pending",
        parentTaskId: currentTask.id,
        rootTaskId: currentTask.rootTaskId || currentTask.id,
        subTaskIds: [],
        messages: [
          {
            id: `msg-sub-user-${Date.now()}`,
            sender: "user",
            content: subTaskMessage,
            timestamp: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Register subtask in current task's subTaskIds
      currentTask = {
        ...currentTask,
        subTaskIds: Array.from(new Set([...currentTask.subTaskIds, subTaskId])),
      };
      onTaskUpdate(currentTask);
    }

    queueEngine.enqueue(subTask, 10); // Enqueue subtask with higher priority
    if (onSubTaskCreated) onSubTaskCreated(subTask);

    // Execute subtask non-recursively
    const completedSubTask = await executeTaskUnit({
      task: subTask,
      agent: targetAgent,
      allAgents: mutableAllAgents,
      apiKey,
      baseURL,
      model,
      workspaceItems,
      queueEngine,
      signal,
      onTaskUpdate: (st) => {
        queueEngine.updateTask(st.id, st);
      },
      onSubTaskCreated,
      requestConfirmation,
      requiresConfirmationTools,
      createFile,
      createFolder,
      updateFileContent,
      deleteFile,
      onCreateAgent,
      onProgress: subOnProgress,
    });

    const isSuccess =
      completedSubTask.status === "completed" &&
      completedSubTask.result?.success !== false;
    const resultMsg =
      completedSubTask.result?.message || "Agent response received.";

    return `[Response from Agent "${targetAgent.name}"]\n- Task ID: ${completedSubTask.id}\n- Completed: ${isSuccess ? "Yes" : "No"}\n- Message:\n${resultMsg}`;
  };

  const toolContext: ToolContext = {
    items: workspaceItems,
    createFile,
    createFolder,
    updateFileContent,
    deleteFile,
    onTriggerAgent: handleTriggerAgent,
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
      const cleanId = await onCreateAgent(
        name,
        desc,
        instructions,
        allowedTools,
        avatar,
        allowedReadPaths,
        allowedWritePaths,
        defaultModel,
      );
      if (!mutableAllAgents.some((a) => a.id === cleanId)) {
        mutableAllAgents.push({
          id: cleanId,
          name,
          description: desc,
          instructions,
          avatar: avatar || "brain",
          permissions: {
            ...DEFAULT_PERMISSIONS,
            allowedTools: allowedTools || ["read_file", "list_dir"],
            allowedPaths: ["/"],
            allowedReadPaths: allowedReadPaths || ["/"],
            allowedWritePaths: allowedWritePaths || ["/"],
            allowAgentFolderAccess: false,
          },
          defaultModel,
          isDefault: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      return cleanId;
    },
  };

  try {
    const finalResultText = await runAgentConversation({
      agent,
      allAgents,
      chatHistory: currentTask.messages.filter(
        (m) => m.id !== assistantMessageId,
      ),
      apiKey,
      baseURL,
      model,
      workspaceItems,
      toolContext: {
        ...toolContext,
        requestConfirmation,
        requiresConfirmationTools,
      },
      signal,
      onTextChunk: (chunk) => {},
      onMessageUpdate: (content, parts, steps) => {
        if (onProgress) {
          onProgress(content, parts, steps);
        }
        const updatedMessages = currentTask.messages.map((m) => {
          if (m.id === assistantMessageId) {
            return {
              ...m,
              content,
              parts,
              steps,
            };
          }
          return m;
        });

        currentTask = {
          ...currentTask,
          messages: updatedMessages,
          updatedAt: new Date().toISOString(),
        };
        onTaskUpdate(currentTask);
        queueEngine.updateTask(currentTask.id, currentTask);
      },
    });

    // Determine task outcome status
    const lowerText = finalResultText.toLowerCase();
    const isSuccess =
      !lowerText.includes("error:") &&
      !lowerText.includes("failed:") &&
      !lowerText.includes("unable to execute");

    currentTask = {
      ...currentTask,
      status: "completed",
      result: {
        taskId: currentTask.id,
        success: isSuccess,
        message: finalResultText,
        timestamp: new Date().toISOString(),
      },
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onTaskUpdate(currentTask);
    queueEngine.updateTask(currentTask.id, currentTask);

    return currentTask;
  } catch (err: any) {
    const isCancelled = signal.aborted;
    currentTask = {
      ...currentTask,
      status: isCancelled ? "cancelled" : "failed",
      result: {
        taskId: currentTask.id,
        success: false,
        message: isCancelled
          ? "Task was cancelled."
          : `Task execution error: ${err.message || err}`,
        timestamp: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };
    onTaskUpdate(currentTask);
    queueEngine.updateTask(currentTask.id, currentTask);
    return currentTask;
  }
}

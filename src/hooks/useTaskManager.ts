/**
 * @file useTaskManager.ts
 * @description Custom React hook managing the Task-Centric state, task queue engine,
 * active task tree resolution, clarification answering, and persistent storage synchronization.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Task, TaskStatus } from "../types/task";
import { Agent, AgentPermissions } from "../types/agent";
import { TaskQueueEngine } from "../services/taskQueue";
import { executeTaskUnit } from "../services/taskEngine";

const STORAGE_KEY = "ai_studio_tasks_v2";

export interface UseTaskManagerProps {
  agents: Agent[];
  defaultAgentId: string;
  apiKey: string;
  baseURL?: string;
  model: string;
  workspaceItems: any[];
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
  requestConfirmation?: (toolName: string, args: any) => Promise<boolean>;
  requiresConfirmationTools?: string[];
}

export function useTaskManager({
  agents,
  defaultAgentId,
  apiKey,
  baseURL,
  model,
  workspaceItems,
  createFile,
  createFolder,
  updateFileContent,
  deleteFile,
  onCreateAgent,
  requestConfirmation,
  requiresConfirmationTools,
}: UseTaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load tasks from localStorage", e);
    }
    return [];
  });

  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: Task[] = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0].id;
      } catch {}
    }
    return null;
  });

  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize Task Queue Engine
  const queueEngineRef = useRef<TaskQueueEngine>(new TaskQueueEngine(tasks));

  // Sync tasks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error("Failed to save tasks to localStorage", e);
    }
  }, [tasks]);

  // Ensure queue engine registry stays in sync
  useEffect(() => {
    tasks.forEach((t) => {
      queueEngineRef.current.updateTask(t.id, t);
    });
  }, [tasks]);

  /**
   * Helper to update a task in React state
   */
  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === updatedTask.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = updatedTask;
        return copy;
      }
      return [updatedTask, ...prev];
    });
  }, []);

  /**
   * Creates a new root Task created by Human
   */
  const createNewTask = useCallback(
    async (goal: string, assignedAgentId: string = defaultAgentId) => {
      const newTaskId = `task-${Date.now()}`;
      const assignedAgent =
        agents.find((a) => a.id === assignedAgentId) || agents[0];

      const newTask: Task = {
        id: newTaskId,
        title: goal.length > 35 ? goal.slice(0, 35) + "..." : goal,
        goal,
        creator: { type: "human", id: "user", name: "User" },
        assignedAgentId: assignedAgent.id,
        status: "pending",
        subTaskIds: [],
        messages: [
          {
            id: `msg-usr-${Date.now()}`,
            sender: "user",
            content: goal,
            timestamp: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTasks((prev) => [newTask, ...prev]);
      setActiveTaskId(newTaskId);
      queueEngineRef.current.enqueue(newTask, 1);

      // Trigger execution loop
      await runTaskExecution(newTask);
    },
    [agents, defaultAgentId],
  );

  /**
   * Core execution controller for a specific task
   */
  const runTaskExecution = useCallback(
    async (taskToRun: Task) => {
      if (!apiKey) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setRunningTaskId(taskToRun.id);

      const agent =
        agents.find((a) => a.id === taskToRun.assignedAgentId) || agents[0];

      try {
        await executeTaskUnit({
          task: taskToRun,
          agent,
          allAgents: agents,
          apiKey,
          baseURL,
          model,
          workspaceItems,
          queueEngine: queueEngineRef.current,
          signal: controller.signal,
          onTaskUpdate: handleTaskUpdate,
          onSubTaskCreated: (st) => {
            setTasks((prev) => [st, ...prev]);
          },
          requestConfirmation,
          requiresConfirmationTools,
          createFile,
          createFolder,
          updateFileContent,
          deleteFile,
          onCreateAgent,
        });
      } catch (err) {
        console.error("Task execution error:", err);
      } finally {
        setRunningTaskId(null);
      }
    },
    [
      agents,
      apiKey,
      baseURL,
      model,
      workspaceItems,
      handleTaskUpdate,
      requestConfirmation,
      requiresConfirmationTools,
      createFile,
      createFolder,
      updateFileContent,
      deleteFile,
      onCreateAgent,
    ],
  );

  /**
   * Re-triggers or resumes an existing task by its ID with new instructions or feedback.
   */
  const resumeTaskWithInstruction = useCallback(
    async (taskId: string, instructionText: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const answerMessage = {
        id: `msg-resume-${Date.now()}`,
        sender: "user" as const,
        content: instructionText,
        timestamp: new Date().toISOString(),
      };

      const updatedTask: Task = {
        ...task,
        status: "pending",
        messages: [...task.messages, answerMessage],
        updatedAt: new Date().toISOString(),
      };

      handleTaskUpdate(updatedTask);
      queueEngineRef.current.enqueue(updatedTask, 5);

      // Resume execution
      await runTaskExecution(updatedTask);
    },
    [tasks, handleTaskUpdate, runTaskExecution],
  );

  /**
   * Deletes a task and its sub-tasks
   */
  const deleteTask = useCallback(
    (taskId: string) => {
      setTasks((prev) =>
        prev.filter(
          (t) =>
            t.id !== taskId &&
            t.parentTaskId !== taskId &&
            t.rootTaskId !== taskId,
        ),
      );
      if (activeTaskId === taskId) {
        const remaining = tasks.filter(
          (t) => t.id !== taskId && t.parentTaskId !== taskId,
        );
        setActiveTaskId(remaining.length > 0 ? remaining[0].id : null);
      }
    },
    [tasks, activeTaskId],
  );

  /**
   * Aborts active task execution
   */
  const stopActiveTask = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setRunningTaskId(null);
  }, []);

  const activeTask = useMemo(() => {
    return tasks.find((t) => t.id === activeTaskId) || null;
  }, [tasks, activeTaskId]);

  const activeTaskTree = useMemo(() => {
    if (!activeTaskId) return [];
    return queueEngineRef.current.getTaskTree(activeTaskId);
  }, [tasks, activeTaskId]);

  return {
    tasks,
    activeTaskId,
    activeTask,
    activeTaskTree,
    runningTaskId,
    isTaskRunning: runningTaskId !== null,
    createNewTask,
    resumeTaskWithInstruction,
    deleteTask,
    stopActiveTask,
    setActiveTaskId,
  };
}

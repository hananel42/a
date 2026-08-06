/**
 * @file task.ts
 * @description Core data structures for Task-Centric Multi-Agent Execution Architecture.
 * A Task represents a unit of work assigned by a creator (Human or Agent) to an Agent.
 * Tasks can decompose recursively into sub-tasks (handled via Queue) or pause for clarification.
 */

import { Message, ToolCallStep } from "./agent";

export type TaskStatus =
  "pending" | "thinking" | "running" | "completed" | "failed" | "cancelled";

export interface TaskCreator {
  type: "human" | "agent";
  id: string;
  name: string;
}

/**
 * Structured response returned by every agent when completing or responding to a task.
 * Completed status (Yes/No), Task ID, and message detailing summary or next steps.
 */
export interface TaskResult {
  taskId: string;
  success: boolean;
  message: string;
  timestamp: string;
}

export interface Task {
  id: string; // Auto-generated unique ID
  title: string;
  goal: string;
  creator: TaskCreator;
  assignedAgentId: string;
  status: TaskStatus;
  parentTaskId?: string;
  rootTaskId?: string;
  subTaskIds: string[];
  result?: TaskResult;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/**
 * Task Queue Node for queue-driven processing without call-stack recursion
 */
export interface TaskQueueNode {
  task: Task;
  priority: number;
  addedAt: number;
}

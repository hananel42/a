/**
 * @file taskQueue.ts
 * @description In-memory Task Queue and DAG dependency algorithm engine.
 * Pure data structures and algorithmic queue management for executing tasks non-recursively.
 *
 * Key Responsibilities:
 * - Priority & FIFO Queue management for Task units.
 * - Non-recursive Task tree traversal and state transitions.
 * - Sub-task dependency resolution (parent waiting on sub-task queue completion).
 */

import { Task, TaskQueueNode, TaskStatus } from "../types/task";

export class TaskQueueEngine {
  private taskRegistry: Map<string, Task> = new Map();
  private queue: TaskQueueNode[] = [];

  constructor(initialTasks: Task[] = []) {
    initialTasks.forEach((task) => {
      this.taskRegistry.set(task.id, task);
      if (task.status === "pending" || task.status === "running") {
        this.enqueue(task);
      }
    });
  }

  /**
   * Adds a task to the queue with an optional priority score.
   */
  enqueue(task: Task, priority: number = 0): void {
    this.taskRegistry.set(task.id, task);

    // Avoid duplicate queue entries
    const existingIndex = this.queue.findIndex((n) => n.task.id === task.id);
    if (existingIndex !== -1) {
      this.queue[existingIndex] = { task, priority, addedAt: Date.now() };
    } else {
      this.queue.push({ task, priority, addedAt: Date.now() });
    }

    // Sort queue by priority (descending) and addedAt (ascending FIFO)
    this.queue.sort((a, b) => b.priority - a.priority || a.addedAt - b.addedAt);
  }

  /**
   * Dequeues the next pending task for execution.
   */
  dequeue(): Task | undefined {
    const node = this.queue.shift();
    return node?.task;
  }

  /**
   * Peeks at the next task without removing it.
   */
  peek(): Task | undefined {
    return this.queue[0]?.task;
  }

  /**
   * Retrieves a task by ID from the registry.
   */
  getTask(id: string): Task | undefined {
    return this.taskRegistry.get(id);
  }

  /**
   * Gets all tasks in the registry as an array.
   */
  getAllTasks(): Task[] {
    return Array.from(this.taskRegistry.values());
  }

  /**
   * Updates task properties in registry and synchronizes queue state if needed.
   */
  updateTask(id: string, patch: Partial<Task>): Task | undefined {
    const existing = this.taskRegistry.get(id);
    if (!existing) return undefined;

    const updated: Task = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    this.taskRegistry.set(id, updated);

    // If task was in queue, sync it
    const queueIndex = this.queue.findIndex((n) => n.task.id === id);
    if (queueIndex !== -1) {
      if (
        updated.status === "completed" ||
        updated.status === "failed" ||
        updated.status === "cancelled"
      ) {
        this.queue.splice(queueIndex, 1);
      } else {
        this.queue[queueIndex].task = updated;
      }
    }

    return updated;
  }

  /**
   * Finds all immediate sub-tasks for a given parent task.
   */
  getSubTasks(parentTaskId: string): Task[] {
    return Array.from(this.taskRegistry.values()).filter(
      (t) => t.parentTaskId === parentTaskId,
    );
  }

  /**
   * Performs an iterative BFS/Queue traversal to retrieve the entire sub-task tree.
   */
  getTaskTree(rootTaskId: string): Task[] {
    const tree: Task[] = [];
    const queue: string[] = [rootTaskId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const task = this.taskRegistry.get(currentId);
      if (task) {
        tree.push(task);
        const children = this.getSubTasks(currentId);
        for (const child of children) {
          queue.push(child.id);
        }
      }
    }

    return tree;
  }

  /**
   * Checks if all sub-tasks of a parent task have reached a terminal state.
   */
  areAllSubTasksCompleted(parentTaskId: string): boolean {
    const subTasks = this.getSubTasks(parentTaskId);
    if (subTasks.length === 0) return true;
    return subTasks.every(
      (st) =>
        st.status === "completed" ||
        st.status === "failed" ||
        st.status === "cancelled",
    );
  }

  /**
   * Formats sub-task outputs cleanly into a consolidated structured payload for the parent agent.
   */
  formatSubTaskResultsForParent(parentTaskId: string): string {
    const subTasks = this.getSubTasks(parentTaskId);
    if (subTasks.length === 0) return "No sub-tasks generated.";

    return subTasks
      .map((st, idx) => {
        const isDone =
          st.status === "completed" && st.result?.success !== false;
        const doneText = isDone ? "Completed: Yes" : "Completed: No";
        const msg =
          st.result?.message || "No detailed summary message received.";
        return `[Sub-task ${idx + 1}]\n- ID: ${st.id}\n- ${doneText}\n- Assigned Agent: ${st.assignedAgentId}\n- Goal: ${st.goal}\n- Summary/Instructions: ${msg}`;
      })
      .join("\n---\n");
  }

  /**
   * Queue length.
   */
  get size(): number {
    return this.queue.length;
  }
}

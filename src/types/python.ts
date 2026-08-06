/**
 * @file python.ts
 * @description Type definitions for the Python sandbox execution engine,
 * interactive console, stdin streams, and workspace file synchronization.
 */

export type PythonExecutionState =
  "idle" | "running" | "success" | "error" | "awaiting_input" | "timeout";

export interface PythonConsoleLog {
  id: string;
  type: "stdout" | "stderr" | "info" | "system" | "input" | "divider";
  text: string;
  timestamp: string;
}

export interface PythonExecutionResult {
  stdout: string;
  stderr: string;
  modifiedFiles?: Array<{ path: string; content: string }>;
  durationMs?: number;
  requiresInput?: boolean;
  error?: string;
}

export interface PythonExecutionOptions {
  code: string;
  filePath?: string;
  files?: any[];
  inputs?: string[];
  timeoutMs?: number;
  envVars?: Record<string, string>;
}

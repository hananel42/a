/**
 * @file types.ts
 * @module services/python
 * @description Type definitions and API contracts for the Python service layer.
 * Defines input parameters, options, streaming configurations, and result schemas
 * shared between workspace tools, code editor components, and Python execution handlers.
 *
 * Dependencies:
 * - ToolContext: context provided by custom tools.
 * - AgentPermissions: path and action authorization rules.
 * - WorkspaceItem: virtual workspace folder/file representations.
 */

import { ToolContext } from "../../tools/types";
import { AgentPermissions } from "../../types/agent";
import { WorkspaceItem } from "../../types/workspace";

/**
 * Low-level execution options passed when invoking the Python execution service
 * from system or user-facing tools.
 */
export interface PythonExecutionOptions {
  /** Python source code string to execute */
  code: string;
  /** Relative virtual path of the script within the workspace */
  filePath?: string;
  /** Virtual workspace files to synchronize into the runtime container */
  files: WorkspaceItem[];
  /** Optional sequence of pre-filled STDIN lines for interactive code */
  inputs?: string[];
  /** Execution context provided by tools (API keys, workspace items, update methods) */
  context: ToolContext;
  /** File access and permission bounds for the agent */
  permissions?: AgentPermissions;
  /** Flag identifying system internal execution vs user code execution */
  isSystemTool?: boolean;
}

/**
 * Standard execution result envelope containing STDOUT, STDERR, and updated workspace files.
 */
export interface PythonExecutionResult {
  stdout: string;
  stderr: string;
  modifiedFiles?: Array<{ path: string; content: string }>;
}

/**
 * Input parameters for executing Python scripts within the workspace UI environment.
 */
export interface WorkspacePythonParams {
  /** Python source code string to execute */
  code: string;
  /** Optional virtual path to script file */
  filePath?: string;
  /** Virtual workspace file list */
  files?: WorkspaceItem[];
  /** Interactive input array */
  inputs?: string[];
  /** All workspace items (files and folders) */
  items?: WorkspaceItem[];
  /** Workspace state update handlers */
  updateFileContent?: (id: string, content: string) => Promise<void> | void;
  createFile?: (
    name: string,
    parentId: string | null,
    content?: string,
    selectAfterCreate?: boolean,
  ) => Promise<string> | string;
  createFolder?: (
    name: string,
    parentId: string | null,
  ) => Promise<string> | string;
}

/**
 * Detailed metrics, status, and synchronization report returned from workspace execution calls.
 */
export interface DetailedPythonResult {
  /** Accumulated standard output */
  stdout: string;
  /** Accumulated standard error or warning diagnostic text */
  stderr: string;
  /** Total execution duration in milliseconds */
  durationMs: number;
  /** Array of files generated or modified during execution */
  modifiedFiles: Array<{ path: string; content: string }>;
  /** Virtual workspace paths successfully updated */
  syncedPaths: string[];
  /** Indicates whether the program was interrupted awaiting interactive input */
  requiresInput: boolean;
  /** Boolean execution status flag */
  success: boolean;
  /** High-level error summary message if execution failed */
  error?: string;
  /** The extracted prompt string when script expects interactive input */
  extractedPrompt?: string;
}

/**
 * Extension of parameters supporting real-time output chunk callbacks.
 */
export interface WorkspacePythonStreamParams extends WorkspacePythonParams {
  /** Callback fired whenever standard output or error receives new text */
  onChunk?: (chunk: { type: "stdout" | "stderr"; text: string }) => void;
}

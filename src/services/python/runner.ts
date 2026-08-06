/**
 * @file runner.ts
 * @module services/python
 * @description Core implementation of the Python execution service API using Pyodide WebAssembly.
 * Provides entry points for low-level MCP tool execution and high-level workspace UI execution,
 * with structured error handling, callback notifications, and outcome reporting.
 */

import {
  PythonExecutionOptions,
  DetailedPythonResult,
  WorkspacePythonStreamParams,
  WorkspacePythonParams,
} from "./types";
import { runPyodideCode } from "./pyodideEngine";
import { findItemByPath } from "../../tools/types";
import { WorkspaceItem } from "../../types/workspace";

/**
 * Helper to sync modified virtual files back to workspace state.
 */
async function syncModifiedFilesToWorkspace(
  modifiedFiles: Array<{ path: string; content: string }>,
  items: WorkspaceItem[] = [],
  updateFileContent?: (id: string, content: string) => Promise<void> | void,
  createFile?: (
    name: string,
    parentId: string | null,
    content?: string,
  ) => Promise<string> | string,
  createFolder?: (
    name: string,
    parentId: string | null,
  ) => Promise<string> | string,
): Promise<string[]> {
  const syncedPaths: string[] = [];
  if (!modifiedFiles || modifiedFiles.length === 0) return syncedPaths;

  for (const mod of modifiedFiles) {
    const cleanPath = mod.path.startsWith("/") ? mod.path.slice(1) : mod.path;
    const existingItem = findItemByPath(cleanPath, items, true);

    if (existingItem && existingItem.type === "file") {
      if (updateFileContent) {
        await updateFileContent(existingItem.id, mod.content);
        syncedPaths.push(cleanPath);
      }
    } else if (createFile) {
      const parts = cleanPath.split("/");
      const fileName = parts.pop() || "file.txt";
      let currentParentId: string | null = null;

      if (parts.length > 0) {
        let parentPath = "";
        for (const p of parts) {
          parentPath = parentPath ? `${parentPath}/${p}` : p;
          const folderItem = findItemByPath(parentPath, items, true);
          if (folderItem && folderItem.type === "folder") {
            currentParentId = folderItem.id;
          } else if (createFolder) {
            try {
              currentParentId = await createFolder(p, currentParentId);
            } catch {
              // Ignore folder creation error if already created
            }
          }
        }
      }

      await createFile(fileName, currentParentId, mod.content);
      syncedPaths.push(cleanPath);
    }
  }

  return syncedPaths;
}

/**
 * Executes Python code within a local Pyodide WebAssembly sandbox environment for agent tools.
 *
 * @param options - Python execution parameters and context.
 * @returns Promise resolving to formatted execution output string or error message.
 */
export async function runPythonSandbox(
  options: PythonExecutionOptions,
): Promise<string> {
  const items = options.files || options.context?.items || [];
  const rawResult = await runPyodideCode({
    code: options.code,
    files: items,
    inputs: options.inputs || [],
    agentId: options.context?.currentAgentId,
    permissions: options.permissions,
    filePath: options.filePath,
  });

  const syncedPaths = await syncModifiedFilesToWorkspace(
    rawResult.modifiedFiles,
    items,
    options.context?.updateFileContent,
    options.context?.createFile,
    options.context?.createFolder,
  );

  let output = "";
  if (rawResult.stdout) {
    output += rawResult.stdout;
  }
  if (rawResult.stderr) {
    if (output) output += "\n--- STDERR ---\n";
    output += rawResult.stderr;
  }
  if (syncedPaths.length > 0) {
    if (output) output += "\n";
    output += `[Synced modified workspace files: ${syncedPaths.join(", ")}]`;
  }

  if (!output.trim()) {
    output = rawResult.success
      ? "(Script completed with no stdout/stderr output)"
      : `(Script failed: ${rawResult.error || "Unknown error"})`;
  }

  return output;
}

/**
 * Executes Python code triggered from the workspace interface with real-time output streaming.
 *
 * @param params - Configuration options including source code, workspace files, and chunk callbacks.
 * @returns Detailed result object containing output logs, duration, status, and error details.
 */
export async function executeWorkspacePythonStream(
  params: WorkspacePythonStreamParams,
): Promise<DetailedPythonResult> {
  const items = params.items || params.files || [];
  const rawResult = await runPyodideCode({
    code: params.code,
    files: items,
    inputs: params.inputs || [],
    onChunk: params.onChunk,
    filePath: params.filePath,
  });

  const syncedPaths = await syncModifiedFilesToWorkspace(
    rawResult.modifiedFiles,
    items,
    params.updateFileContent,
    params.createFile,
    params.createFolder,
  );

  return {
    stdout: rawResult.stdout,
    stderr: rawResult.stderr,
    durationMs: rawResult.durationMs,
    modifiedFiles: rawResult.modifiedFiles,
    syncedPaths,
    requiresInput: rawResult.requiresInput,
    success: rawResult.success,
    error: rawResult.error,
    extractedPrompt: rawResult.extractedPrompt,
  };
}

/**
 * Executes Python code triggered from the workspace interface.
 *
 * @param params - Execution configuration options.
 * @returns Detailed execution result.
 */
export async function executeWorkspacePython(
  params: WorkspacePythonParams,
): Promise<DetailedPythonResult> {
  return executeWorkspacePythonStream(params);
}

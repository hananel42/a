/**
 * @file types.ts
 * @description Core types and interfaces for the modular MCP tools system.
 */

import { WorkspaceItem } from "../types/workspace";
import { AgentPermissions, MessagePart, ToolCallStep } from "../types/agent";

export interface ToolContext {
  items: WorkspaceItem[];
  currentAgentId?: string;
  createFile: (
    name: string,
    parentId: string | null,
    content?: string,
  ) => Promise<string>;
  createFolder: (name: string, parentId: string | null) => Promise<string>;
  updateFileContent: (id: string, content: string) => Promise<void>;
  deleteFile?: (id: string) => Promise<void>;
  onTriggerAgent: (
    agentId: string,
    message: string,
    resumeId?: string,
    onProgress?: (
      subContent: string,
      subParts?: MessagePart[],
      subSteps?: ToolCallStep[],
    ) => void,
  ) => Promise<{ status: string; id: string; msg: string } | string>;
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
  allAgents?: any[];
  apiKey?: string;
  baseURL?: string;
  model?: string;
  onSubProgress?: (
    subContent: string,
    subParts?: MessagePart[],
    subSteps?: ToolCallStep[],
  ) => void;
}

export interface ToolParameterSchema {
  type: string;
  description: string;
  items?: { type: string };
}

export interface ToolSchema {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, ToolParameterSchema>;
    required?: string[];
  };
}

export interface ToolModule {
  schema: ToolSchema;
  execute: (
    args: any,
    context: ToolContext,
    permissions?: AgentPermissions,
  ) => Promise<string>;
}

/**
 * Validates if a path falls within a list of allowed prefixes and respects /agent privacy boundaries.
 */
export function isPathAllowed(
  pathStr: string,
  allowedPrefixes?: string[],
  agentId?: string,
  permissions?: AgentPermissions,
): boolean {
  if (!pathStr) return true;
  const cleanPath = pathStr
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .trim()
    .toLowerCase();

  // Protect /.agents and /agent system directories: accessible strictly to 'admin' OR if permissions.allowAgentFolderAccess is enabled
  if (
    cleanPath === ".agents" ||
    cleanPath.startsWith(".agents/") ||
    cleanPath === "agent" ||
    cleanPath.startsWith("agent/")
  ) {
    if (agentId) {
      const lowerAgentId = agentId.toLowerCase();
      if (lowerAgentId === "admin") {
        return true;
      }
      if (permissions?.allowAgentFolderAccess) {
        return true;
      }
      return false;
    } else {
      return false;
    }
  }

  if (!allowedPrefixes || allowedPrefixes.length === 0) return true;

  return allowedPrefixes.some((prefix) => {
    const cleanPrefix = prefix
      .replace(/^\/+|\/+$/g, "")
      .trim()
      .toLowerCase();
    if (cleanPrefix === "" || cleanPrefix === "." || cleanPrefix === "/")
      return true;
    return cleanPath === cleanPrefix || cleanPath.startsWith(cleanPrefix + "/");
  });
}

/**
 * Computes virtual path string for a workspace item id
 */
export function getVirtualPath(itemId: string, items: WorkspaceItem[]): string {
  const segments: string[] = [];
  let current = items.find((i) => i.id === itemId);
  while (current) {
    segments.unshift(current.name);
    current = items.find((i) => i.id === current?.parentId);
  }
  return segments.join("/");
}

/**
 * Normalizes user-supplied paths to find workspace item matching
 */
export function findItemByPath(
  pathStr: string,
  items: WorkspaceItem[],
  exactOnly: boolean = false,
): WorkspaceItem | undefined {
  if (!pathStr) return undefined;
  const clean = pathStr
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .trim()
    .toLowerCase();
  if (!clean || clean === "." || clean === "/") return undefined;

  // 1. Direct name match at root
  let found = items.find(
    (i) => i.name.toLowerCase() === clean && i.parentId === null,
  );
  if (found) return found;

  // 2. Exact match against computed virtual path (e.g. "uploads/sample.txt")
  found = items.find(
    (i) => getVirtualPath(i.id, items).toLowerCase() === clean,
  );
  if (found) return found;

  // 3. Hierarchical path navigation step-by-step
  const parts = clean.split("/");
  let currentParentId: string | null = null;
  let lastFound: WorkspaceItem | undefined;
  let pathValid = true;

  for (const part of parts) {
    lastFound = items.find(
      (i) => i.name.toLowerCase() === part && i.parentId === currentParentId,
    );
    if (!lastFound) {
      pathValid = false;
      break;
    }
    currentParentId = lastFound.id;
  }

  if (pathValid && lastFound) return lastFound;

  // 4. Fallback: If only filename was given without folder, find matching file by name anywhere in tree
  if (!exactOnly && parts.length === 1) {
    const filename = parts[0];
    const fileMatch = items.find(
      (i) => i.type === "file" && i.name.toLowerCase() === filename,
    );
    if (fileMatch) return fileMatch;
  }

  return undefined;
}

/**
 * Truncates oversized string outputs to stay within LLM context budget
 */
export function truncateOutput(
  text: string,
  maxChars: number = 4000,
  contextLabel: string = "Output",
): string {
  if (!text || text.length <= maxChars) return text;
  const charsKept = text.substring(0, maxChars);
  const remaining = text.length - maxChars;
  return `${charsKept}\n... [${contextLabel} truncated: +${remaining} additional characters omitted to preserve LLM context budget]`;
}

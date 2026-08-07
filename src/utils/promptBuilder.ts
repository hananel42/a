/**
 * @file promptBuilder.ts
 * @description Advanced Prompt Assembly Engine for AI Agents.
 * Assembles the complete system prompt that an agent receives, incorporating:
 * - Role Preamble & System Directives
 * - Core Instructions (`agent.md`)
 * - Workspace Context (Active files, directory tree structure)
 * - Agent Memories (`agent/[agent-id]/memories/`)
 * - Response Formatting Rules & Postamble
 *
 * Exports:
 * - buildAgentSystemPrompt: Constructs the exact system prompt string for execution.
 * - generateWorkspaceTreeSummary: Helper to build a clean directory tree string.
 */

import { Agent } from "../types/agent";
import { getVirtualPath, isPathAllowed } from "../services/mcp";
import { WORKSPACE_PYTHON_DOCS } from "../constants/workspacePythonDocs";
import { DEFAULT_SYSTEM_PROMPT_TEMPLATE, DEFAULT_SYSTEM_PROMPT_PREFIX } from "../constants/agentPrompts";

interface BuildPromptOptions {
  agent: Agent;
  workspaceItems: any[];
  allAgents?: Agent[];
  memoryFiles?: { name: string; content: string }[];
}

/**
 * Builds a visual text representation of the workspace folder hierarchy.
 */
export function generateWorkspaceTreeSummary(workspaceItems: any[]): string {
  if (!workspaceItems || workspaceItems.length === 0)
    return "Workspace is currently empty.";

  const rootItems = workspaceItems.filter((i) => i.parentId === null);
  const lines: string[] = [];

  function walk(item: any, depth: number) {
    const indent = "  ".repeat(depth);
    const prefix = item.type === "folder" ? "📁 " : "📄 ";
    lines.push(`${indent}${prefix}${item.name}`);

    if (item.type === "folder") {
      const children = workspaceItems.filter((i) => i.parentId === item.id);
      for (const child of children) {
        walk(child, depth + 1);
      }
    }
  }

  for (const root of rootItems) {
    walk(root, 0);
  }

  return lines.join("\n");
}

/**
 * Assembles the full, expanded system prompt string that will be sent to the LLM.
 */
export function buildAgentSystemPrompt({
  agent,
  workspaceItems,
  allAgents = [],
  memoryFiles = [],
}: BuildPromptOptions): string {
  const config = agent.promptConfig || {};
  const readPaths = agent.permissions.allowedReadPaths ||
    agent.permissions.allowedPaths || ["/"];
  const writePaths = agent.permissions.allowedWritePaths ||
    agent.permissions.allowedPaths || ["/"];

  // Filter workspace items to exclude the agent directory if sandbox access is disabled
  let filteredWorkspaceItems = workspaceItems;
  if (!agent.permissions.allowAgentFolderAccess) {
    filteredWorkspaceItems = workspaceItems.filter((i) => {
      const relPath = getVirtualPath(i.id, workspaceItems);
      const isAgentFolder =
        relPath === ".agents" ||
        relPath.startsWith(".agents/") ||
        relPath === "agent" ||
        relPath.startsWith("agent/");
      return !isAgentFolder;
    });
  }

  // Filter workspace files based on read permissions
  const allowedFiles = filteredWorkspaceItems
    .map((i) => {
      const relPath = getVirtualPath(i.id, filteredWorkspaceItems);
      return { item: i, relPath };
    })
    .filter(({ relPath }) => isPathAllowed(relPath, readPaths));

  const activeFilesStr =
    allowedFiles.length > 0
      ? allowedFiles
          .map(({ relPath, item }) => `- ${relPath} (${item.type})`)
          .join("\n")
      : "No active files.";

  const workspaceTreeStr = generateWorkspaceTreeSummary(filteredWorkspaceItems);

  const memoryBlocksStr =
    memoryFiles.length > 0
      ? memoryFiles
          .map((m) => `#### Memory: ${m.name}\n${m.content}`)
          .join("\n\n")
      : "";

  const allowedToolsStr = (agent.permissions.allowedTools || []).join(", ");

  const hasPythonOrTools = agent.permissions.allowedTools?.some(
    (t) => t === "run_python" || t === "execute_tool" || t.startsWith("tool_"),
  );
  let customDocsSub = hasPythonOrTools ? WORKSPACE_PYTHON_DOCS : "";

  let tmpl = (config.systemPromptTemplate && config.systemPromptTemplate.trim()) 
    ? config.systemPromptTemplate 
    : DEFAULT_SYSTEM_PROMPT_TEMPLATE;

  if (!tmpl.includes("EXECUTION FLOW DECISION MATRIX")) {
    tmpl = `${DEFAULT_SYSTEM_PROMPT_PREFIX}\n\n${tmpl}`;
  }

  tmpl = tmpl.replace(/\$\{name\}/g, agent.name || "");
  tmpl = tmpl.replace(/\$\{id\}/g, agent.id || "");
  tmpl = tmpl.replace(/\$\{description\}/g, agent.description || "");
  tmpl = tmpl.replace(/\$\{instructions\}/g, agent.instructions || "");
  tmpl = tmpl.replace(/\$\{allowedTools\}/g, allowedToolsStr);
  tmpl = tmpl.replace(/\$\{allowedReadPaths\}/g, readPaths.join(", "));
  tmpl = tmpl.replace(/\$\{allowedWritePaths\}/g, writePaths.join(", "));
  tmpl = tmpl.replace(
    /\$\{activeFiles\}/g,
    config.includeActiveFiles === true ? `### WORKSPACE ACTIVE FILES\n${activeFilesStr}` : ""
  );
  tmpl = tmpl.replace(
    /\$\{workspaceTree\}/g,
    config.includeWorkspaceTree === true ? `### WORKSPACE DIRECTORY TREE\n\`\`\`\n${workspaceTreeStr}\n\`\`\`` : ""
  );
  tmpl = tmpl.replace(
    /\$\{memories\}/g,
    config.includeMemories !== false && memoryBlocksStr ? `### PERSISTENT MEMORIES\n${memoryBlocksStr}` : "",
  );
  tmpl = tmpl.replace(/\$\{workspace-python-docs\}/g, customDocsSub);
  tmpl = tmpl.replace(/\$\{workspacePythonDocs\}/g, customDocsSub);

  return tmpl.trim();
}

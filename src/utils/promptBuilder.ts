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
 * Returns a clean, concise template string with placeholders like ${name}, ${instructions}, ${allowedTools}, etc.
 */
export function getDefaultSystemPromptTemplate(): string {
  return `You are \${name} (\${id}).
Role: \${description}

### INSTRUCTIONS
\${instructions}

\${workspace-python-docs}

### PERMISSIONS & BOUNDARIES
Authorized Tools: \${allowedTools}
Read Paths: \${allowedReadPaths}
Write Paths: \${allowedWritePaths}

\${memories}`;
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

  const otherAgents = (allAgents || []).filter((a) => a.id !== agent.id);
  const availableAgentsStr =
    otherAgents.length > 0
      ? otherAgents
          .map(
            (a) =>
              `- agentId: "${a.id}" | Name: "${a.name}" | Description: ${a.description}`,
          )
          .join("\n")
      : "No other registered agents available.";

  // Replace documentation macro if present in template or custom instructions
  let customDocsSub = WORKSPACE_PYTHON_DOCS;

  // If a custom systemPromptTemplate is provided in Advanced Settings, substitute template variables:
  if (config.systemPromptTemplate && config.systemPromptTemplate.trim()) {
    let tmpl = config.systemPromptTemplate;
    tmpl = tmpl.replace(/\$\{name\}/g, agent.name || "");
    tmpl = tmpl.replace(/\$\{id\}/g, agent.id || "");
    tmpl = tmpl.replace(/\$\{description\}/g, agent.description || "");
    tmpl = tmpl.replace(/\$\{instructions\}/g, agent.instructions || "");
    tmpl = tmpl.replace(/\$\{allowedTools\}/g, allowedToolsStr);
    tmpl = tmpl.replace(/\$\{allowedReadPaths\}/g, readPaths.join(", "));
    tmpl = tmpl.replace(/\$\{allowedWritePaths\}/g, writePaths.join(", "));
    tmpl = tmpl.replace(/\$\{activeFiles\}/g, activeFilesStr);
    tmpl = tmpl.replace(/\$\{workspaceTree\}/g, workspaceTreeStr);
    tmpl = tmpl.replace(
      /\$\{memories\}/g,
      memoryBlocksStr ? `### PERSISTENT MEMORIES\n${memoryBlocksStr}` : "",
    );
    tmpl = tmpl.replace(/\$\{workspace-python-docs\}/g, customDocsSub);
    tmpl = tmpl.replace(/\$\{workspacePythonDocs\}/g, customDocsSub);
    tmpl = tmpl.replace(/\$\{preamble\}/g, config.preamble || "");
    tmpl = tmpl.replace(/\$\{postamble\}/g, config.postamble || "");
    tmpl = tmpl.replace(
      /\$\{responseFormatRules\}/g,
      config.responseFormatRules || "",
    );
    return tmpl.trim();
  }

  const promptSections: string[] = [];

  // 1. Role Preamble or Identity
  if (config.preamble && config.preamble.trim()) {
    promptSections.push(config.preamble.trim());
  } else {
    promptSections.push(`You are ${agent.name} (${agent.id}).
Role: ${agent.description}`);
  }

  // 2. Core System Instructions (with docs macro replacement if used in instructions)
  if (agent.instructions && agent.instructions.trim()) {
    let inst = agent.instructions.trim();
    inst = inst.replace(/\$\{workspace-python-docs\}/g, customDocsSub);
    inst = inst.replace(/\$\{workspacePythonDocs\}/g, customDocsSub);
    promptSections.push(`### INSTRUCTIONS
${inst}`);
  }

  // 3. Permissions & Boundaries
  promptSections.push(`### PERMISSIONS & BOUNDARIES
Authorized Tools: ${allowedToolsStr || "None"}
Read Paths: ${readPaths.join(", ")}
Write Paths: ${writePaths.join(", ")}
When invoking tools, use native function calling directly. Do not wrap tool calls in text XML tags.`);

  // 3b. Workspace Python API Documentation
  const hasPythonOrTools = agent.permissions.allowedTools?.some(
    (t) => t === "run_python" || t === "execute_tool" || t.startsWith("tool_"),
  );
  const instructionsAlreadyHasDocs =
    agent.instructions?.includes("${workspace-python-docs}") ||
    agent.instructions?.includes("WORKSPACE PYTHON API REFERENCE");
  if (hasPythonOrTools && !instructionsAlreadyHasDocs) {
    promptSections.push(WORKSPACE_PYTHON_DOCS);
  }

  if (
    otherAgents.length > 0 &&
    (agent.permissions.allowedTools?.includes("call_agent") ||
      agent.permissions.canCallAllAgents !== false)
  ) {
    promptSections.push(`### SUB-AGENT DELEGATION (call_agent)
To delegate sub-tasks to another specialized agent, use the \`call_agent\` tool with arguments \`agent-id\` (e.g. "code-architect"), \`prompt\` (the directive/instructions), and optional \`resume-id\` (to resume a previous conversation).
Available agent-ids:
${availableAgentsStr}`);
  }

  // 4. Response Formatting Rules (if explicitly set)
  if (config.responseFormatRules && config.responseFormatRules.trim()) {
    promptSections.push(`### RESPONSE FORMAT
${config.responseFormatRules.trim()}`);
  }

  // 5. Workspace Context (ONLY if explicitly enabled)
  if (config.includeActiveFiles === true) {
    promptSections.push(`### WORKSPACE ACTIVE FILES
${activeFilesStr}`);
  }

  if (config.includeWorkspaceTree === true) {
    promptSections.push(`### WORKSPACE DIRECTORY TREE
\`\`\`
${workspaceTreeStr}
\`\`\``);
  }

  // 6. Persistent Memories (ONLY if enabled & present)
  if (config.includeMemories !== false && memoryBlocksStr) {
    promptSections.push(`### PERSISTENT MEMORIES
${memoryBlocksStr}`);
  }

  // 7. Custom Postamble (if set)
  if (config.postamble && config.postamble.trim()) {
    promptSections.push(config.postamble.trim());
  }

  return promptSections.join("\n\n");
}

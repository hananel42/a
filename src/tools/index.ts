import { AGENT_MESSAGES } from "../constants/agentMessages";
/**
 * @file index.ts
 * @description Central registry and dispatcher for all MCP tools.
 */

import { ToolModule, ToolContext } from "./types";
import { AgentPermissions } from "../types/agent";
import { readFileTool } from "./readFile";
import { writeFileTool } from "./writeFile";
import { listDirTool } from "./listDir";
import { getInfoTool } from "./getInfo";
import { deleteFileTool } from "./deleteFile";
import { runPythonTool } from "./runPython";
import { searchWikipediaTool } from "./searchWikipedia";
import { callAgentTool } from "./callAgent";
import { createAgentTool } from "./createAgent";
import { saveMemoryTool } from "./saveMemory";
import { listAgentsTool } from "./listAgents";
import {
  discoverCustomTools,
  executeCustomTool,
  CustomToolDef,
} from "./customTools";
import { WorkspaceItem } from "../types/workspace";

export * from "./types";
export * from "./customTools";

export const toolRegistry: Record<string, ToolModule> = {
  read_file: readFileTool,
  write_file: writeFileTool,
  list_dir: listDirTool,
  get_info: getInfoTool,
  delete_file: deleteFileTool,
  run_python: runPythonTool,
  search_wikipedia: searchWikipediaTool,
  call_agent: callAgentTool,
  create_agent: createAgentTool,
  save_memory: saveMemoryTool,
  list_agents: listAgentsTool,
};

/**
 * Default array of OpenAI-compatible function calling schemas for built-in MCP tools
 */
export const WORKSPACE_TOOLS = Object.values(toolRegistry).map(
  (module) => module.schema,
);

/**
 * Returns complete list of available tool schemas including built-in tools and dynamic custom tools in agent/[agentId]/tools/
 */
export function getAvailableTools(
  workspaceItems: WorkspaceItem[],
  allowedToolNames?: string[],
  agentId?: string,
): any[] {
  const builtinSchemas = Object.values(toolRegistry).map(
    (module) => module.schema,
  );
  const customTools = discoverCustomTools(workspaceItems, agentId);
  const customSchemas = customTools.map((ct) => ct.schema);

  const allSchemas = [...builtinSchemas, ...customSchemas];

  if (!allowedToolNames || allowedToolNames.length === 0) {
    return allSchemas;
  }

  return allSchemas.filter((schema) => {
    if (allowedToolNames.includes(schema.name)) return true;
    // If agent has run_python allowed, also expose custom Python tools
    if (
      allowedToolNames.includes("run_python") &&
      customSchemas.some((cs) => cs.name === schema.name)
    ) {
      return true;
    }
    return false;
  });
}

/**
 * Executes a tool by name with safety checks and error catching.
 * Handles both built-in MCP tools and per-agent custom tools in agent/[agentId]/tools/
 */
export async function executeTool(
  name: string,
  args: any,
  context: ToolContext,
  permissions?: AgentPermissions,
): Promise<string> {
  // 1. Check built-in tool registry
  const tool = toolRegistry[name];
  if (tool) {
    try {
      return await tool.execute(args || {}, context, permissions);
    } catch (err: any) {
      return AGENT_MESSAGES.EXECUTION_ERROR.replace("{name}", name).replace("{error}", err.message || String(err));
    }
  }

  // 2. Check custom per-agent tools in agent/[agentId]/tools/[toolName]/
  if (context.items && Array.isArray(context.items)) {
    const customTools = discoverCustomTools(
      context.items,
      context.currentAgentId,
    );
    const customTool = customTools.find((ct) => ct.schema.name === name);
    if (customTool) {
      try {
        return await executeCustomTool(customTool, args, context, permissions);
      } catch (err: any) {
        return AGENT_MESSAGES.EXECUTION_ERROR_CUSTOM.replace("{name}", name).replace("{error}", err.message || String(err));
      }
    }
  }

  const builtinNames = Object.keys(toolRegistry);
  const customNames = context.items
    ? discoverCustomTools(context.items, context.currentAgentId).map(
        (ct) => ct.schema.name,
      )
    : [];
  const allNames = [...builtinNames, ...customNames].join(", ");

  return AGENT_MESSAGES.TOOL_NOT_RECOGNIZED.replace("{name}", name).replace("{available}", allNames);
}

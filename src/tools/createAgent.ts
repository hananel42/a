/**
 * @file createAgent.ts
 * @description Tool definition & handler for dynamically registering new specialized AI agents.
 */

import { AGENT_MESSAGES } from "../constants/agentMessages";
import { ToolModule } from "./types";

const TOOL_ALIAS_MAP: Record<string, string> = {
  python: "run_python",
  "run-python": "run_python",
  run_python: "run_python",
  read: "read_file",
  "read-file": "read_file",
  read_file: "read_file",
  write: "write_file",
  "write-file": "write_file",
  write_file: "write_file",
  list: "list_dir",
  "list-dir": "list_dir",
  list_dir: "list_dir",
  call: "call_agent",
  "call-agent": "call_agent",
  call_agent: "call_agent",
  create: "create_agent",
  "create-agent": "create_agent",
  create_agent: "create_agent",
  delete: "delete_file",
  "delete-file": "delete_file",
  delete_file: "delete_file",
  info: "get_info",
  "get-info": "get_info",
  get_info: "get_info",
  wikipedia: "search_wikipedia",
  "search-wikipedia": "search_wikipedia",
  search_wikipedia: "search_wikipedia",
  memory: "save_memory",
  "save-memory": "save_memory",
  save_memory: "save_memory",
  agents: "list_agents",
  "list-agents": "list_agents",
  list_agents: "list_agents",
};

function normalizeToolNames(tools: string[]): string[] {
  const normalized = tools.map((t) => {
    const lower = t.toLowerCase().trim();
    return TOOL_ALIAS_MAP[lower] || lower;
  });
  return Array.from(new Set(normalized));
}

function parseArrayParam(param: any, defaultVal: string[]): string[] {
  if (!param) return defaultVal;
  if (Array.isArray(param)) {
    const cleaned = param.map((s) => String(s).trim()).filter(Boolean);
    return cleaned.length > 0 ? cleaned : defaultVal;
  }
  if (typeof param === "string") {
    const trimmed = param.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.map((s) => String(s).trim()).filter(Boolean);
          return cleaned.length > 0 ? cleaned : defaultVal;
        }
      } catch {
        // ignore
      }
    }
    const split = trimmed
      .split(",")
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
      .filter(Boolean);
    return split.length > 0 ? split : defaultVal;
  }
  return defaultVal;
}

export const createAgentTool: ToolModule = {
  schema: {
    name: "create_agent",
    description:
      "Dynamically create and register a new specialized agent with custom persona instructions, tools, and permissions in English. The 'defaultModel' parameter is optional; if omitted or invalid, the agent automatically inherits the active global model.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description:
            'Descriptive, unique English name for the new agent (e.g. "Code Architect", "Python Engineer", "Security Auditor").',
        },
        description: {
          type: "string",
          description: "Brief English summary of what this agent excels at.",
        },
        instructions: {
          type: "string",
          description:
            "Detailed system guidelines, persona, operational rules, and step-by-step instructions in English.",
        },
        allowedTools: {
          type: "array",
          items: { type: "string" },
          description:
            'List of allowed tool names chosen from system tools: ["read_file", "write_file", "delete_file", "list_dir", "get_info", "search_wikipedia", "run_python", "call_agent", "create_agent", "save_memory"].',
        },
        allowedReadPaths: {
          type: "array",
          items: { type: "string" },
          description:
            'Optional array of allowed read paths (defaults to ["/"]).',
        },
        allowedWritePaths: {
          type: "array",
          items: { type: "string" },
          description:
            'Optional array of allowed write paths (defaults to ["/"]).',
        },
        avatar: {
          type: "string",
          description:
            'Optional icon identifier: "crown", "code", "brain", "search", "terminal", "cpu", "sparkles", "wrench", "shield", "activity", "folder", "briefcase".',
        },
        defaultModel: {
          type: "string",
          description:
            'OPTIONAL. Default LLM model identifier override for this agent (e.g. "gpt-4o", "o3-mini", "claude-3-5-sonnet-20241022", "deepseek-chat"). Leave empty or omit to use the active global default model.',
        },
      },
      required: ["name", "description", "instructions"],
    },
  },

  async execute(args, context) {
    const rawName =
      args.name || args.agentName || args.agent_name || args.title || args.id;
    if (!rawName || typeof rawName !== "string" || !rawName.trim()) {
      throw new Error("Missing required argument 'name' for create_agent tool.");
    }
    const name = rawName.trim();

    const rawDesc =
      args.description || args.desc;
    if (!rawDesc || typeof rawDesc !== "string" || !rawDesc.trim()) {
      throw new Error("Missing required argument 'description' for create_agent tool.");
    }
    const description = rawDesc.trim();

    const rawInstructions =
      args.instructions ||
      args.prompt ||
      args.systemPrompt ||
      args.rules ||
      args.role ||
      args.system_prompt;
    if (!rawInstructions || typeof rawInstructions !== "string" || !rawInstructions.trim()) {
      throw new Error("Missing required argument 'instructions' for create_agent tool.");
    }
    const instructions = rawInstructions.trim();

    const defaultTools = [
      "read_file",
      "write_file",
      "list_dir",
      "get_info",
      "run_python",
      "call_agent",
      "search_wikipedia",
      "save_memory",
    ];

    const rawTools =
      args.allowedTools ||
      args.allowed_tools ||
      args.tools ||
      args.allowedToolsList;
    const parsedTools = parseArrayParam(rawTools, defaultTools);
    const allowedTools = normalizeToolNames(parsedTools);

    const rawRead =
      args.allowedReadPaths || args.allowed_read_paths || args.read_paths;
    const allowedReadPaths = parseArrayParam(rawRead, ["/"]);

    const rawWrite =
      args.allowedWritePaths || args.allowed_write_paths || args.write_paths;
    const allowedWritePaths = parseArrayParam(rawWrite, ["/"]);

    const avatar =
      typeof args.avatar === "string" && args.avatar.trim()
        ? args.avatar.trim()
        : "brain";
    const defaultModel =
      typeof args.defaultModel === "string" && args.defaultModel.trim()
        ? args.defaultModel.trim()
        : typeof args.model === "string" && args.model.trim()
        ? args.model.trim()
        : undefined;

    if (!context.onCreateAgent) {
      throw new Error("onCreateAgent function is missing from tool context.");
    }

    try {
      const agentId = await context.onCreateAgent(
        name,
        description,
        instructions,
        allowedTools,
        avatar,
        allowedReadPaths,
        allowedWritePaths,
        defaultModel,
      );
      return AGENT_MESSAGES.CREATE_AGENT_SUCCESS.replace(
        "{name}",
        name,
      ).replace(/{id}/g, agentId);
    } catch (e: any) {
      throw new Error(`Failed to create agent "${name}": ${e.message || String(e)}`);
    }
  },
};

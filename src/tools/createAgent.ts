/**
 * @file createAgent.ts
 * @description Tool definition & handler for dynamically registering new specialized AI agents.
 */

import { AGENT_MESSAGES } from "../constants/agentMessages";
import { ToolModule } from "./types";

export const createAgentTool: ToolModule = {
  schema: {
    name: "create_agent",
    description:
      "Dynamically create and register a new specialized agent with custom persona instructions, tools, and permissions in English.",
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
          description: "Optional default LLM model identifier for this agent.",
        },
      },
      required: ["name", "description", "instructions"],
    },
  },

  async execute(args, context) {
    const {
      name,
      description,
      instructions,
      allowedTools = ["read_file", "list_dir"],
      allowedReadPaths = ["/"],
      allowedWritePaths = ["/"],
      avatar = "brain",
      defaultModel,
    } = args;

    if (!name || typeof name !== "string") {
      return 'Error: Invalid or missing agent "name".';
    }
    if (!instructions || typeof instructions !== "string") {
      return 'Error: Invalid or missing agent "instructions".';
    }

    try {
      const agentId = await context.onCreateAgent(
        name.trim(),
        (description || `Specialized ${name} agent`).trim(),
        instructions.trim(),
        Array.isArray(allowedTools) ? allowedTools : ["read_file", "list_dir"],
        avatar,
        Array.isArray(allowedReadPaths) ? allowedReadPaths : ["/"],
        Array.isArray(allowedWritePaths) ? allowedWritePaths : ["/"],
        defaultModel,
      );
      return AGENT_MESSAGES.CREATE_AGENT_SUCCESS.replace("{name}", name).replace(/{id}/g, agentId);
    } catch (e: any) {
      return AGENT_MESSAGES.CREATE_AGENT_ERROR.replace("{name}", name).replace("{error}", e.message || String(e));
    }
  },
};

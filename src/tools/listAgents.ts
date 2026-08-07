/**
 * @file listAgents.ts
 * @description Tool definition & handler for listing all registered agents.
 */

import { AGENT_MESSAGES } from "../constants/agentMessages";
import { ToolModule } from "./types";

export const listAgentsTool: ToolModule = {
  schema: {
    name: "list_agents",
    description:
      "List all active and available computational agents in the system, including their unique IDs, names, descriptions, and allowed tools. Use this to discover which specialized agents you can delegate sub-tasks to.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },

  async execute(args, context) {
    if (!context.allAgents || !Array.isArray(context.allAgents)) {
      return AGENT_MESSAGES.LIST_AGENTS_UNAVAILABLE;
    }

    if (context.allAgents.length === 0) {
      return AGENT_MESSAGES.LIST_AGENTS_EMPTY;
    }

    const formattedList = context.allAgents
      .map((agent: any) => {
        const allowedTools = agent.permissions?.allowedTools || [];
        return `- **ID**: "${agent.id}"
  - **Name**: ${agent.name}
  - **Description**: ${agent.description}
  - **Allowed Tools**: ${allowedTools.join(", ") || "none"}`;
      })
      .join("\n\n");

    return `Available Agents:\n\n${formattedList}`;
  },
};

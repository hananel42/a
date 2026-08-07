/**
 * @file callAgent.ts
 * @description Tool definition & handler for delegating sub-tasks to specialized agents or resuming previous conversations.
 */

import { AGENT_MESSAGES } from "../constants/agentMessages";
import { ToolModule } from "./types";

export const callAgentTool: ToolModule = {
  schema: {
    name: "call_agent",
    description:
      "Trigger another specialized agent to execute a sub-task, or resume a previous conversation session by resume-id.",
    parameters: {
      type: "object",
      properties: {
        "agent-id": {
          type: "string",
          description:
            'Target agent ID',
        },
        prompt: {
          type: "string",
          description:
            "Directive, instructions, or task request for the target agent.",
        },
        "resume-id": {
          type: "string",
          description:
            "Optional. Unique conversation ID to resume or continue a previous conversation with that agent.",
        },
      },
      required: ["agent-id", "prompt"],
    },
  },

  async execute(args, context) {
    const agentId = args["agent-id"] || args.agentId;
    const prompt = args.prompt || args.message;
    const resumeId = args["resume-id"] || args.resumeId || args.taskId;

    if (!agentId || typeof agentId !== "string") {
      return JSON.stringify(
        {
          status: "failed",
          id: resumeId || "",
          msg: 'Error: Missing or invalid "agent-id" parameter.',
        },
        null,
        2,
      );
    }
    if (!prompt || typeof prompt !== "string") {
      return JSON.stringify(
        {
          status: "failed",
          id: resumeId || "",
          msg: 'Error: Missing or invalid "prompt" parameter.',
        },
        null,
        2,
      );
    }

    try {
      const res = await context.onTriggerAgent(
        agentId,
        prompt,
        resumeId,
        context.onSubProgress,
      );

      if (typeof res === "object" && res !== null) {
        return JSON.stringify(res, null, 2);
      }

      throw new Error(`Unexpected response format from agent "${agentId}": Expected object but got ${typeof res}`);
    } catch (e: any) {
      return JSON.stringify(
        {
          status: "failed",
          id: resumeId || "",
          msg: `Error executing sub-agent delegation to "${agentId}": ${e.message || e}`,
        },
        null,
        2,
      );
    }
  },
};


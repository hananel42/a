/**
 * @file agent.ts
 * @description Core types and interfaces for the Multi-Agent system, including Agent models,
 * permissions, custom prompt configurations, default models, chat messages, thinking blocks, and recursive tool execution logs.
 *
 * Main Exports:
 * - AgentPromptConfig: Options for full prompt customization and context assembly.
 * - AgentPermissions: Permission model defining tool access, allowed read paths, and allowed write paths.
 * - Agent: Structure representing an AI agent.
 * - ToolCallStep: Recursive logs for tool execution and nested sub-agent triggers.
 * - MessagePart: Interleaved text, thinking, and tool execution blocks.
 * - Message: A chat message containing recursive tool execution step metadata and thinking blocks.
 */

export interface AgentPermissions {
  allowedTools: string[]; // e.g., ['read_file', 'write_file', 'list_dir', 'get_info', 'run_python', 'call_agent', 'create_agent']
  allowedPaths: string[]; // Keep for backwards compatibility
  allowedReadPaths: string[]; // Specific directories allowed to read, e.g., ['/'] or ['workspace/docs']
  allowedWritePaths: string[]; // Specific directories allowed to write, e.g., ['workspace/docs']
  maxFileReadChars: number; // e.g., 5000 chars limit
  maxDirItems: number; // e.g., 50 items limit
  canCallAllAgents: boolean; // if false, can only call default agents
  allowAgentFolderAccess?: boolean; // If true, agent can see and access the '/agent' directory (default: false for non-admin)
}

/**
 * Options for fine-grained prompt assembly and workspace context inclusion for an agent.
 */
export interface AgentPromptConfig {
  preamble?: string; // Custom role preamble (e.g. "You are an expert system architect...")
  postamble?: string; // Custom rules / constraints appended to system prompt
  includeActiveFiles?: boolean; // Auto-include list of active workspace files
  includeWorkspaceTree?: boolean; // Include hierarchical folder tree of workspace
  includeMemories?: boolean; // Include agent memory files from agent/[agent-id]/memories/
  responseFormatRules?: string; // Formatting guidelines (e.g., "Use clean Markdown and math equations where appropriate.")
  systemPromptTemplate?: string; // Fully customizable system prompt template with ${variable} placeholders
}

export interface Agent {
  id: string; // matches name or unique id
  name: string; // readable name
  description: string;
  avatar: string; // Emoji or icon name
  instructions: string; // System instructions / prompt
  permissions: AgentPermissions;
  defaultModel?: string; // Per-agent default model override (e.g., 'o3-mini', 'gpt-4o', 'deepseek-chat')
  promptConfig?: AgentPromptConfig; // Detailed prompt customization settings
  examplePrompts?: string[]; // Custom sample starter prompts (unlimited count)
  isDefault: boolean; // true for default built-in agents
  createdAt: string;
  updatedAt: string;
}

export interface ToolCallStep {
  id: string;
  toolName: string;
  args: any;
  status:
    | "running"
    | "success"
    | "error"
    | "pending_approval"
    | "cancelled"
    | "queued";
  output?: string;
  subSteps?: ToolCallStep[]; // Recursive sub-steps for nested agent invocation
  subParts?: MessagePart[]; // Chronological sub-parts for sub-agent execution trace
  streamedText?: string; // Captured live streaming output of the sub-agent
  streamedReasoning?: string; // Captured live reasoning output of the sub-agent
  reasoningBefore?: string; // Reasoning content emitted before this tool call
}

export interface MessagePart {
  id: string;
  type: "text" | "tool" | "thinking";
  content?: string;
  step?: ToolCallStep;
  steps?: ToolCallStep[]; // Tool call steps executed during/associated with this thinking phase
  parts?: MessagePart[]; // Chronological sub-parts inside a thinking phase or sub-agent trace
  thinkingTimeMs?: number; // Duration of thinking process in milliseconds
  startTimeMs?: number; // Timestamp when thinking block started
  isStreamingReasoning?: boolean; // Whether reasoning is actively streaming
  isPaused?: boolean; // Whether thinking timer is currently paused waiting for user confirmation
}

export interface Message {
  id: string;
  sender: "user" | "assistant" | "system";
  agentId?: string; // ID of the agent who generated this message (if assistant)
  content: string;
  timestamp: string;
  reasoning?: string; // Full accumulated reasoning process for thinking models
  thinkingTimeMs?: number; // Total duration of model thinking process
  steps?: ToolCallStep[]; // Running sequence of tool calls / subprocesses
  parts?: MessagePart[]; // Chronological interleaved text, thinking, and tool parts
}

import { TaskStatus, TaskResult } from "./task";

export interface ChatSession {
  id: string; // Acts as Task ID
  agentId: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  taskStatus?: TaskStatus;
  taskResult?: TaskResult;
}

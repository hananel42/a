/**
 * @file defaultAgents.ts
 * @description Out-of-the-box system agents loaded on platform initialization with focused, high-quality system prompts and sample starter prompts.
 */

import { Agent } from "../types/agent";
import {
  ADMIN_AGENT_INSTRUCTIONS,
  CODE_ARCHITECT_INSTRUCTIONS,
  RESEARCH_ANALYST_INSTRUCTIONS,
} from "../constants/agentPrompts";

export const DEFAULT_PERMISSIONS = {
  allowedTools: [
    "read_file",
    "write_file",
    "list_dir",
    "get_info",
    "run_python",
    "call_agent",
    "create_agent",
    "delete_file",
    "search_wikipedia",
    "save_memory",
    "list_agents",
  ],
  allowedPaths: ["/"],
  allowedReadPaths: ["/"],
  allowedWritePaths: ["/"],
  maxFileReadChars: 8000,
  maxDirItems: 100,
  canCallAllAgents: true,
};

export const defaultAgents: Agent[] = [
  {
    id: "admin",
    name: "Admin",
    description:
      "Master workspace governor with full authority over file hierarchy, system agents, memories, and custom tools.",
    avatar: "crown",
    instructions: ADMIN_AGENT_INSTRUCTIONS,
    permissions: {
      ...DEFAULT_PERMISSIONS,
      allowedTools: [
        "read_file",
        "write_file",
        "delete_file",
        "search_wikipedia",
        "list_dir",
        "get_info",
        "run_python",
        "call_agent",
        "create_agent",
        "save_memory",
        "list_agents",
      ],
      allowAgentFolderAccess: true,
    },
    promptConfig: {
      includeActiveFiles: true,
      includeWorkspaceTree: true,
      includeMemories: true,
    },
    examplePrompts: [
      "Inspect workspace files and report directory structure.",
      "Build a custom Python tool for Admin or Code Architect under /.agents/<agent-id>/tools/.",
      "Plan and orchestrate a multi-step project by delegating to specialized agents.",
    ],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "code-architect",
    name: "Code Architect",
    description:
      "Senior software engineer for writing, refactoring, and optimizing production code.",
    avatar: "code",
    instructions: CODE_ARCHITECT_INSTRUCTIONS,
    permissions: {
      ...DEFAULT_PERMISSIONS,
      allowedTools: [
        "read_file",
        "write_file",
        "list_dir",
        "get_info",
        "delete_file",
        "run_python",
        "call_agent",
        "save_memory",
        "list_agents",
      ],
    },
    examplePrompts: [
      "Inspect a single source file and refactor it into modular code.",
      "Decompose a multi-file component request into isolated sub-calls (types, implementation, tests).",
      "Run Python AST analysis on workspace code files.",
    ],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "research-analyst",
    name: "Research Analyst",
    description:
      "Analyst agent for inspecting workspace documents, web research, and factual reporting.",
    avatar: "search",
    instructions: RESEARCH_ANALYST_INSTRUCTIONS,
    permissions: {
      ...DEFAULT_PERMISSIONS,
      allowedTools: [
        "read_file",
        "list_dir",
        "get_info",
        "search_wikipedia",
        "run_python",
        "call_agent",
        "save_memory",
        "list_agents",
      ],
    },
    examplePrompts: [
      "Perform a focused Wikipedia search and summarize key facts.",
      "Decompose a multi-source research task into isolated sub-summaries.",
      "Analyze workspace data files using Python scripts.",
    ],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

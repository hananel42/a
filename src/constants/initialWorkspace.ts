/**
 * @file initialWorkspace.ts
 * @description Default initial workspace items, directory tree layout, and starter agent configuration files.
 */

import { WorkspaceItem } from "../types/workspace";
import {
  ADMIN_AGENT_INSTRUCTIONS,
  CODE_ARCHITECT_INSTRUCTIONS,
  RESEARCH_ANALYST_INSTRUCTIONS,
} from "./agentPrompts";

export const INITIAL_SAMPLE_TOOL_JSON = `{
  "name": "sample_tool",
  "description": "A custom Python tool for Admin agent using the workspace library for LLM processing.",
  "parameters": {
    "type": "object",
    "properties": {
      "message": {
        "type": "string",
        "description": "The message argument to process."
      }
    },
    "required": ["message"]
  }
}`;

export const INITIAL_SAMPLE_TOOL_SCRIPT = `# /.agents/admin/tools/sample_tool/script.py
# Example Custom Python Tool using the zero-dependency workspace API
from workspace import llm, tools

def sample_tool(message: str) -> str:
    """
    A custom tool that uses the workspace LLM engine to generate a response.
    """
    tools.log(f"Processing message: {message}")
    
    # Use the workspace LLM engine to generate a response
    response = llm.generate(f"Acknowledge and summarize this input concisely: {message}")
    return f"Tool Output: {response}"
`;

export function getDefaultWorkspaceItems(): WorkspaceItem[] {
  const now = new Date().toISOString();
  return [
    {
      id: "folder-agent",
      name: ".agents",
      type: "folder",
      parentId: null,
      createdAt: now,
      updatedAt: now,
      isExpanded: false,
    },
    // Admin Agent Folder
    {
      id: "folder-agent-admin",
      name: "admin",
      type: "folder",
      parentId: "folder-agent",
      createdAt: now,
      updatedAt: now,
      isExpanded: false,
    },
    {
      id: "file-admin-agent-json",
      name: "agent.json",
      type: "file",
      parentId: "folder-agent-admin",
      content: JSON.stringify(
        {
          id: "admin",
          name: "Admin",
          description:
            "Master workspace governor with full authority over file hierarchy, system agents, memories, and custom tools.",
          avatar: "crown",
          instructions: ADMIN_AGENT_INSTRUCTIONS,
          isDefault: true,
          createdAt: now,
          updatedAt: now,
        },
        null,
        2,
      ),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "file-admin-permissions-json",
      name: "permissions.json",
      type: "file",
      parentId: "folder-agent-admin",
      content: JSON.stringify(
        {
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
          allowedPaths: ["/"],
          allowedReadPaths: ["/"],
          allowedWritePaths: ["/"],
          maxFileReadChars: 8000,
          maxDirItems: 100,
          canCallAllAgents: true,
          allowAgentFolderAccess: true,
        },
        null,
        2,
      ),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "file-admin-memories",
      name: "memories.txt",
      type: "file",
      parentId: "folder-agent-admin",
      content: `- Custom Python tools enabled in /.agents/admin/tools/\n`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "folder-admin-tools",
      name: "tools",
      type: "folder",
      parentId: "folder-agent-admin",
      createdAt: now,
      updatedAt: now,
      isExpanded: false,
    },
    {
      id: "folder-admin-sample-tool",
      name: "sample_tool",
      type: "folder",
      parentId: "folder-admin-tools",
      createdAt: now,
      updatedAt: now,
      isExpanded: false,
    },
    {
      id: "file-admin-sample-tool-json",
      name: "tool.json",
      type: "file",
      parentId: "folder-admin-sample-tool",
      content: INITIAL_SAMPLE_TOOL_JSON,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "file-admin-sample-tool-script",
      name: "script.py",
      type: "file",
      parentId: "folder-admin-sample-tool",
      content: INITIAL_SAMPLE_TOOL_SCRIPT,
      createdAt: now,
      updatedAt: now,
    },
    // Code Architect Folder
    {
      id: "folder-agent-code-architect",
      name: "code-architect",
      type: "folder",
      parentId: "folder-agent",
      createdAt: now,
      updatedAt: now,
      isExpanded: false,
    },
    {
      id: "file-code-architect-agent-json",
      name: "agent.json",
      type: "file",
      parentId: "folder-agent-code-architect",
      content: JSON.stringify(
        {
          id: "code-architect",
          name: "Code Architect",
          description:
            "Senior software engineer for writing, refactoring, and optimizing production code.",
          avatar: "code",
          instructions: CODE_ARCHITECT_INSTRUCTIONS,
          isDefault: true,
          createdAt: now,
          updatedAt: now,
        },
        null,
        2,
      ),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "file-code-architect-permissions-json",
      name: "permissions.json",
      type: "file",
      parentId: "folder-agent-code-architect",
      content: JSON.stringify(
        {
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
          allowedPaths: ["/"],
          allowedReadPaths: ["/"],
          allowedWritePaths: ["/"],
          maxFileReadChars: 8000,
          maxDirItems: 100,
          canCallAllAgents: true,
        },
        null,
        2,
      ),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "file-code-architect-memories",
      name: "memories.txt",
      type: "file",
      parentId: "folder-agent-code-architect",
      content: `- Maintain strict TypeScript type safety across all components.\n- Enforce modular architecture under 300 lines per file constraint.`,
      createdAt: now,
      updatedAt: now,
    },
    // Research Analyst Folder
    {
      id: "folder-agent-research-analyst",
      name: "research-analyst",
      type: "folder",
      parentId: "folder-agent",
      createdAt: now,
      updatedAt: now,
      isExpanded: false,
    },
    {
      id: "file-research-analyst-agent-json",
      name: "agent.json",
      type: "file",
      parentId: "folder-agent-research-analyst",
      content: JSON.stringify(
        {
          id: "research-analyst",
          name: "Research Analyst",
          description:
            "Analyst agent for inspecting workspace documents, web research, and factual reporting.",
          avatar: "search",
          instructions: RESEARCH_ANALYST_INSTRUCTIONS,
          isDefault: true,
          createdAt: now,
          updatedAt: now,
        },
        null,
        2,
      ),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "file-research-analyst-permissions-json",
      name: "permissions.json",
      type: "file",
      parentId: "folder-agent-research-analyst",
      content: JSON.stringify(
        {
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
          allowedPaths: ["/"],
          allowedReadPaths: ["/"],
          allowedWritePaths: ["/"],
          maxFileReadChars: 8000,
          maxDirItems: 100,
          canCallAllAgents: true,
        },
        null,
        2,
      ),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "file-research-analyst-memories",
      name: "memories.txt",
      type: "file",
      parentId: "folder-agent-research-analyst",
      content: `- Synthesize findings with factual clarity and citations.\n- Keep research summaries organized in markdown format.`,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

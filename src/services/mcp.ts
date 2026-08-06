/**
 * @file mcp.ts
 * @description Proxy re-export file for Model Context Protocol (MCP) tool schemas and runners.
 * Keeps codebase clean and modular under the strict 300-line-per-file constraint.
 */

export { WORKSPACE_TOOLS, getAvailableTools } from "./mcpTools";
export {
  executeTool,
  isPathAllowed,
  getVirtualPath,
  type ToolContext,
} from "./mcpExecutor";

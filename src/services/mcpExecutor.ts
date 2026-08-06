/**
 * @file mcpExecutor.ts
 * @description Core Model Context Protocol (MCP) tool execution runtime router.
 * Re-exports modular tool handlers and security validation helpers.
 */

export {
  executeTool,
  isPathAllowed,
  getVirtualPath,
  findItemByPath,
} from "../tools";
export type { ToolContext } from "../tools/types";

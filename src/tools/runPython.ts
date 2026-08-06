/**
 * @file runPython.ts
 * @description User-facing MCP tool definition & handler for executing Python scripts in the workspace.
 * Applies user/agent read path permission checks before delegating to the low-level pythonRunner service.
 */

import {
  ToolModule,
  isPathAllowed,
  findItemByPath,
  getVirtualPath,
} from "./types";
import { runPythonSandbox } from "../services/pythonRunner";

export const runPythonTool: ToolModule = {
  schema: {
    name: "run_python",
    description:
      'Run Python code directly or execute a script file in workspace (e.g. "src/my_script.py"). Accepts optional STDIN input lines via "inputs".',
    parameters: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "Raw Python code snippet to execute.",
        },
        filePath: {
          type: "string",
          description: "Optional relative path to Python script file",
        },
        inputs: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional array of STDIN input lines sent to the Python script process.",
        },
      },
    },
  },

  async execute(args, context, permissions) {
    const { code, filePath, inputs = [] } = args;
    let pyCode = code || "";

    const readPaths = permissions?.allowedReadPaths ||
      permissions?.allowedPaths || ["/"];

    // 1. Validate script reading permission if filePath is provided
    if (filePath && !pyCode) {
      if (
        !isPathAllowed(filePath, readPaths, context.currentAgentId, permissions)
      ) {
        return `Permission Error: Reading Python script at "${filePath}" is restricted.`;
      }

      const item = findItemByPath(filePath, context.items);
      if (!item || item.type !== "file") {
        return `Error: Python script file not found at "${filePath}".`;
      }
      pyCode = item.content || "";
    }

    if (!pyCode.trim()) {
      return "Error: No Python code provided to execute.";
    }

    // 2. Filter workspace files according to agent read permissions (and /.agents privacy)
    const allowedFiles = context.items.filter((item) => {
      if (item.type !== "file") return true;
      const itemPath = getVirtualPath(item.id, context.items);
      return isPathAllowed(
        itemPath,
        readPaths,
        context.currentAgentId,
        permissions,
      );
    });

    // 3. Delegate to low-level pythonRunner service
    return await runPythonSandbox({
      code: pyCode,
      filePath,
      files: allowedFiles,
      inputs,
      context,
      permissions,
      isSystemTool: false,
    });
  },
};

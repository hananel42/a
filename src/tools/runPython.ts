/**
 * @file runPython.ts
 * @description User-facing MCP tool definition & handler for executing Python scripts in the workspace.
 * Applies user/agent read path permission checks before delegating to the low-level pythonRunner service.
 */

import { AGENT_MESSAGES } from "../constants/agentMessages";
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
      'Execute Python code or a script file in the workspace (e.g. "script.py" or "src/app.py"). Automatically executes in the script\'s directory or workspace root. Accepts STDIN input lines via "inputs" array.',
    parameters: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "Raw Python code string to execute.",
        },
        filePath: {
          type: "string",
          description: "Relative path to Python script file (determines working directory context).",
        },
        inputs: {
          type: "array",
          items: { type: "string" },
          description:
            "List of input strings to sequentially answer input() prompts in the script.",
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
        return AGENT_MESSAGES.RUN_PYTHON_PERMISSION_ERROR.replace("{filePath}", filePath);
      }

      const item = findItemByPath(filePath, context.items);
      if (!item || item.type !== "file") {
        return AGENT_MESSAGES.RUN_PYTHON_NOT_FOUND_ERROR.replace("{filePath}", filePath);
      }
      pyCode = item.content || "";
    }

    if (!pyCode.trim()) {
      return AGENT_MESSAGES.RUN_PYTHON_NO_CODE_ERROR;
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

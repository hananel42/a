import { AGENT_MESSAGES } from "../constants/agentMessages";
/**
 * @file deleteFile.ts
 * @description Tool definition & handler for deleting files or directories from workspace.
 */

import { ToolModule, isPathAllowed, findItemByPath } from "./types";

export const deleteFileTool: ToolModule = {
  schema: {
    name: "delete_file",
    description:
      "Delete a file or an entire directory from the workspace filesystem.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Relative path of file or folder to delete.",
        },
      },
      required: ["path"],
    },
  },

  async execute(args, context, permissions) {
    const { path } = args;
    if (!path || typeof path !== "string") {
      return 'Error: Invalid or missing "path" parameter.';
    }

    const clean = path
      .replace(/\\/g, "/")
      .replace(/^\/+|\/+$/g, "")
      .trim();
    if (!clean || clean === "." || clean === "/") {
      return AGENT_MESSAGES.DELETE_FILE_ROOT_ERROR;
    }

    const writePaths = permissions?.allowedWritePaths ||
      permissions?.allowedPaths || ["/"];
    if (
      !isPathAllowed(clean, writePaths, context.currentAgentId, permissions)
    ) {
      return AGENT_MESSAGES.DELETE_FILE_PERMISSION_ERROR.replace("{path}", clean);
    }

    const item = findItemByPath(clean, context.items);
    if (!item) {
      return AGENT_MESSAGES.DELETE_FILE_NOT_FOUND.replace("{path}", clean);
    }

    if (context.deleteFile) {
      await context.deleteFile(item.id);
    }

    // Remove item and any recursive sub-items from workspace items array
    const removeSubTree = (itemId: string) => {
      const children = context.items.filter((i) => i.parentId === itemId);
      for (const child of children) {
        removeSubTree(child.id);
      }
      const idx = context.items.findIndex((i) => i.id === itemId);
      if (idx !== -1) {
        context.items.splice(idx, 1);
      }
    };

    removeSubTree(item.id);

    return AGENT_MESSAGES.DELETE_FILE_SUCCESS.replace("{path}", clean).replace("{type}", item.type === "folder" ? "directory and all nested contents" : "file");
  },
};

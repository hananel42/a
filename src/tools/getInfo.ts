/**
 * @file getInfo.ts
 * @description Tool definition & handler for getting statistics and metadata for workspace files or folders.
 */

import {
  ToolModule,
  isPathAllowed,
  findItemByPath,
  getVirtualPath,
} from "./types";

export const getInfoTool: ToolModule = {
  schema: {
    name: "get_info",
    description:
      "Get statistics and metadata for a workspace file or directory (lines, character count, timestamps, type).",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to file or folder." },
      },
      required: ["path"],
    },
  },

  async execute(args, context, permissions) {
    const { path } = args;
    if (!path || typeof path !== "string") {
      return 'Error: Invalid or missing "path" parameter.';
    }

    const readPaths = permissions?.allowedReadPaths ||
      permissions?.allowedPaths || ["/"];
    if (!isPathAllowed(path, readPaths, context.currentAgentId, permissions)) {
      return `Permission Error: Accessing path "${path}" is restricted by permissions.`;
    }

    const item = findItemByPath(path, context.items);
    if (!item) {
      return `Error: Item not found at path "${path}".`;
    }

    const virtualPath = getVirtualPath(item.id, context.items);
    const created = new Date(item.createdAt).toLocaleString();
    const updated = new Date(item.updatedAt).toLocaleString();

    if (item.type === "file") {
      const content = item.content || "";
      const lines = content.split("\n").length;
      const chars = content.length;
      const words = content.trim() ? content.trim().split(/\s+/).length : 0;

      return (
        `--- Metadata for File "${virtualPath}" ---\n` +
        `Type: Plain Text / Code File\n` +
        `Path: /${virtualPath}\n` +
        `Lines: ${lines}\n` +
        `Words: ${words}\n` +
        `Characters: ${chars}\n` +
        `Created At: ${created}\n` +
        `Last Modified: ${updated}`
      );
    } else {
      const directChildren = context.items.filter(
        (i) => i.parentId === item.id,
      );
      const childCount = directChildren.length;
      const folderCount = directChildren.filter(
        (i) => i.type === "folder",
      ).length;
      const fileCount = directChildren.filter((i) => i.type === "file").length;

      return (
        `--- Metadata for Directory "${virtualPath}" ---\n` +
        `Type: Workspace Directory\n` +
        `Path: /${virtualPath}\n` +
        `Direct Children: ${childCount} items (${fileCount} files, ${folderCount} subfolders)\n` +
        `Created At: ${created}\n` +
        `Last Modified: ${updated}`
      );
    }
  },
};

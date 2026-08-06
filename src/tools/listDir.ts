/**
 * @file listDir.ts
 * @description Tool definition & handler for listing workspace directory contents.
 */

import {
  ToolModule,
  isPathAllowed,
  findItemByPath,
  getVirtualPath,
} from "./types";

export const listDirTool: ToolModule = {
  schema: {
    name: "list_dir",
    description: "List files and subfolders in a specific workspace directory.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description:
            'Folder path (e.g. "src" or "/" for root workspace directory).',
        },
        keyword: {
          type: "string",
          description: "Optional search keyword to filter items by name.",
        },
        limit: {
          type: "number",
          description: "Optional item limit (default 50).",
        },
      },
    },
  },

  async execute(args, context, permissions) {
    const { path = "/", keyword = "", limit = 50 } = args;

    const readPaths = permissions?.allowedReadPaths ||
      permissions?.allowedPaths || ["/"];
    if (!isPathAllowed(path, readPaths, context.currentAgentId, permissions)) {
      return `Permission Error: Accessing directory "${path}" is restricted by permissions.`;
    }

    let parentId: string | null = null;
    const cleanPath = path === "." ? "/" : path;

    if (cleanPath !== "/" && cleanPath !== "") {
      const folder = findItemByPath(cleanPath, context.items);
      if (!folder) {
        return `Error: Directory not found at path "${cleanPath}".`;
      }
      if (folder.type !== "folder") {
        return `Error: Path "${cleanPath}" points to a file, not a directory. Use read_file to inspect files.`;
      }
      parentId = folder.id;
    }

    let children = context.items.filter((i) => i.parentId === parentId);

    // Filter out items not allowed by path permissions or restricted /agent folder for non-admin agents
    children = children.filter((item) => {
      const itemPath = getVirtualPath(item.id, context.items);
      return isPathAllowed(
        itemPath,
        readPaths,
        context.currentAgentId,
        permissions,
      );
    });

    if (keyword) {
      const kw = keyword.toLowerCase();
      children = children.filter((i) => i.name.toLowerCase().includes(kw));
    }

    // Sort folders first, then files alphabetically
    children.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    const maxItems = Math.min(
      Math.max(1, limit),
      permissions?.maxDirItems || 100,
    );
    const totalCount = children.length;
    const truncatedChildren = children.slice(0, maxItems);

    if (totalCount === 0) {
      return `Directory "${cleanPath}" is empty.`;
    }

    const lines = truncatedChildren.map((c) => {
      if (c.type === "folder") {
        return `${c.name}/`;
      } else {
        return c.name;
      }
    });

    let result = `Directory "${cleanPath}":\n${lines.join("\n")}`;
    if (totalCount > maxItems) {
      result += `\n... [Showing ${maxItems} of ${totalCount} items]`;
    }

    return result;
  },
};

/**
 * @file writeFile.ts
 * @description Tool definition & handler for writing or overwriting workspace files with automatic folder creation.
 */

import { ToolModule, isPathAllowed, findItemByPath } from "./types";

export const writeFileTool: ToolModule = {
  schema: {
    name: "write_file",
    description:
      "Write or overwrite full text content into a file in the workspace. Auto-creates parent directories.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description:
            'The relative file path (e.g. "src/App.tsx" or "output.json").',
        },
        content: {
          type: "string",
          description: "The complete text content to write.",
        },
      },
      required: ["path", "content"],
    },
  },

  async execute(args, context, permissions) {
    const { path, content } = args;
    if (!path || typeof path !== "string") {
      return 'Error: Invalid or missing "path" parameter.';
    }
    if (content === undefined || content === null) {
      return 'Error: Missing "content" parameter.';
    }

    const writePaths = permissions?.allowedWritePaths ||
      permissions?.allowedPaths || ["/"];
    if (!isPathAllowed(path, writePaths, context.currentAgentId, permissions)) {
      return `Permission Error: Writing to path "${path}" is restricted by permissions.`;
    }

    const cleanPath = path
      .replace(/\\/g, "/")
      .replace(/^\/+|\/+$/g, "")
      .trim();
    if (!cleanPath) {
      return "Error: Invalid empty file path.";
    }

    const parts = cleanPath.split("/");
    const fileName = parts.pop() || "untitled.txt";

    // 1. Ensure all parent directories exist
    let currentParentId: string | null = null;
    for (const dirName of parts) {
      if (!dirName) continue;
      const existingDir = context.items.find(
        (i) =>
          i.type === "folder" &&
          i.name.toLowerCase() === dirName.toLowerCase() &&
          i.parentId === currentParentId,
      );

      if (existingDir) {
        currentParentId = existingDir.id;
      } else {
        const folderId = await context.createFolder(dirName, currentParentId);
        context.items.push({
          id: folderId,
          name: dirName,
          type: "folder",
          parentId: currentParentId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isExpanded: true,
        });
        currentParentId = folderId;
      }
    }

    // 2. Create or update file
    const existingFile = context.items.find(
      (i) =>
        i.type === "file" &&
        i.name.toLowerCase() === fileName.toLowerCase() &&
        i.parentId === currentParentId,
    );

    const charCount = content.length;
    const lineCount = content.split("\n").length;

    if (existingFile) {
      await context.updateFileContent(existingFile.id, content);
      existingFile.content = content;
      existingFile.updatedAt = new Date().toISOString();
      return `Successfully updated file "${cleanPath}" (${lineCount} lines, ${charCount} chars).`;
    } else {
      const fileId = await context.createFile(
        fileName,
        currentParentId,
        content,
      );
      context.items.push({
        id: fileId,
        name: fileName,
        type: "file",
        parentId: currentParentId,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return `Successfully created new file "${cleanPath}" (${lineCount} lines, ${charCount} chars).`;
    }
  },
};

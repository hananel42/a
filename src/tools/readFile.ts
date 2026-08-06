/**
 * @file readFile.ts
 * @description Tool definition & handler for reading workspace file contents with line range & truncation support.
 */

import {
  ToolModule,
  isPathAllowed,
  findItemByPath,
  truncateOutput,
} from "./types";

export const readFileTool: ToolModule = {
  schema: {
    name: "read_file",
    description:
      "Read the contents of a text file in the workspace with optional line range and character limits.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description:
            'The file relative path in workspace (e.g. "script.py" or "docs/setup.md").',
        },
        startLine: {
          type: "number",
          description: "Optional 1-indexed start line number.",
        },
        endLine: {
          type: "number",
          description: "Optional inclusive end line number.",
        },
        maxChars: {
          type: "number",
          description: "Optional character budget limit (default 8000).",
        },
      },
      required: ["path"],
    },
  },

  async execute(args, context, permissions) {
    const rawPath = args.path || args.filePath;
    if (!rawPath || typeof rawPath !== "string") {
      return 'Error: Invalid or missing "path" parameter in read_file request.';
    }

    const path = rawPath.trim();
    const readPaths = permissions?.allowedReadPaths ||
      permissions?.allowedPaths || ["/"];
    if (!isPathAllowed(path, readPaths, context.currentAgentId, permissions)) {
      return `Permission Error: Reading path "${path}" is restricted by permissions.`;
    }

    const item = findItemByPath(path, context.items);
    if (!item) {
      return `Error: File not found at path "${path}". Please verify the file path using list_dir.`;
    }

    if (item.type !== "file") {
      return `Error: Path "${path}" refers to a directory, not a file. Use list_dir to inspect directory contents.`;
    }

    const fullContent = item.content || "";
    const lines = fullContent.split("\n");
    const totalLines = lines.length;

    if (!fullContent && totalLines <= 1 && lines[0] === "") {
      return `--- File Content: "${path}" (Empty file) ---\n(File contains 0 bytes / empty)\n--- End File Content ---`;
    }

    const rawStart =
      args.startLine !== undefined && args.startLine !== null
        ? Number(args.startLine)
        : undefined;
    const rawEnd =
      args.endLine !== undefined && args.endLine !== null
        ? Number(args.endLine)
        : undefined;

    const hasLineRange =
      (rawStart !== undefined && !isNaN(rawStart)) ||
      (rawEnd !== undefined && !isNaN(rawEnd));

    let start = 0;
    let end = totalLines;
    let lineMeta = ` [Total lines: ${totalLines}]`;

    if (hasLineRange) {
      start =
        rawStart !== undefined && !isNaN(rawStart)
          ? Math.max(1, Math.floor(rawStart)) - 1
          : 0;
      end =
        rawEnd !== undefined && !isNaN(rawEnd)
          ? Math.min(totalLines, Math.floor(rawEnd))
          : totalLines;

      if (start >= totalLines) {
        return `Error: startLine (${rawStart}) exceeds total file lines (${totalLines}).`;
      }
      if (start > end) {
        return `Error: startLine (${rawStart}) cannot be greater than endLine (${rawEnd}).`;
      }
      lineMeta = ` [Lines ${start + 1}-${end} of ${totalLines}]`;
    }

    const slicedLines = lines.slice(start, end);
    const bodyText = slicedLines.join("\n");

    const limit = args.maxChars || permissions?.maxFileReadChars || 12000;
    const truncatedBody = truncateOutput(bodyText, limit, `File "${path}"`);

    if (hasLineRange) {
      return `--- File Content: "${path}"${lineMeta} ---\n${truncatedBody}\n--- End File Content ---`;
    }

    return truncatedBody;
  },
};

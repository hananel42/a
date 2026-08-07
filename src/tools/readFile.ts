/**
 * @file readFile.ts
 * @description Tool definition & handler for reading workspace file contents with line range & truncation support.
 */

import { AGENT_MESSAGES } from "../constants/agentMessages";
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
      return AGENT_MESSAGES.READ_FILE_PERMISSION_ERROR.replace("{path}", path);
    }

    const item = findItemByPath(path, context.items);
    if (!item) {
      return AGENT_MESSAGES.READ_FILE_NOT_FOUND.replace("{path}", path);
    }

    if (item.type !== "file") {
      return AGENT_MESSAGES.READ_FILE_IS_DIR.replace("{path}", path);
    }

    const fullContent = item.content || "";
    const lines = fullContent.split("\n");
    const totalLines = lines.length;

    if (!fullContent && totalLines <= 1 && lines[0] === "") {
      return AGENT_MESSAGES.READ_FILE_EMPTY.replace("{path}", path);
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
        return AGENT_MESSAGES.READ_FILE_STARTLINE_EXCEEDS.replace("{start}", String(rawStart)).replace("{total}", String(totalLines));
      }
      if (start > end) {
        return AGENT_MESSAGES.READ_FILE_STARTLINE_GREATER.replace("{start}", String(rawStart)).replace("{end}", String(rawEnd));
      }
      lineMeta = ` [Lines ${start + 1}-${end} of ${totalLines}]`;
    }

    const slicedLines = lines.slice(start, end);
    const bodyText = slicedLines.join("\n");

    const limit = args.maxChars || permissions?.maxFileReadChars || 12000;
    const truncatedBody = truncateOutput(bodyText, limit, `File "${path}"`);

    if (hasLineRange) {
      return AGENT_MESSAGES.READ_FILE_SUCCESS.replace("{path}", path).replace("{meta}", lineMeta).replace("{body}", truncatedBody);
    }

    return truncatedBody;
  },
};

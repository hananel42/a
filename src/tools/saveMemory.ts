/**
 * @file saveMemory.ts
 * @description Tool definition & handler for appending memory entries to an agent's simple memory list file.
 */

import { AGENT_MESSAGES } from "../constants/agentMessages";
import { ToolModule, findItemByPath } from "./types";

export const saveMemoryTool: ToolModule = {
  schema: {
    name: "save_memory",
    description:
      "Save CRITICAL LONG-TERM facts, key user preferences, permanent rules or architecture decisions into your long-term memory. Save ONLY information essential across future sessions.",
    parameters: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description:
            "The long-term note, preference, rule, or fact to save into long-term memory.",
        },
      },
      required: ["text"],
    },
  },

  async execute(args, context) {
    const { text } = args;
    if (!text || typeof text !== "string" || !text.trim()) {
      return AGENT_MESSAGES.SAVE_MEMORY_EMPTY;
    }

    const agentId = context.currentAgentId || "default";
    const cleanText = text.trim();
    const memoryLine = cleanText.startsWith("- ")
      ? cleanText
      : `- ${cleanText}`;

    // Target memory list file inside the specific agent folder: .agents/{agentId}/memories.txt
    const targetPath = `.agents/${agentId}/memories.txt`;
    const existingFile = findItemByPath(targetPath, context.items);

    if (existingFile && existingFile.type === "file") {
      const currentContent = existingFile.content || "";
      const updatedContent = currentContent
        ? `${currentContent.trim()}\n${memoryLine}`
        : memoryLine;
      await context.updateFileContent(existingFile.id, updatedContent);
      existingFile.content = updatedContent;
      existingFile.updatedAt = new Date().toISOString();
      return AGENT_MESSAGES.SAVE_MEMORY_SUCCESS;
    } else {
      // Create nested directories "agent" and agentId folder if they don't exist
      const parts = targetPath.split("/");
      const fileName = parts.pop()!;
      let currentParentId: string | null = null;

      for (const dirName of parts) {
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

      const fileId = await context.createFile(
        fileName,
        currentParentId,
        memoryLine,
      );
      context.items.push({
        id: fileId,
        name: fileName,
        type: "file",
        parentId: currentParentId,
        content: memoryLine,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return AGENT_MESSAGES.SAVE_MEMORY_SUCCESS;
    }
  },
};

/**
 * @file agentSyncUtils.ts
 * @description Helpers for bi-directional synchronization between React agent state and workspace filesystem.
 */

import { Agent } from "../types/agent";
import { DEFAULT_PERMISSIONS } from "../data/defaultAgents";

export const AGENTS_STORAGE_KEY = "agentic_hub_agents_v2";

export interface SyncResult {
  updatedItems: any[];
  workspaceChanged: boolean;
  updatedAgents: Agent[];
  agentsChanged: boolean;
}

export function performAgentWorkspaceSync(
  currentItems: any[],
  currentAgents: Agent[],
): SyncResult {
  let itemsCopy = [...currentItems];
  let workspaceChanged = false;
  let stateAgentsCopy = [...currentAgents];
  let agentsStateChanged = false;

  // Migrate existing workspace/agent structure if any
  const oldWsFolder = itemsCopy.find(
    (i) =>
      i.type === "folder" &&
      i.name.toLowerCase() === "workspace" &&
      i.parentId === null,
  );
  if (oldWsFolder) {
    itemsCopy = itemsCopy
      .map((item) => {
        if (item.parentId === oldWsFolder.id) {
          return { ...item, parentId: null };
        }
        return item;
      })
      .filter((item) => item.id !== oldWsFolder.id);
    workspaceChanged = true;
  }

  // Ensure '.agents' folder exists directly at root
  let agentRootFolder = itemsCopy.find(
    (i) =>
      i.type === "folder" &&
      (i.name.toLowerCase() === ".agents" ||
        i.name.toLowerCase() === "agent") &&
      i.parentId === null,
  );
  if (!agentRootFolder) {
    const agentRootId = `folder-agent-${Date.now()}`;
    itemsCopy.push({
      id: agentRootId,
      name: ".agents",
      type: "folder",
      parentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isExpanded: true,
    });
    agentRootFolder = itemsCopy[itemsCopy.length - 1];
    workspaceChanged = true;
  } else if (agentRootFolder.name !== ".agents") {
    agentRootFolder.name = ".agents";
    workspaceChanged = true;
  }

  // Clean up legacy folder
  const legacyFolder = itemsCopy.find(
    (i) =>
      i.type === "folder" &&
      i.parentId === null &&
      i.name.toLowerCase() === "agent" &&
      i.id !== agentRootFolder.id,
  );
  if (legacyFolder) {
    itemsCopy = itemsCopy
      .map((item) => {
        if (item.parentId === legacyFolder.id) {
          return { ...item, parentId: agentRootFolder!.id };
        }
        return item;
      })
      .filter((item) => item.id !== legacyFolder.id);
    workspaceChanged = true;
  }

  // Remove legacy agent.md files
  const legacyMdFiles = itemsCopy.filter(
    (i) => i.type === "file" && i.name === "agent.md",
  );
  if (legacyMdFiles.length > 0) {
    const legacyIds = new Set(legacyMdFiles.map((f) => f.id));
    itemsCopy = itemsCopy.filter((i) => !legacyIds.has(i.id));
    workspaceChanged = true;
  }

  // BI-DIRECTIONAL STEP 1: READ WORKSPACE FILES -> UPDATE REACT AGENT STATE
  const agentSubFolders = itemsCopy.filter(
    (i) => i.type === "folder" && i.parentId === agentRootFolder!.id,
  );
  for (const agDir of agentSubFolders) {
    const agId = agDir.name;
    const agentJsonFile = itemsCopy.find(
      (i) =>
        i.type === "file" && i.name === "agent.json" && i.parentId === agDir.id,
    );
    const permsJsonFile = itemsCopy.find(
      (i) =>
        i.type === "file" &&
        i.name === "permissions.json" &&
        i.parentId === agDir.id,
    );

    if (agentJsonFile && agentJsonFile.content) {
      try {
        const parsedMeta = JSON.parse(agentJsonFile.content);
        let parsedPerms = DEFAULT_PERMISSIONS;
        if (permsJsonFile && permsJsonFile.content) {
          try {
            parsedPerms = {
              ...DEFAULT_PERMISSIONS,
              ...JSON.parse(permsJsonFile.content),
            };
          } catch {
            // ignore JSON parse error
          }
        }

        const existingIndex = stateAgentsCopy.findIndex(
          (a) => a.id === agId || a.id === parsedMeta.id,
        );
        if (existingIndex >= 0) {
          const currentAg = stateAgentsCopy[existingIndex];
          const mergedAg: Agent = {
            ...currentAg,
            ...parsedMeta,
            id: agId,
            permissions: parsedPerms,
          };

          if (
            currentAg.instructions !== mergedAg.instructions ||
            currentAg.name !== mergedAg.name ||
            currentAg.description !== mergedAg.description ||
            currentAg.avatar !== mergedAg.avatar ||
            currentAg.defaultModel !== mergedAg.defaultModel ||
            JSON.stringify(currentAg.permissions) !==
              JSON.stringify(mergedAg.permissions) ||
            JSON.stringify(currentAg.examplePrompts) !==
              JSON.stringify(mergedAg.examplePrompts) ||
            JSON.stringify(currentAg.promptConfig) !==
              JSON.stringify(mergedAg.promptConfig)
          ) {
            stateAgentsCopy[existingIndex] = mergedAg;
            agentsStateChanged = true;
          }
        } else if (parsedMeta.name && parsedMeta.instructions) {
          const newAg: Agent = {
            id: agId,
            name: parsedMeta.name || agId,
            description: parsedMeta.description || "",
            avatar: parsedMeta.avatar || "brain",
            instructions: parsedMeta.instructions || "",
            permissions: parsedPerms,
            defaultModel: parsedMeta.defaultModel,
            promptConfig: parsedMeta.promptConfig,
            examplePrompts: parsedMeta.examplePrompts,
            isDefault: parsedMeta.isDefault || false,
            createdAt: parsedMeta.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          stateAgentsCopy.push(newAg);
          agentsStateChanged = true;
        }
      } catch {
        // Invalid JSON
      }
    }
  }

  // BI-DIRECTIONAL STEP 2: WRITE REACT AGENT STATE -> WORKSPACE FILES
  const timestamp = new Date().toISOString();
  for (const ag of stateAgentsCopy) {
    const agFolderName = ag.id;
    let agFolder = itemsCopy.find(
      (i) =>
        i.type === "folder" &&
        i.name === agFolderName &&
        i.parentId === agentRootFolder!.id,
    );

    if (!agFolder) {
      const agFolderId = `folder-ag-${ag.id}-${Date.now()}`;
      itemsCopy.push({
        id: agFolderId,
        name: agFolderName,
        type: "folder",
        parentId: agentRootFolder!.id,
        createdAt: timestamp,
        updatedAt: timestamp,
        isExpanded: false,
      });
      agFolder = itemsCopy[itemsCopy.length - 1];
      workspaceChanged = true;
    }

    const { permissions, ...metadata } = ag;
    const expectedAgentJson = JSON.stringify(metadata, null, 2);
    const agentJsonFile = itemsCopy.find(
      (i) =>
        i.type === "file" &&
        i.name === "agent.json" &&
        i.parentId === agFolder.id,
    );

    if (!agentJsonFile) {
      itemsCopy.push({
        id: `file-ag-json-${ag.id}-${Date.now()}`,
        name: "agent.json",
        type: "file",
        parentId: agFolder.id,
        content: expectedAgentJson,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      workspaceChanged = true;
    } else if (agentJsonFile.content !== expectedAgentJson) {
      agentJsonFile.content = expectedAgentJson;
      agentJsonFile.updatedAt = timestamp;
      workspaceChanged = true;
    }

    const expectedPermsJson = JSON.stringify(permissions, null, 2);
    const permsFile = itemsCopy.find(
      (i) =>
        i.type === "file" &&
        i.name === "permissions.json" &&
        i.parentId === agFolder.id,
    );

    if (!permsFile) {
      itemsCopy.push({
        id: `file-ag-perms-${ag.id}-${Date.now()}`,
        name: "permissions.json",
        type: "file",
        parentId: agFolder.id,
        content: expectedPermsJson,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      workspaceChanged = true;
    } else if (permsFile.content !== expectedPermsJson) {
      permsFile.content = expectedPermsJson;
      permsFile.updatedAt = timestamp;
      workspaceChanged = true;
    }

    ["tools", "memories", "chats"].forEach((sub) => {
      const hasSubFolder = itemsCopy.some(
        (i) =>
          i.type === "folder" && i.name === sub && i.parentId === agFolder!.id,
      );
      if (!hasSubFolder) {
        itemsCopy.push({
          id: `folder-ag-${sub}-${ag.id}-${Date.now()}`,
          name: sub,
          type: "folder",
          parentId: agFolder!.id,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        workspaceChanged = true;
      }
    });
  }

  return {
    updatedItems: itemsCopy,
    workspaceChanged,
    updatedAgents: stateAgentsCopy,
    agentsChanged: agentsStateChanged,
  };
}

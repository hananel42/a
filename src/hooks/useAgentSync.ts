/**
 * @file useAgentSync.ts
 * @description Custom state hook managing active AI agents, browser persistence,
 * and workspace file system synchronization.
 */

import { useState, useEffect } from "react";
import { Agent } from "../types/agent";
import { defaultAgents, DEFAULT_PERMISSIONS } from "../data/defaultAgents";
import {
  AGENTS_STORAGE_KEY,
  performAgentWorkspaceSync,
} from "./agentSyncUtils";

export function useAgentSync(
  workspace: any,
  showNotification: (m: string, t?: "success" | "error") => void,
) {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(AGENTS_STORAGE_KEY);
    if (saved) {
      try {
        const loaded: Agent[] = JSON.parse(saved);
        const customAgents = loaded.filter(
          (a) => !a.isDefault && !defaultAgents.some((da) => da.id === a.id),
        );
        const updated = [...defaultAgents, ...customAgents];
        setAgents(updated);
        localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        setAgents(defaultAgents);
      }
    } else {
      setAgents(defaultAgents);
      localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(defaultAgents));
    }
  }, []);

  useEffect(() => {
    if (workspace.items.length === 0 || agents.length === 0) return;

    const { updatedItems, workspaceChanged, updatedAgents, agentsChanged } =
      performAgentWorkspaceSync(workspace.items, agents);

    if (agentsChanged) {
      setAgents(updatedAgents);
      localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(updatedAgents));
    }

    if (workspaceChanged) {
      workspace.persistWorkspace?.(updatedItems);
    }
  }, [agents, workspace.items]);

  const createAgent = async (
    name: string,
    desc: string,
    instructions: string,
    tools: string[],
    avatar: string = "brain",
    allowedReadPaths: string[] = ["/"],
    allowedWritePaths: string[] = ["/"],
    defaultModel?: string,
    promptConfig?: any,
    examplePrompts?: string[],
    allowAgentFolderAccess?: boolean,
  ): Promise<string> => {
    const cleanId = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-");

    if (agents.some((a) => a.id === cleanId)) {
      showNotification("An agent with that name already exists.", "error");
      return cleanId;
    }

    const newAgent: Agent = {
      id: cleanId,
      name,
      description: desc,
      avatar: avatar || "brain",
      instructions,
      permissions: {
        ...DEFAULT_PERMISSIONS,
        allowedTools: tools,
        allowedReadPaths,
        allowedWritePaths,
        allowAgentFolderAccess: allowAgentFolderAccess || false,
      },
      defaultModel,
      promptConfig,
      examplePrompts,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...agents, newAgent];
    setAgents(updated);
    localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(updated));
    showNotification(
      `Agent "${name}" successfully compiled and synchronized!`,
      "success",
    );
    return cleanId;
  };

  const updateAgent = (id: string, updatedFields: Partial<Agent>) => {
    const updated = agents.map((a) => {
      if (a.id === id) {
        const merged = {
          ...a,
          ...updatedFields,
          updatedAt: new Date().toISOString(),
        };
        if (updatedFields.permissions) {
          merged.permissions = {
            ...a.permissions,
            ...updatedFields.permissions,
          };
        }
        return merged;
      }
      return a;
    });
    setAgents(updated);
    localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(updated));
    showNotification(`Agent configuration updated successfully.`, "success");
  };

  const deleteAgent = (id: string) => {
    const target = agents.find((a) => a.id === id);
    if (!target || target.isDefault) return;

    const updated = agents.filter((a) => a.id !== id);
    setAgents(updated);
    localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(updated));

    const itemsCopy = workspace.items.filter(
      (item: any) => item.name !== id || item.type !== "folder",
    );
    workspace.persistWorkspace?.(itemsCopy);
    showNotification(`Agent "${target.name}" decommissioned.`, "success");
  };

  const resetAgents = () => {
    setAgents(defaultAgents);
    localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(defaultAgents));
    showNotification(
      "Agents catalog restored to default configurations!",
      "success",
    );
  };

  return {
    agents,
    createAgent,
    updateAgent,
    deleteAgent,
    resetAgents,
  };
}

export type UseAgentSyncType = ReturnType<typeof useAgentSync>;

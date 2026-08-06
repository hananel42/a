/**
 * @file workspaceApi.ts
 * @description High-performance API services connecting the workspace system to either virtual local storage
 * or local computer physical directories via the native browser File System Access API.
 *
 * Exposed API:
 * - `loadVirtualWorkspace()`: Load JSON files list from localStorage.
 * - `saveVirtualWorkspace(items)`: Persist files list JSON to localStorage.
 * - `loadPhysicalDirectory(...)`: Recurse folders and files, reading text/media to memory.
 * - `writePhysicalFile(...)`: Stream files to disk, with base64 data conversion if needed.
 * - `createPhysicalItem(...)`: Allocate brand-new files or folders on host disk.
 * - `deletePhysicalItem(...)`: Perform file deletions directly on local host.
 */

import { WorkspaceItem } from "../types/workspace";
import { getDefaultWorkspaceItems } from "../constants/initialWorkspace";

const STORAGE_KEY = "markdown_hub_workspace_v2";

/**
 * Loads the virtual workspace items from browser's local storage.
 */
export function loadVirtualWorkspace(): WorkspaceItem[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const defaultItems = getDefaultWorkspaceItems();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultItems));
    return defaultItems;
  }
  try {
    let parsed = JSON.parse(data) as WorkspaceItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const defaultItems = getDefaultWorkspaceItems();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultItems));
      return defaultItems;
    }

    // Auto-migrate & cleanup legacy root 'agent' folder
    const agentsFolder = parsed.find(
      (i) =>
        i.type === "folder" &&
        i.parentId === null &&
        i.name.toLowerCase() === ".agents",
    );
    const legacyAgentFolder = parsed.find(
      (i) =>
        i.type === "folder" &&
        i.parentId === null &&
        i.name.toLowerCase() === "agent",
    );

    if (legacyAgentFolder) {
      if (!agentsFolder) {
        legacyAgentFolder.name = ".agents";
      } else {
        parsed.forEach((item) => {
          if (item.parentId === legacyAgentFolder.id) {
            item.parentId = agentsFolder.id;
          }
        });
        parsed = parsed.filter((i) => i.id !== legacyAgentFolder.id);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }

    // Auto-update sample script if it has legacy fragile implementation
    const sampleScriptItem = parsed.find(
      (i) =>
        i.id === "file-admin-sample-tool-script" ||
        (i.name === "script.py" &&
          i.content?.includes("# Custom Python Tool for Admin Agent")),
    );
    if (
      sampleScriptItem &&
      !sampleScriptItem.content.includes("isinstance(parsed, dict)")
    ) {
      const updatedScript = getDefaultWorkspaceItems().find(
        (i) => i.id === "file-admin-sample-tool-script",
      )?.content;
      if (updatedScript) {
        sampleScriptItem.content = updatedScript;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }

    return parsed;
  } catch (err) {
    console.error("Error loading virtual workspace:", err);
    return getDefaultWorkspaceItems();
  }
}

/**
 * Persists the virtual workspace items list to browser's local storage.
 */
export function saveVirtualWorkspace(items: WorkspaceItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error("Error saving virtual workspace:", err);
  }
}

/**
 * Recursively parses a File System Access API Directory Handle into flat WorkspaceItem models.
 */
export async function loadPhysicalDirectory(
  dirHandle: any,
  parentId: string | null = null,
  pathAccumulator: string[] = [],
): Promise<WorkspaceItem[]> {
  const items: WorkspaceItem[] = [];

  for await (const entry of dirHandle.values()) {
    const entryId = `physical-${pathAccumulator.concat(entry.name).join("/")}`;
    const timestamp = new Date().toISOString();

    if (entry.kind === "file") {
      const file = await entry.getFile();
      let fileContent = "";

      if (
        file.type.startsWith("image/") ||
        file.type.startsWith("video/") ||
        file.type.startsWith("audio/")
      ) {
        fileContent = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      } else {
        fileContent = await file.text();
      }

      items.push({
        id: entryId,
        name: entry.name,
        type: "file",
        parentId,
        content: fileContent,
        createdAt: timestamp,
        updatedAt: timestamp,
        handle: entry,
      });
    } else if (entry.kind === "directory") {
      items.push({
        id: entryId,
        name: entry.name,
        type: "folder",
        parentId,
        createdAt: timestamp,
        updatedAt: timestamp,
        handle: entry,
        isExpanded: false,
      });

      const subItems = await loadPhysicalDirectory(
        entry,
        entryId,
        pathAccumulator.concat(entry.name),
      );
      items.push(...subItems);
    }
  }

  return items;
}

/**
 * Writes updated content to a physical disk file using File System Access API handle.
 */
export async function writePhysicalFile(
  fileHandle: any,
  content: string,
): Promise<void> {
  if (!fileHandle || typeof fileHandle.createWritable !== "function") {
    throw new Error("Invalid file handle provided for physical disk writing.");
  }

  const writable = await fileHandle.createWritable();

  if (content.startsWith("data:")) {
    const response = await fetch(content);
    const blob = await response.blob();
    await writable.write(blob);
  } else {
    await writable.write(content);
  }

  await writable.close();
}

/**
 * Allocates a new physical item on the host local file system.
 */
export async function createPhysicalItem(
  parentHandle: any,
  name: string,
  type: "file" | "folder",
  initialContent: string = "",
): Promise<{ item: WorkspaceItem; handle: any }> {
  if (!parentHandle) {
    throw new Error(
      "Parent directory handle is required to create a physical file or directory.",
    );
  }

  const timestamp = new Date().toISOString();
  const entryId = `physical-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  if (type === "file") {
    const newFileHandle = await parentHandle.getFileHandle(name, {
      create: true,
    });
    if (initialContent) {
      await writePhysicalFile(newFileHandle, initialContent);
    }

    return {
      item: {
        id: entryId,
        name,
        type: "file",
        parentId: null,
        content: initialContent,
        createdAt: timestamp,
        updatedAt: timestamp,
        handle: newFileHandle,
      },
      handle: newFileHandle,
    };
  } else {
    const newDirHandle = await parentHandle.getDirectoryHandle(name, {
      create: true,
    });
    return {
      item: {
        id: entryId,
        name,
        type: "folder",
        parentId: null,
        createdAt: timestamp,
        updatedAt: timestamp,
        handle: newDirHandle,
        isExpanded: true,
      },
      handle: newDirHandle,
    };
  }
}

/**
 * Removes an existing file or directory directly from host local file system.
 */
export async function deletePhysicalItem(
  parentHandle: any,
  name: string,
): Promise<void> {
  if (!parentHandle || typeof parentHandle.removeEntry !== "function") {
    throw new Error(
      "Parent directory handle is required to delete physical file/folder entry.",
    );
  }
  await parentHandle.removeEntry(name, { recursive: true });
}

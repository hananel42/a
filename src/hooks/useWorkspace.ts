/**
 * @file useWorkspace.ts
 * @description State hook for managing workspace files, directories, uploads, and selections.
 * Supports virtual localStorage and browser File System Access handles.
 */

import { useState, useEffect, useRef } from "react";
import { WorkspaceItem, LocalFolderConnection } from "../types/workspace";
import { templates } from "../data/templates";
import {
  loadVirtualWorkspace,
  saveVirtualWorkspace,
  loadPhysicalDirectory,
  writePhysicalFile,
  createPhysicalItem,
  deletePhysicalItem,
} from "../services/workspaceApi";

export function useWorkspace(
  showNotification: (msg: string, type: "success" | "error") => void,
) {
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string>("welcome");
  const [localFolder, setLocalFolder] = useState<LocalFolderConnection | null>(
    null,
  );
  const physicalRootHandleRef = useRef<any>(null);

  useEffect(() => {
    const saved = loadVirtualWorkspace();
    if (saved.length > 0) {
      setItems(saved);
      const activeExists = saved.some(
        (item) => item.id === activeItemId && item.type === "file",
      );
      if (!activeExists) {
        const firstFile = saved.find((item) => item.type === "file");
        if (firstFile) setActiveItemId(firstFile.id);
      }
    } else {
      const defaultItems: WorkspaceItem[] = [
        {
          id: "folder-guides",
          name: "Guides",
          type: "folder",
          parentId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isExpanded: true,
        },
        {
          id: "folder-showcases",
          name: "Showcases",
          type: "folder",
          parentId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isExpanded: true,
        },
      ];

      templates.forEach((t) => {
        const parentId =
          t.id === "welcome" || t.id === "markdown-spec"
            ? "folder-guides"
            : "folder-showcases";
        defaultItems.push({
          id: t.id,
          name: t.id === "welcome" ? "welcome.md" : `${t.id}.md`,
          type: "file",
          parentId,
          content: t.content,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        });
      });

      setItems(defaultItems);
      saveVirtualWorkspace(defaultItems);
      setActiveItemId("welcome");
    }
  }, []);

  const persistWorkspace = (
    updater: WorkspaceItem[] | ((prev: WorkspaceItem[]) => WorkspaceItem[]),
  ) => {
    setItems((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (!localFolder) saveVirtualWorkspace(next);
      return next;
    });
  };

  const toggleFolderExpanded = (id: string) => {
    persistWorkspace((prev) =>
      prev.map((item) =>
        item.id === id && item.type === "folder"
          ? { ...item, isExpanded: !item.isExpanded }
          : item,
      ),
    );
  };

  const createFile = async (
    name: string,
    parentId: string | null,
    content = "",
    selectAfterCreate = false,
  ) => {
    const cleanName = name.trim() || "untitled.md";
    const newId = `file-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();

    let createdHandle: any = null;
    if (localFolder && physicalRootHandleRef.current) {
      try {
        const res = await createPhysicalItem(
          physicalRootHandleRef.current,
          cleanName,
          "file",
          content,
        );
        createdHandle = res.handle;
      } catch {
        showNotification("Failed to create physical file.", "error");
        return "";
      }
    }

    const newItem: WorkspaceItem = {
      id: newId,
      name: cleanName,
      type: "file",
      parentId,
      content,
      createdAt: timestamp,
      updatedAt: timestamp,
      handle: createdHandle,
    };

    persistWorkspace((prev) => [...prev, newItem]);
    if (selectAfterCreate) {
      setActiveItemId(newId);
    }
    return newId;
  };

  const createFolder = async (name: string, parentId: string | null) => {
    const cleanName = name.trim() || "New Folder";
    const newId = `folder-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();

    let createdHandle: any = null;
    if (localFolder && physicalRootHandleRef.current) {
      try {
        const res = await createPhysicalItem(
          physicalRootHandleRef.current,
          cleanName,
          "folder",
        );
        createdHandle = res.handle;
      } catch {
        showNotification("Failed to create physical folder.", "error");
        return "";
      }
    }

    const newItem: WorkspaceItem = {
      id: newId,
      name: cleanName,
      type: "folder",
      parentId,
      createdAt: timestamp,
      updatedAt: timestamp,
      isExpanded: true,
      handle: createdHandle,
    };

    persistWorkspace((prev) => [...prev, newItem]);
    return newId;
  };

  const renameItem = async (id: string, newName: string) => {
    const cleanName = newName.trim();
    if (!cleanName) return;

    if (localFolder) {
      showNotification(
        "Renaming physical directories is restricted. Edit virtual items instead.",
        "error",
      );
      return;
    }

    persistWorkspace((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, name: cleanName, updatedAt: new Date().toISOString() }
          : item,
      ),
    );
  };

  const deleteItem = async (id: string) => {
    const itemToDelete = items.find((i) => i.id === id);
    if (!itemToDelete) return;

    if (
      items.filter((i) => i.type === "file").length <= 1 &&
      itemToDelete.type === "file"
    ) {
      showNotification("Keep at least one file in your workspace!", "error");
      return;
    }

    if (localFolder && physicalRootHandleRef.current) {
      try {
        await deletePhysicalItem(
          physicalRootHandleRef.current,
          itemToDelete.name,
        );
      } catch {
        showNotification("Failed to delete physical file.", "error");
        return;
      }
    }

    const getChildIds = (
      pId: string,
      currentItems: WorkspaceItem[],
    ): string[] => {
      const children = currentItems.filter((i) => i.parentId === pId);
      return [pId, ...children.flatMap((c) => getChildIds(c.id, currentItems))];
    };

    persistWorkspace((prev) => {
      const idsToRemove =
        itemToDelete.type === "folder" ? getChildIds(id, prev) : [id];
      const updated = prev.filter((item) => !idsToRemove.includes(item.id));
      if (idsToRemove.includes(activeItemId)) {
        const remainingFiles = updated.filter((item) => item.type === "file");
        if (remainingFiles.length > 0) setActiveItemId(remainingFiles[0].id);
      }
      return updated;
    });
  };

  const updateFileContent = async (id: string, newContent: string) => {
    const target = items.find((i) => i.id === id);
    persistWorkspace((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              content: newContent,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );

    if (localFolder && target?.handle) {
      try {
        await writePhysicalFile(target.handle, newContent);
      } catch (err) {
        console.error("Failed to sync write to physical file handle:", err);
      }
    }
  };

  const connectLocalFolder = async () => {
    if (!("showDirectoryPicker" in window)) {
      showNotification(
        "The File System Access API is not supported by your browser.",
        "error",
      );
      return;
    }
    try {
      const handle = await (window as any).showDirectoryPicker();
      physicalRootHandleRef.current = handle;
      showNotification(`Loading folder: "${handle.name}"...`, "success");

      const loadedItems = await loadPhysicalDirectory(handle);
      setItems(loadedItems);
      setLocalFolder({ folderName: handle.name, directoryHandle: handle });

      const firstFile = loadedItems.find((i) => i.type === "file");
      if (firstFile) setActiveItemId(firstFile.id);
    } catch (err: any) {
      if (err.name !== "AbortError")
        showNotification("Failed to access local directory.", "error");
    }
  };

  const disconnectLocalFolder = () => {
    physicalRootHandleRef.current = null;
    setLocalFolder(null);
    const saved = loadVirtualWorkspace();
    setItems(saved);
    const firstFile = saved.find((i) => i.type === "file");
    if (firstFile) setActiveItemId(firstFile.id);
    showNotification("Returned to virtual workspace.", "success");
  };

  const processUploadedFiles = async (
    uploadedFiles: File[],
    parentId: string | null,
  ): Promise<void> => {
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const filePromises = uploadedFiles.map((file, idx) => {
      return new Promise<WorkspaceItem>((resolve, reject) => {
        const reader = new FileReader();
        const isMedia = /\.(png|jpe?g|gif|webp|svg|ico|mp4|webm)$/i.test(
          file.name,
        );

        reader.onload = (event) => {
          const contentVal = (event.target?.result as string) || "";
          resolve({
            id: `file-${Date.now()}-${idx}-${Math.floor(Math.random() * 10000)}`,
            name: file.name,
            type: "file",
            parentId,
            content: contentVal,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        };

        reader.onerror = (err) => reject(err);

        if (isMedia) {
          reader.readAsDataURL(file);
        } else {
          reader.readAsText(file);
        }
      });
    });

    try {
      const newItems = await Promise.all(filePromises);
      persistWorkspace((prev) => [...prev, ...newItems]);
      if (newItems.length > 0) {
        setActiveItemId(newItems[0].id);
      }
      showNotification(`Uploaded ${uploadedFiles.length} file(s).`, "success");
    } catch (err) {
      console.error("Failed to process uploaded files:", err);
      showNotification("Failed to process uploaded files.", "error");
    }
  };

  const moveItem = (itemId: string, targetParentId: string | null) => {
    if (itemId === targetParentId) return;

    const getDescendants = (id: string, currentItems: WorkspaceItem[]): string[] => {
      const children = currentItems.filter((i) => i.parentId === id);
      return [id, ...children.flatMap((c) => getDescendants(c.id, currentItems))];
    };

    persistWorkspace((prev) => {
      const itemToMove = prev.find((i) => i.id === itemId);
      if (!itemToMove) return prev;

      if (itemToMove.type === "folder") {
        const descIds = getDescendants(itemId, prev);
        if (targetParentId && descIds.includes(targetParentId)) {
          showNotification("Cannot move a folder inside itself or its own subfolders.", "error");
          return prev;
        }
      }

      return prev.map((item) =>
        item.id === itemId
          ? { ...item, parentId: targetParentId, updatedAt: new Date().toISOString() }
          : item
      );
    });
  };

  const activeFile = items.find(
    (i) => i.id === activeItemId && i.type === "file",
  ) || {
    id: "welcome",
    name: "welcome.md",
    type: "file" as const,
    parentId: null,
    content: templates[0].content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    items,
    activeItemId,
    setActiveItemId,
    activeFile,
    localFolder,
    toggleFolderExpanded,
    createFile,
    createFolder,
    renameItem,
    deleteItem,
    updateFileContent,
    connectLocalFolder,
    disconnectLocalFolder,
    processUploadedFiles,
    persistWorkspace,
    moveItem,
  };
}

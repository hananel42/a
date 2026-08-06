/**
 * @file FileExplorer.tsx
 * @description Modern workspace file explorer with dual tree/navigation modes, path compaction, and drag-and-drop file uploading.
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Folder,
  FolderOpen,
  File,
  Plus,
  FolderPlus,
  Link,
  Unlink,
  FileUp,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Download,
  Edit3,
  Trash2,
  FolderTree,
  Compass,
  Check,
  MoreVertical,
  Move,
} from "lucide-react";
import { WorkspaceItem, LocalFolderConnection } from "../../types/workspace";
import FileTreeItem, { getFileIcon } from "./FileTreeItem";

interface FileExplorerProps {
  items: WorkspaceItem[];
  activeItemId: string;
  localFolder: LocalFolderConnection | null;
  setActiveItemId: (id: string) => void;
  toggleFolderExpanded: (id: string) => void;
  createFile: (name: string, parentId: string | null, content?: string, selectAfterCreate?: boolean) => Promise<string>;
  createFolder: (name: string, parentId: string | null) => Promise<string>;
  renameItem: (id: string, newName: string) => void;
  deleteItem: (id: string) => void;
  connectLocalFolder: () => void;
  disconnectLocalFolder: () => void;
  processUploadedFiles: (files: File[], parentId: string | null) => void;
  moveItem: (itemId: string, targetParentId: string | null) => void;
}

interface CompactedItem {
  chain: WorkspaceItem[];
  firstItem: WorkspaceItem;
  lastItem: WorkspaceItem;
  displayName: string;
  type: "file" | "folder";
}

export default function FileExplorer({
  items,
  activeItemId,
  localFolder,
  setActiveItemId,
  toggleFolderExpanded,
  createFile,
  createFolder,
  renameItem,
  deleteItem,
  connectLocalFolder,
  disconnectLocalFolder,
  processUploadedFiles,
  moveItem,
}: FileExplorerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Persistence for layout modes
  const [explorerMode, setExplorerMode] = useState<"tree" | "compact">(
    () => {
      const saved = localStorage.getItem("explorerMode");
      return saved === "tree" || saved === "compact" ? saved : "tree";
    }
  );

  // Folder navigation state for compact mode
  const [currentNavFolderId, setCurrentNavFolderId] = useState<string | null>(null);

  // Drag and drop state
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isDraggingInternal, setIsDraggingInternal] = useState(false);
  const [activeDragOverId, setActiveDragOverId] = useState<string | null>(null);

  // Compact layout actions menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Inline editing & creation state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [inlineCreateParentId, setInlineCreateParentId] = useState<
    string | null | undefined
  >(undefined);
  const [inlineCreateType, setInlineCreateType] = useState<"file" | "folder">("file");
  const [inlineCreateValue, setInlineCreateValue] = useState("");
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  // Save layout preference
  const handleToggleMode = (mode: "tree" | "compact") => {
    setExplorerMode(mode);
    localStorage.setItem("explorerMode", mode);
  };

  // Sync folder navigation with active item
  useEffect(() => {
    if (activeItemId && explorerMode === "compact") {
      const activeItem = items.find((i) => i.id === activeItemId);
      if (activeItem) {
        setCurrentNavFolderId(activeItem.parentId);
      }
    }
  }, [activeItemId, items, explorerMode]);

  const handleInlineCreateSubmit = async () => {
    if (!inlineCreateValue.trim() || inlineCreateParentId === undefined) return;
    if (inlineCreateType === "file") {
      await createFile(inlineCreateValue, inlineCreateParentId, "", true);
    } else {
      await createFolder(inlineCreateValue, inlineCreateParentId);
    }
    setInlineCreateParentId(undefined);
    setInlineCreateValue("");
  };

  const handleInlineCreateCancel = () => {
    setInlineCreateParentId(undefined);
    setInlineCreateValue("");
  };

  const handleStartRename = (item: WorkspaceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditValue(item.name);
  };

  const handleSaveRename = (id: string) => {
    if (editValue.trim()) renameItem(id, editValue.trim());
    setEditingId(null);
  };

  const handleDownloadItem = (item: WorkspaceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const contentVal = item.content || "";
    const blob = contentVal.startsWith("data:")
      ? (() => {
          const parts = contentVal.split(",");
          const byteString = atob(parts[1]);
          const mime = parts[0].split(":")[1].split(";")[0];
          const ia = new Uint8Array(byteString.length);
          for (let i = 0; i < byteString.length; i++)
            ia[i] = byteString.charCodeAt(i);
          return new Blob([ia], { type: mime });
        })()
      : new Blob([contentVal], { type: "text/plain;charset=utf-8" });

    const el = document.createElement("a");
    el.href = URL.createObjectURL(blob);
    el.download = item.name;
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  };

  // Build breadcrumb list from current folder up to root
  const getBreadcrumbs = () => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: "Root" }];
    if (!currentNavFolderId) return crumbs;

    const pathItems: { id: string; name: string }[] = [];
    let currentId: string | null = currentNavFolderId;
    let safeguard = 0;
    while (currentId && safeguard < 100) {
      safeguard++;
      const folder = items.find((i) => i.id === currentId && i.type === "folder");
      if (folder) {
        pathItems.unshift({ id: folder.id, name: folder.name });
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    return [...crumbs, ...pathItems];
  };

  // Path compaction algorithm
  const getCompactedItems = (parentId: string | null): CompactedItem[] => {
    const directChildren = items.filter((item) => item.parentId === parentId);

    const compacted = directChildren.map((child) => {
      const chain: WorkspaceItem[] = [child];
      if (child.type === "file") {
        return {
          chain,
          firstItem: child,
          lastItem: child,
          displayName: child.name,
          type: "file" as const,
        };
      }

      let current = child;
      let safeguard = 0;
      while (safeguard < 100) {
        safeguard++;
        const descendants = items.filter((i) => i.parentId === current.id);
        if (descendants.length === 1) {
          current = descendants[0];
          chain.push(current);
          if (current.type === "file") {
            break;
          }
        } else {
          break;
        }
      }

      const lastItem = chain[chain.length - 1];
      return {
        chain,
        firstItem: child,
        lastItem,
        displayName: chain.map((i) => i.name).join("/"),
        type: lastItem.type,
      };
    });

    return compacted.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.displayName.localeCompare(b.displayName);
    });
  };

  const handleCreateInFolder = (folderId: string, type: "file" | "folder", e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentNavFolderId(folderId);
    setInlineCreateType(type);
    setInlineCreateParentId(folderId);
    setInlineCreateValue("");
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    // 1. Files from local computer
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const targetFolder = explorerMode === "compact" ? currentNavFolderId : null;
      processUploadedFiles(Array.from(e.dataTransfer.files), targetFolder);
      return;
    }

    // 2. Internal workspace item move to Root / active Nav folder
    const draggedId = e.dataTransfer.getData("application/workspace-item-id");
    if (draggedId) {
      const targetParentId = explorerMode === "compact" ? currentNavFolderId : null;
      moveItem(draggedId, targetParentId);
    }
  };

  // Recursive Tree Render
  const renderTree = (parentId: string | null) => {
    const sorted = items
      .filter((item) => item.parentId === parentId)
      .sort((a, b) =>
        a.type !== b.type
          ? a.type === "folder"
            ? -1
            : 1
          : a.name.localeCompare(b.name)
      );

    return sorted.map((item) => (
      <FileTreeItem
        key={item.id}
        item={item}
        items={items}
        activeItemId={activeItemId}
        editingId={editingId}
        editValue={editValue}
        itemToDeleteId={itemToDeleteId}
        inlineCreateParentId={inlineCreateParentId}
        inlineCreateType={inlineCreateType}
        inlineCreateValue={inlineCreateValue}
        localFolder={localFolder}
        setActiveItemId={setActiveItemId}
        toggleFolderExpanded={toggleFolderExpanded}
        setEditingId={setEditingId}
        setEditValue={setEditValue}
        handleSaveRename={handleSaveRename}
        handleStartRename={handleStartRename}
        handleDownloadItem={handleDownloadItem}
        setItemToDeleteId={setItemToDeleteId}
        deleteItem={deleteItem}
        setInlineCreateType={setInlineCreateType}
        setInlineCreateParentId={setInlineCreateParentId}
        setInlineCreateValue={setInlineCreateValue}
        handleInlineCreateSubmit={handleInlineCreateSubmit}
        handleInlineCreateCancel={handleInlineCreateCancel}
        renderTree={renderTree}
        moveItem={moveItem}
        processUploadedFiles={processUploadedFiles}
        setIsDraggingInternal={setIsDraggingInternal}
      />
    ));
  };

  const breadcrumbs = getBreadcrumbs();
  const compactedItems = getCompactedItems(currentNavFolderId);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col h-full bg-[#070b14] border-r border-[#121927] shrink-0 w-60 select-none relative font-sans text-slate-300"
    >
      {/* Drop overlay */}
      {isDraggingOver && (
        isDraggingInternal ? (
          <div className="absolute inset-0 z-50 bg-[#060a13]/95 backdrop-blur-xs border-2 border-dashed border-emerald-500 m-2 rounded-xl flex flex-col items-center justify-center gap-2 pointer-events-none transition-all duration-200">
            <Move size={28} className="text-emerald-400 animate-bounce" />
            <span className="text-xs font-semibold text-emerald-200">Move here</span>
            <span className="text-[10px] text-slate-500 font-mono">
              Target Folder: {currentNavFolderId ? items.find((i) => i.id === currentNavFolderId)?.name : "Root"}
            </span>
          </div>
        ) : (
          <div className="absolute inset-0 z-50 bg-[#060a13]/95 backdrop-blur-xs border-2 border-dashed border-sky-500 m-2 rounded-xl flex flex-col items-center justify-center gap-2 pointer-events-none transition-all duration-200">
            <FileUp size={28} className="text-sky-400 animate-bounce" />
            <span className="text-xs font-semibold text-sky-200">Drop files to upload</span>
            <span className="text-[10px] text-slate-500 font-mono">
              Upload Target: {currentNavFolderId ? items.find((i) => i.id === currentNavFolderId)?.name : "Root"}
            </span>
          </div>
        )
      )}

      {/* Header section with connection & title */}
      <div className="p-3 border-b border-[#111927] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-bold text-white text-[11px] uppercase tracking-wider">
              {localFolder ? "Synced Local" : "Workspace"}
            </span>
            <span className="text-[9px] text-slate-500 font-mono truncate max-w-[120px]">
              {localFolder ? localFolder.folderName : "Virtual Sandbox"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {localFolder ? (
              <button
                onClick={disconnectLocalFolder}
                className="p-1 rounded bg-rose-950/20 text-rose-400 hover:bg-rose-950/40 transition-all cursor-pointer"
                title="Disconnect local folder"
              >
                <Unlink size={12} />
              </button>
            ) : (
              <button
                onClick={connectLocalFolder}
                className="p-1 rounded bg-[#101726] text-sky-400 hover:bg-[#151f32] transition-all cursor-pointer border border-[#1b263b]"
                title="Connect local folder"
              >
                <Link size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Quick actions row */}
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              setInlineCreateType("file");
              setInlineCreateParentId(explorerMode === "compact" ? currentNavFolderId : null);
              setInlineCreateValue("");
            }}
            className="flex-1 flex items-center justify-center gap-1 h-7 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-[11px] transition-colors cursor-pointer"
          >
            <Plus size={12} />
            <span>New File</span>
          </button>
          <button
            onClick={() => {
              setInlineCreateType("folder");
              setInlineCreateParentId(explorerMode === "compact" ? currentNavFolderId : null);
              setInlineCreateValue("");
            }}
            className="flex-1 flex items-center justify-center gap-1 h-7 rounded bg-[#101726] border border-[#1b263b] hover:bg-[#151f32] text-slate-300 font-semibold text-[11px] transition-colors cursor-pointer"
          >
            <FolderPlus size={12} />
            <span>Folder</span>
          </button>
        </div>

        {/* Layout toggle mode */}
        <div className="flex items-center justify-between bg-[#0b101f] rounded p-0.5 border border-[#141d30]">
          <button
            onClick={() => handleToggleMode("tree")}
            className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] font-medium transition-all ${
              explorerMode === "tree"
                ? "bg-sky-500/10 text-sky-400 font-semibold"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <FolderTree size={11} />
            <span>Classic Tree</span>
          </button>
          <button
            onClick={() => handleToggleMode("compact")}
            className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] font-medium transition-all ${
              explorerMode === "compact"
                ? "bg-sky-500/10 text-sky-400 font-semibold"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Compass size={11} />
            <span>Interactive Nav</span>
          </button>
        </div>
      </div>

      {/* Breadcrumb path navigation for compact mode */}
      {explorerMode === "compact" && (
        <div className="flex items-center gap-0.5 px-3 py-1 bg-[#090e1a] border-b border-[#111826] overflow-x-auto whitespace-nowrap scrollbar-none text-[10px] text-slate-400">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id || "root"}>
              {idx > 0 && <span className="text-slate-600">/</span>}
              <button
                onClick={() => {
                  setCurrentNavFolderId(crumb.id);
                  setInlineCreateParentId(undefined);
                }}
                className={`hover:text-white transition-colors py-0.5 px-1 rounded hover:bg-slate-800/20 ${
                  crumb.id === currentNavFolderId ? "text-sky-400 font-semibold bg-sky-500/5" : ""
                }`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* List content files area */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1 scrollbar-thin">
        {/* Inline file/folder creation block */}
        {inlineCreateParentId === (explorerMode === "compact" ? currentNavFolderId : null) && (
          <div className="flex items-center gap-1.5 py-1 px-2 mb-1 rounded bg-[#0b101f] border border-sky-500/40">
            {inlineCreateType === "folder" ? (
              <Folder size={12} className="text-amber-400 shrink-0" />
            ) : (
              <File size={12} className="text-sky-400 shrink-0" />
            )}
            <input
              type="text"
              value={inlineCreateValue}
              onChange={(e) => setInlineCreateValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInlineCreateSubmit();
                if (e.key === "Escape") handleInlineCreateCancel();
              }}
              placeholder={`New ${inlineCreateType}...`}
              className="flex-1 px-1 py-0.5 rounded border border-sky-500 bg-[#050912] text-white text-[11px] outline-none"
              autoFocus
            />
          </div>
        )}

        {explorerMode === "tree" ? (
          <div className="space-y-0.5">{renderTree(null)}</div>
        ) : (
          <div className="space-y-0.5 animate-fadeIn">
            {/* Go Up directory element */}
            {currentNavFolderId !== null && (
              <button
                onClick={() => {
                  const curr = items.find((i) => i.id === currentNavFolderId);
                  setCurrentNavFolderId(curr ? curr.parentId : null);
                  setInlineCreateParentId(undefined);
                }}
                className="flex items-center gap-1 px-2 py-0.5 mb-1.5 text-[10px] font-medium text-slate-500 hover:text-slate-300 transition-colors bg-transparent border-none outline-none cursor-pointer"
                title="Go Up to parent folder"
              >
                <ChevronLeft size={11} className="text-slate-600 shrink-0" />
                <span>.. (Parent folder)</span>
              </button>
            )}

            {compactedItems.length === 0 && (
              <div className="text-center py-6 px-4 text-slate-500 text-[10px]">
                <FolderOpen size={16} className="mx-auto text-slate-600 mb-1.5" />
                <span>This folder is empty.</span>
                <span className="block mt-1">Drag & drop files here.</span>
              </div>
            )}

            {/* List of Compacted Items */}
            {compactedItems.map((item) => {
              const isEditing = item.lastItem.id === editingId;
              const isActive = item.lastItem.id === activeItemId;
              const isFolder = item.type === "folder";

              return (
                <div key={item.lastItem.id} className="flex flex-col">
                  <div
                    draggable={!isEditing}
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.setData("application/workspace-item-id", item.lastItem.id);
                      e.dataTransfer.effectAllowed = "move";
                      setIsDraggingInternal(true);
                    }}
                    onDragEnd={() => {
                      setIsDraggingInternal(false);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveDragOverId(item.lastItem.id);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setActiveDragOverId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveDragOverId(null);

                      // 1. files from local system
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        const targetFolderId = isFolder ? item.lastItem.id : currentNavFolderId;
                        processUploadedFiles(Array.from(e.dataTransfer.files), targetFolderId);
                        return;
                      }

                      // 2. internal items move
                      const draggedId = e.dataTransfer.getData("application/workspace-item-id");
                      if (draggedId && draggedId !== item.lastItem.id) {
                        const targetParentId = isFolder ? item.lastItem.id : currentNavFolderId;
                        moveItem(draggedId, targetParentId);
                      }
                    }}
                    onClick={() => {
                      if (isEditing) return;
                      if (isFolder) {
                        setCurrentNavFolderId(item.lastItem.id);
                        setInlineCreateParentId(undefined);
                      } else {
                        setActiveItemId(item.lastItem.id);
                      }
                    }}
                    className={`group flex items-center justify-between py-1 px-2 rounded cursor-pointer transition-all border ${
                      isActive
                        ? "bg-[#0f1b2e] border-sky-500/30 text-sky-400"
                        : "border-transparent text-slate-300 hover:bg-[#0b101f]/50 hover:text-white"
                    } ${activeDragOverId === item.lastItem.id ? "bg-[#101726]/80 border-dashed border-[#10b981] scale-[0.98]" : ""}`}
                    title={isFolder ? `Open folder: ${item.displayName}` : `Open file: ${item.displayName}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {isFolder ? (
                        <Folder size={13} className="text-amber-400 shrink-0" />
                      ) : (
                        getFileIcon(item.lastItem.name)
                      )}

                      {isEditing ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveRename(item.lastItem.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRename(item.lastItem.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="flex-1 px-1 py-0.5 rounded border border-sky-500 bg-[#050912] text-white text-[11px] outline-none"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="flex items-center flex-wrap gap-y-0.5 min-w-0 flex-1 text-[11px] font-mono leading-relaxed select-none">
                          {item.chain.map((chainItem, index) => {
                            const isLast = index === item.chain.length - 1;
                            
                            // For long paths, let's compress the middle parts if there are more than 4 items
                            if (item.chain.length > 4 && index > 1 && index < item.chain.length - 1) {
                              // Only render one '...' placeholder for the middle parts
                              if (index === 2) {
                                return (
                                  <React.Fragment key="ellipsis">
                                    <span className="text-slate-600 px-0.5 select-none">/</span>
                                    <span 
                                      className="text-slate-500/60 font-sans px-1"
                                      title={item.chain.slice(2, -1).map(c => c.name).join("/")}
                                    >
                                      ...
                                    </span>
                                  </React.Fragment>
                                );
                              }
                              return null; // Skip rendering other middle items
                            }

                            return (
                              <React.Fragment key={chainItem.id}>
                                {index > 0 && <span className="text-slate-600 px-0.5 select-none">/</span>}
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (chainItem.type === "folder") {
                                      setCurrentNavFolderId(chainItem.id);
                                      setInlineCreateParentId(undefined);
                                    } else {
                                      setActiveItemId(chainItem.id);
                                    }
                                  }}
                                  className={`rounded px-1 py-0.2 hover:bg-sky-500/15 cursor-pointer hover:text-white transition-colors min-w-0 ${
                                    isLast
                                      ? isFolder
                                        ? "text-amber-300 font-sans font-semibold border-b border-amber-500/20"
                                        : "text-slate-100 font-mono font-bold"
                                      : "text-slate-400 font-sans opacity-75"
                                  }`}
                                  title={
                                    chainItem.type === "folder"
                                      ? `Navigate to folder: ${chainItem.name}`
                                      : `Open file: ${chainItem.name}`
                                  }
                                >
                                  {chainItem.name}
                                </span>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Compact layout actions menu */}
                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0 relative ml-1">
                        {itemToDeleteId === item.lastItem.id ? (
                          <div className="flex items-center gap-1 p-0.5 border border-red-900 bg-red-950/20 rounded">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteItem(item.lastItem.id);
                                setItemToDeleteId(null);
                              }}
                              className="px-1 py-0.5 bg-red-500 text-white font-bold text-[8px] uppercase cursor-pointer hover:bg-red-400 rounded-xs"
                            >
                              Yes
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setItemToDeleteId(null);
                              }}
                              className="px-1 py-0.5 border border-[#1b263b] text-slate-400 font-bold text-[8px] uppercase cursor-pointer hover:text-white rounded-xs"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Actions menu vertical ellipsis */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === item.lastItem.id ? null : item.lastItem.id);
                              }}
                              className="p-0.5 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-all duration-150"
                              title="Actions"
                            >
                              <MoreVertical size={13} />
                            </button>

                            {activeMenuId === item.lastItem.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-[999]"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(null);
                                  }}
                                />
                                <div
                                  className="absolute right-0 top-6 z-[1000] min-w-[120px] bg-[#0c1322] border border-[#1e293b] rounded-lg shadow-2xl p-1 flex flex-col text-[11px] text-slate-300 font-medium"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {isFolder && (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          handleCreateInFolder(item.lastItem.id, "file", e);
                                          setActiveMenuId(null);
                                        }}
                                        className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800/80 rounded-md text-left hover:text-[#10b981] transition-colors"
                                      >
                                        <Plus size={11} className="text-[#10b981]" />
                                        <span>New File</span>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          handleCreateInFolder(item.lastItem.id, "folder", e);
                                          setActiveMenuId(null);
                                        }}
                                        className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800/80 rounded-md text-left hover:text-amber-400 transition-colors"
                                      >
                                        <FolderPlus size={11} className="text-amber-400" />
                                        <span>New Folder</span>
                                      </button>
                                      <div className="border-t border-slate-800/60 my-1" />
                                    </>
                                  )}
                                  {!isFolder && (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          handleDownloadItem(item.lastItem, e);
                                          setActiveMenuId(null);
                                        }}
                                        className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800/80 rounded-md text-left hover:text-[#10b981] transition-colors"
                                      >
                                        <Download size={11} className="text-[#10b981]" />
                                        <span>Download</span>
                                      </button>
                                      <div className="border-t border-slate-800/60 my-1" />
                                    </>
                                  )}
                                  {!localFolder && (
                                    <button
                                      onClick={(e) => {
                                        handleStartRename(item.lastItem, e);
                                        setActiveMenuId(null);
                                      }}
                                      className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800/80 rounded-md text-left hover:text-white transition-colors"
                                    >
                                      <Edit3 size={11} className="text-slate-400" />
                                      <span>Rename</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setItemToDeleteId(item.lastItem.id);
                                      setActiveMenuId(null);
                                    }}
                                    className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-red-950/40 text-red-500 hover:text-red-400 rounded-md text-left transition-colors"
                                  >
                                    <Trash2 size={11} className="text-red-400" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer dropzone trigger info */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="p-2 border-t border-[#111927] text-[9px] font-mono text-slate-500 flex items-center justify-center gap-1 cursor-pointer hover:bg-slate-800/10 hover:text-slate-400 transition-colors shrink-0 select-none"
      >
        <FileUp size={11} />
        <span>Click or Drag & Drop Files</span>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          className="hidden"
          onChange={(e) =>
            e.target.files &&
            processUploadedFiles(Array.from(e.target.files), explorerMode === "compact" ? currentNavFolderId : null)
          }
        />
      </div>
    </div>
  );
}

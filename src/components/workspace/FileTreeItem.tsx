/**
 * @file FileTreeItem.tsx
 * @description Recursive tree node renderer for the workspace file explorer tree.
 */

import React, { useState } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  FileImage,
  FileVideo,
  FileCode,
  File,
  Plus,
  FolderPlus,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  Download,
  MoreVertical,
} from "lucide-react";
import { WorkspaceItem } from "../../types/workspace";

interface FileTreeItemProps {
  item: WorkspaceItem;
  items: WorkspaceItem[];
  activeItemId: string;
  editingId: string | null;
  editValue: string;
  itemToDeleteId: string | null;
  inlineCreateParentId: string | null | undefined;
  inlineCreateType: "file" | "folder";
  inlineCreateValue: string;
  localFolder: any;
  setActiveItemId: (id: string) => void;
  toggleFolderExpanded: (id: string) => void;
  setEditingId: (id: string | null) => void;
  setEditValue: (val: string) => void;
  handleSaveRename: (id: string) => void;
  handleStartRename: (item: WorkspaceItem, e: React.MouseEvent) => void;
  handleDownloadItem: (item: WorkspaceItem, e: React.MouseEvent) => void;
  setItemToDeleteId: (id: string | null) => void;
  deleteItem: (id: string) => void;
  setInlineCreateType: (type: "file" | "folder") => void;
  setInlineCreateParentId: (id: string | null) => void;
  setInlineCreateValue: (val: string) => void;
  handleInlineCreateSubmit: () => void;
  handleInlineCreateCancel: () => void;
  renderTree: (parentId: string | null) => React.ReactNode;
  moveItem: (itemId: string, targetParentId: string | null) => void;
  processUploadedFiles: (files: File[], parentId: string | null) => void;
  setIsDraggingInternal?: (val: boolean) => void;
}

export function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "md" || ext === "markdown")
    return <FileText size={14} className="text-indigo-400" />;
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext))
    return <FileImage size={14} className="text-emerald-400" />;
  if (["mp4", "webm", "mov"].includes(ext))
    return <FileVideo size={14} className="text-amber-400" />;
  if (["js", "jsx", "ts", "tsx", "json", "css", "html"].includes(ext))
    return <FileCode size={14} className="text-blue-400" />;
  return <File size={14} className="text-slate-400" />;
}

export default function FileTreeItem({
  item,
  activeItemId,
  editingId,
  editValue,
  itemToDeleteId,
  inlineCreateParentId,
  inlineCreateType,
  inlineCreateValue,
  localFolder,
  setActiveItemId,
  toggleFolderExpanded,
  setEditingId,
  setEditValue,
  handleSaveRename,
  handleStartRename,
  handleDownloadItem,
  setItemToDeleteId,
  deleteItem,
  setInlineCreateType,
  setInlineCreateParentId,
  setInlineCreateValue,
  handleInlineCreateSubmit,
  handleInlineCreateCancel,
  renderTree,
  moveItem,
  processUploadedFiles,
  setIsDraggingInternal,
}: FileTreeItemProps) {
  const isFolder = item.type === "folder";
  const isActive = item.id === activeItemId;
  const isEditing = item.id === editingId;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData("application/workspace-item-id", item.id);
    e.dataTransfer.effectAllowed = "move";
    if (setIsDraggingInternal) {
      setIsDraggingInternal(true);
    }
  };

  const handleDragEnd = () => {
    if (setIsDraggingInternal) {
      setIsDraggingInternal(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // 1. Files from computer
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const targetFolderId = isFolder ? item.id : item.parentId;
      processUploadedFiles(Array.from(e.dataTransfer.files), targetFolderId);
      return;
    }

    // 2. Internal item move
    const draggedId = e.dataTransfer.getData("application/workspace-item-id");
    if (draggedId && draggedId !== item.id) {
      const targetParentId = isFolder ? item.id : item.parentId;
      moveItem(draggedId, targetParentId);
    }
  };

  return (
    <div key={item.id} className="flex flex-col">
      <div
        id={`explorer-item-${item.id}`}
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (isEditing) return;
          if (isFolder) toggleFolderExpanded(item.id);
          else setActiveItemId(item.id);
        }}
        className={`group flex items-center justify-between py-1 px-2 rounded-md cursor-pointer transition-all text-xs relative ${
          isActive
            ? "bg-[#101726] border border-[#10b981]/30 text-[#10b981]"
            : "text-slate-300 hover:bg-[#0b101f]/40 hover:text-white"
        } ${isDragOver ? "bg-[#101726]/80 border border-dashed border-[#10b981] scale-[0.98]" : "border border-transparent"}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isFolder ? (
            item.isExpanded ? (
              <ChevronDown size={13} className="text-slate-500 shrink-0" />
            ) : (
              <ChevronRight size={13} className="text-slate-500 shrink-0" />
            )
          ) : (
            <div className="w-3 shrink-0" />
          )}
          {isFolder ? (
            item.isExpanded ? (
              <FolderOpen size={14} className="text-amber-400 shrink-0" />
            ) : (
              <Folder size={14} className="text-amber-400 shrink-0" />
            )
          ) : (
            getFileIcon(item.name)
          )}
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleSaveRename(item.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveRename(item.id);
                if (e.key === "Escape") setEditingId(null);
              }}
              className="flex-1 px-1 py-0.5 rounded border border-[#10b981] bg-[#050912] text-white text-xs outline-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate pr-2">{item.name}</span>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center gap-1 shrink-0 relative">
            {/* Delete confirmation (if active) shows inline to be safe and clear */}
            {itemToDeleteId === item.id ? (
              <div className="flex items-center gap-1 p-0.5 border border-red-900 bg-red-950/20 rounded">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteItem(item.id);
                    setItemToDeleteId(null);
                  }}
                  className="px-1 py-0.5 bg-red-500 text-white font-bold text-[9px] uppercase cursor-pointer hover:bg-red-400 rounded"
                >
                  Yes
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemToDeleteId(null);
                  }}
                  className="px-1 py-0.5 border border-[#1b263b] text-slate-400 font-bold text-[9px] uppercase cursor-pointer hover:text-white rounded"
                >
                  No
                </button>
              </div>
            ) : (
              <>
                {/* Sleek three-dots menu button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  className="p-0.5 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-all duration-150"
                  title="Actions"
                >
                  <MoreVertical size={13} />
                </button>

                {isMenuOpen && (
                  <>
                    {/* Fixed backdrop screen overlay to easily click out and dismiss the menu */}
                    <div
                      className="fixed inset-0 z-[999]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                      }}
                    />
                    {/* Floating contextual action menu */}
                    <div
                      className="absolute right-0 top-6 z-[1000] min-w-[120px] bg-[#0c1322] border border-[#1e293b] rounded-lg shadow-2xl p-1 flex flex-col text-[11px] text-slate-300 font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isFolder && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInlineCreateType("file");
                              setInlineCreateParentId(item.id);
                              setInlineCreateValue("");
                              setIsMenuOpen(false);
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800/80 rounded-md text-left hover:text-[#10b981] transition-colors"
                          >
                            <Plus size={11} className="text-[#10b981]" />
                            <span>New File</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInlineCreateType("folder");
                              setInlineCreateParentId(item.id);
                              setInlineCreateValue("");
                              setIsMenuOpen(false);
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
                              handleDownloadItem(item, e);
                              setIsMenuOpen(false);
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
                            handleStartRename(item, e);
                            setIsMenuOpen(false);
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
                          setItemToDeleteId(item.id);
                          setIsMenuOpen(false);
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

      {isFolder && item.isExpanded && (
        <div className="flex flex-col border-l border-[#151f32]/60 ml-[14px] pl-2 space-y-0.5 mt-0.5">
          {inlineCreateParentId === item.id && (
            <div className="flex items-center gap-1.5 py-1 px-2 rounded-lg bg-[#0b101f] border border-[#10b981]/30">
              {inlineCreateType === "folder" ? (
                <Folder size={12} className="text-amber-400 shrink-0" />
              ) : (
                <File size={12} className="text-indigo-400 shrink-0" />
              )}
              <input
                type="text"
                value={inlineCreateValue}
                onChange={(e) => setInlineCreateValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInlineCreateSubmit();
                  if (e.key === "Escape") handleInlineCreateCancel();
                }}
                placeholder={`New ${inlineCreateType} name...`}
                className="flex-1 px-1 py-0.5 rounded border border-[#10b981] bg-[#050912] text-white text-xs outline-none"
                autoFocus
              />
            </div>
          )}
          {renderTree(item.id)}
        </div>
      )}
    </div>
  );
}

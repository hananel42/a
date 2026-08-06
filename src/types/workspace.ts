/**
 * @file workspace.ts
 * @description
 * Defines type interfaces, schemas, and metadata structures for virtual and physical filesystems.
 * Supports both standard virtual localStorage structures and full local FileSystem Access API directory handles.
 * All properties are documented in English.
 *
 * Exported Interfaces:
 * - `WorkspaceItem`: A unified schema for files and directories.
 * - `LocalFolderConnection`: Direct binding details for physical folder mounts.
 */

export interface WorkspaceItem {
  id: string;
  name: string;
  type: "file" | "folder";
  parentId: string | null; // null represents the root level
  content?: string; // For files: text characters or base64 data-URLs for media
  createdAt: string;
  updatedAt: string;
  isExpanded?: boolean; // UI state for folder collapsing
  handle?: any; // Native FileSystemAccess handle if linked
}

export interface LocalFolderConnection {
  folderName: string;
  directoryHandle: any; // FileSystemDirectoryHandle (if File System Access API is active)
}

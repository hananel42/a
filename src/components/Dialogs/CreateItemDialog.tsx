/**
 * @file CreateItemDialog.tsx
 * @description Modal dialog for creating a new workspace file or folder.
 */

import React, { useState, useEffect } from "react";
import { FilePlus2, FolderPlus } from "lucide-react";
import BaseDialog from "./BaseDialog";

interface CreateItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: "file" | "folder";
  onSubmit: (name: string) => void;
}

/**
 * Modal prompt allowing the user to specify a name for a new file or folder.
 */
export function CreateItemDialog({
  isOpen,
  onClose,
  type,
  onSubmit,
}: CreateItemDialogProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(type === "file" ? "untitled.md" : "New Folder");
    }
  }, [isOpen, type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      onClose();
    }
  };

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      title={type === "file" ? "Create New File" : "Create New Folder"}
      icon={
        type === "file" ? (
          <FilePlus2 size={18} className="text-indigo-500" />
        ) : (
          <FolderPlus size={18} className="text-amber-500" />
        )
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Name
          </label>
          <input
            type="text"
            required
            placeholder={type === "file" ? "e.g. document.md" : "e.g. Assets"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
            autoFocus
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow shadow-indigo-600/10 hover:shadow-md cursor-pointer"
          >
            Create
          </button>
        </div>
      </form>
    </BaseDialog>
  );
}

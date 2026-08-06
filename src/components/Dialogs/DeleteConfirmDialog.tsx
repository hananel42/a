/**
 * @file DeleteConfirmDialog.tsx
 * @description Modal dialog asking for confirmation before deleting a workspace item or session.
 */

import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import BaseDialog from "./BaseDialog";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  onConfirm: () => void;
}

/**
 * Renders a warning modal asking the user to confirm item deletion.
 */
export function DeleteConfirmDialog({
  isOpen,
  onClose,
  itemName,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Delete"
      icon={<AlertTriangle size={18} className="text-rose-500 animate-pulse" />}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-slate-800 dark:text-white">
            "{itemName}"
          </span>
          ?
          <br />
          This action cannot be undone and will permanently remove this item and
          all its contents.
        </p>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors shadow shadow-rose-600/10 hover:shadow-md cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Trash2 size={15} />
            <span>Delete Item</span>
          </button>
        </div>
      </div>
    </BaseDialog>
  );
}

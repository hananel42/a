import React, { useState, useEffect } from "react";
import { Link2 } from "lucide-react";
import BaseDialog from "./BaseDialog";

interface LinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (label: string, url: string) => void;
  defaultLabel?: string;
}

export function LinkDialog({
  isOpen,
  onClose,
  onSubmit,
  defaultLabel = "",
}: LinkDialogProps) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState(defaultLabel);

  // Sync label with default value when selection changes
  React.useEffect(() => {
    if (isOpen) {
      setLabel(defaultLabel);
      setUrl("");
    }
  }, [isOpen, defaultLabel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    onSubmit(label || "link text", url);
    onClose();
  };

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Insert Hyperlink"
      icon={<Link2 size={18} />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Display Text (Label)
          </label>
          <input
            type="text"
            placeholder="e.g. Visit Documentation"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Target URL Address
          </label>
          <input
            type="text"
            required
            placeholder="e.g. https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
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
            Add Link
          </button>
        </div>
      </form>
    </BaseDialog>
  );
}

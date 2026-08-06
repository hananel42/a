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
          <label className="block text-xs font-semibold text-[var(--theme-text-muted,#94a3b8)] uppercase tracking-wider mb-1.5">
            Display Text (Label)
          </label>
          <input
            type="text"
            placeholder="e.g. Visit Documentation"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-[var(--theme-border,#141d30)] bg-[var(--theme-bg,#070c18)] text-[var(--theme-text,#f1f5f9)] text-sm focus:outline-none focus:border-[var(--theme-accent,#6366f1)] transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--theme-text-muted,#94a3b8)] uppercase tracking-wider mb-1.5">
            Target URL Address
          </label>
          <input
            type="text"
            required
            placeholder="e.g. https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-[var(--theme-border,#141d30)] bg-[var(--theme-bg,#070c18)] text-[var(--theme-text,#f1f5f9)] text-sm focus:outline-none focus:border-[var(--theme-accent,#6366f1)] transition-colors"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[var(--theme-border,#141d30)] hover:bg-[var(--theme-card-hover,#1a2438)] text-[var(--theme-text-muted,#94a3b8)] hover:text-[var(--theme-text,#f1f5f9)] text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-xl bg-[var(--theme-accent,#6366f1)] hover:opacity-90 text-white text-sm font-semibold transition-colors shadow-xs cursor-pointer"
          >
            Add Link
          </button>
        </div>
      </form>
    </BaseDialog>
  );
}

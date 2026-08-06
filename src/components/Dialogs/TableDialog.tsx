import React, { useState } from "react";
import { Table } from "lucide-react";
import BaseDialog from "./BaseDialog";

interface TableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rows: number, cols: number, headers: boolean) => void;
}

export function TableDialog({ isOpen, onClose, onSubmit }: TableDialogProps) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [headers, setHeaders] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(rows, cols, headers);
    onClose();
  };

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Custom Table"
      icon={<Table size={18} />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--theme-text-muted,#94a3b8)] uppercase tracking-wider mb-1.5">
              Rows
            </label>
            <input
              type="number"
              min={1}
              max={25}
              value={rows}
              onChange={(e) =>
                setRows(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-full px-3.5 py-2 rounded-xl border border-[var(--theme-border,#141d30)] bg-[var(--theme-bg,#070c18)] text-[var(--theme-text,#f1f5f9)] text-sm focus:outline-none focus:border-[var(--theme-accent,#6366f1)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--theme-text-muted,#94a3b8)] uppercase tracking-wider mb-1.5">
              Columns
            </label>
            <input
              type="number"
              min={1}
              max={15}
              value={cols}
              onChange={(e) =>
                setCols(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-full px-3.5 py-2 rounded-xl border border-[var(--theme-border,#141d30)] bg-[var(--theme-bg,#070c18)] text-[var(--theme-text,#f1f5f9)] text-sm focus:outline-none focus:border-[var(--theme-accent,#6366f1)] transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--theme-bg,#070c18)] border border-[var(--theme-border,#141d30)]">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[var(--theme-text,#f1f5f9)]">
              Include Header Row
            </span>
            <span className="text-xs text-[var(--theme-text-muted,#94a3b8)] mt-0.5">
              Format top row as table columns header
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={headers}
            onClick={() => setHeaders(!headers)}
            className={`w-11 h-6 rounded-full transition-colors relative inline-flex items-center shrink-0 p-0.5 cursor-pointer outline-none focus:ring-2 focus:ring-[var(--theme-accent,#6366f1)]/20 ${
              headers ? "bg-[var(--theme-accent,#6366f1)]" : "bg-[var(--theme-border,#141d30)]"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm pointer-events-none ${
                headers ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
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
            Generate Table
          </button>
        </div>
      </form>
    </BaseDialog>
  );
}

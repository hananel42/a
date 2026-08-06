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
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
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
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
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
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/50">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Include Header Row
            </span>
            <span className="text-xs text-slate-400 mt-0.5">
              Format top row as table columns header
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={headers}
            onClick={() => setHeaders(!headers)}
            className={`w-11 h-6 rounded-full transition-colors relative inline-flex items-center shrink-0 p-0.5 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 ${
              headers ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
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
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow shadow-indigo-600/10 hover:shadow-md cursor-pointer"
          >
            Insert Table
          </button>
        </div>
      </form>
    </BaseDialog>
  );
}

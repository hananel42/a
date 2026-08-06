/**
 * @file PythonInputDialog.tsx
 * @description In-app modal dialog for receiving interactive Python input() responses.
 * Bypasses sandboxed iframe restrictions where native window.prompt() is blocked,
 * providing a cross-browser, responsive, accessible input dialog.
 */

import React, { useState, useEffect, useRef } from "react";
import { HelpCircle, CornerDownLeft, X } from "lucide-react";

interface PythonInputDialogProps {
  isOpen: boolean;
  promptText: string;
  onSubmit: (val: string) => void;
  onCancel: () => void;
}

export default function PythonInputDialog({
  isOpen,
  promptText,
  onSubmit,
  onCancel,
}: PythonInputDialogProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue("");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, promptText]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-5 text-slate-100 font-sans space-y-4 relative">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          title="Cancel Input"
        >
          <X size={16} />
        </button>

        {/* Header Title */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg flex-shrink-0">
            <HelpCircle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Python Input Requested
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              The Python script is waiting for user input (
              <code className="font-mono text-amber-300">input()</code>):
            </p>
          </div>
        </div>

        {/* Prompt Message Box */}
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg font-mono text-xs text-emerald-300 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
          {promptText || "Please provide input:"}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type answer here..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 rounded-lg text-slate-100 placeholder-slate-500 font-mono text-xs focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel Execution
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition-colors"
            >
              <span>Submit</span>
              <CornerDownLeft size={13} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

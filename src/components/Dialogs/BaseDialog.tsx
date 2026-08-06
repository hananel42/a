import React from "react";
import { X } from "lucide-react";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export default function BaseDialog({
  isOpen,
  onClose,
  title,
  icon,
  children,
}: DialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-[var(--theme-card,#101726)] border border-[var(--theme-border,#141d30)] text-[var(--theme-text,#f1f5f9)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--theme-border,#141d30)] bg-[var(--theme-bg,#070c18)]">
          <div className="flex items-center gap-2.5 text-[var(--theme-text,#f1f5f9)] font-semibold text-base">
            <span className="text-[var(--theme-accent,#6366f1)]">{icon}</span>
            <span>{title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--theme-card-hover,#1a2438)] text-[var(--theme-text-muted,#94a3b8)] hover:text-[var(--theme-text,#f1f5f9)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

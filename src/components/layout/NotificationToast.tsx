/**
 * @file NotificationToast.tsx
 * @description Global popup toast message component for notifications, errors, and confirmations.
 */

import React from "react";
import { X } from "lucide-react";

interface NotificationToastProps {
  toast: { message: string; type: "success" | "error" } | null;
  onClose: () => void;
}

/**
 * Bottom-right floating toast notification banner.
 */
export default function NotificationToast({
  toast,
  onClose,
}: NotificationToastProps) {
  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[600] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-xs sm:text-sm font-semibold animate-slide-up select-none">
      <span
        className={`w-2 h-2 rounded-full ${toast.type === "success" ? "bg-emerald-500" : "bg-rose-500"}`}
      />
      <span>{toast.message}</span>
      <button
        onClick={onClose}
        className="ml-2 hover:text-slate-400 cursor-pointer"
      >
        <X size={14} />
      </button>
    </div>
  );
}

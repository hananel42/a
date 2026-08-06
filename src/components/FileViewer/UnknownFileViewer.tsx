/**
 * @file UnknownFileViewer.tsx
 * @description Renders a stylized fallback view for unrecognized file extensions.
 * Provides intuitive alternative actions like opening as raw text or downloading the file.
 *
 * API Props:
 * - fileName: Name of the file with the unknown extension.
 * - fileSize: File size string representation.
 * - onOpenAsText: Callback fired when the user chooses to force-view the file as plain text.
 * - onDownload: Callback fired to download the file directly.
 */

import React from "react";
import { HelpCircle, FileWarning, Eye, Download, FileText } from "lucide-react";

interface UnknownFileViewerProps {
  fileName: string;
  fileSize?: string;
  onOpenAsText: () => void;
  onDownload: () => void;
}

export default function UnknownFileViewer({
  fileName,
  fileSize,
  onOpenAsText,
  onDownload,
}: UnknownFileViewerProps) {
  const extension = fileName.split(".").pop()?.toUpperCase() || "UNKNOWN";

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-8 select-none">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800/80 p-8 text-center shadow-xl animate-fade-in">
        {/* Warning Icon Badge */}
        <div className="inline-flex p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 mb-6">
          <FileWarning size={36} />
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-2">
          Unrecognized File Format
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 mb-6 max-w-sm mx-auto leading-relaxed">
          We don't recognize the{" "}
          <strong className="text-amber-500 font-semibold">{extension}</strong>{" "}
          extension of{" "}
          <strong className="text-slate-600 dark:text-slate-300 font-mono break-all">
            {fileName}
          </strong>
          .{fileSize && ` (Size: ${fileSize})`}
        </p>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={onOpenAsText}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-indigo-600/10 transition-all cursor-pointer"
          >
            <Eye size={15} />
            <span>Open as Plain Text anyway</span>
          </button>

          <button
            onClick={onDownload}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Download File</span>
          </button>
        </div>
      </div>
    </div>
  );
}

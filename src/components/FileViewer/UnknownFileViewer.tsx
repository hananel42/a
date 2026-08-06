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
    <div className="flex-1 flex flex-col items-center justify-center bg-[var(--theme-bg,#070c18)] text-[var(--theme-text,#f1f5f9)] p-8 select-none">
      <div className="max-w-md w-full bg-[var(--theme-card,#101726)] rounded-3xl border border-[var(--theme-border,#141d30)] p-8 text-center shadow-xl animate-fade-in">
        {/* Warning Icon Badge */}
        <div className="inline-flex p-4 rounded-2xl bg-[var(--theme-accent-subtle,rgba(16,185,129,0.15))] text-[var(--theme-accent,#10b981)] border border-[var(--theme-border,#141d30)] mb-6">
          <FileWarning size={36} />
        </div>

        <h3 className="text-base sm:text-lg font-bold text-[var(--theme-text,#f1f5f9)] mb-2">
          Unrecognized File Format
        </h3>
        <p className="text-xs sm:text-sm text-[var(--theme-text-muted,#94a3b8)] mb-6 max-w-sm mx-auto leading-relaxed">
          We don't recognize the{" "}
          <strong className="text-[var(--theme-accent,#10b981)] font-semibold">{extension}</strong>{" "}
          extension of{" "}
          <strong className="text-[var(--theme-text,#f1f5f9)] font-mono break-all">
            {fileName}
          </strong>
          .{fileSize && ` (Size: ${fileSize})`}
        </p>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={onOpenAsText}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--theme-accent,#10b981)] hover:opacity-90 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Eye size={15} />
            <span>Open as Plain Text anyway</span>
          </button>

          <button
            onClick={onDownload}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--theme-border,#141d30)] hover:bg-[var(--theme-card-hover,#162032)] text-[var(--theme-text,#f1f5f9)] text-xs sm:text-sm font-semibold transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Download File</span>
          </button>
        </div>
      </div>
    </div>
  );
}

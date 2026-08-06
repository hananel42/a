/**
 * @file MarkdownFileEditor.tsx
 * @description Fully-featured dual-pane Markdown editor and live preview component.
 * It integrates scroll-synchronization, formatting shortcuts, search-and-replace,
 * and standard/aesthetic Markdown styling views.
 *
 * API Props:
 * - content: The current raw Markdown string content of the active file.
 * - onChange: Callback fired when the editor content is edited.
 * - onFormat: Callback function to apply formatting markup.
 * - mode: The layout viewing mode: 'split' | 'edit' | 'preview'.
 * - previewStyle: Theme style used for rendering ('standard' | 'serif' | 'newspaper' | 'nord' | 'tech').
 * - activeFileId: Unique identifier of the current active file.
 * - editorRef: React RefObject for the underlying textarea.
 * - viewerScrollContainerRef: React RefObject for the preview scrolling container.
 */

import React from "react";
import MarkdownEditor from "../workspace/MarkdownEditor";
import MarkdownViewer from "../workspace/MarkdownViewer";
import { useSplitPane } from "../../hooks/useSplitPane";
import { useScrollSync } from "../../hooks/useScrollSync";
import { getThemeBgClass, getThemeClasses } from "../../utils/theme";
import { FormatType } from "../../utils/formatter";

interface MarkdownFileEditorProps {
  content: string;
  onChange: (val: string) => void;
  onFormat: (type: FormatType, data?: any) => void;
  mode: "split" | "edit" | "preview";
  previewStyle: "standard" | "serif" | "newspaper" | "nord" | "tech";
  activeFileId: string;
  editorRef: React.RefObject<HTMLTextAreaElement | null>;
  viewerScrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

export default function MarkdownFileEditor({
  content,
  onChange,
  onFormat,
  mode,
  previewStyle,
  activeFileId,
  editorRef,
  viewerScrollContainerRef,
}: MarkdownFileEditorProps) {
  // Resizing split ratio state
  const { splitRatio, containerRef, startResizing } = useSplitPane(50);

  // Synchronize scrolling between the editor textarea and preview panel
  useScrollSync(editorRef, viewerScrollContainerRef, mode, activeFileId);

  return (
    <div
      ref={containerRef}
      className="flex-1 flex min-h-0 relative bg-[var(--theme-bg,#070c18)] text-[var(--theme-text,#f1f5f9)] select-none"
    >
      {/* A. TEXT EDITOR CONTAINER (Left half) */}
      {(mode === "edit" || mode === "split") && (
        <div
          style={{
            width: mode === "split" ? `${splitRatio}%` : "100%",
            flex: mode === "split" ? "none" : "1",
          }}
          className="h-full flex flex-col min-w-0 bg-[var(--theme-card,#101726)] text-[var(--theme-text,#f1f5f9)] select-text"
        >
          <MarkdownEditor
            content={content}
            onChange={onChange}
            onFormat={onFormat}
            editorRef={editorRef}
            viewerScrollContainerRef={viewerScrollContainerRef}
            mode={mode}
          />
        </div>
      )}

      {/* Resizer bar */}
      {mode === "split" && (
        <div
          onMouseDown={startResizing}
          className="w-1.5 cursor-col-resize hover:bg-[var(--theme-accent,#10b981)] bg-[var(--theme-border,#141d30)] transition-colors group flex items-center justify-center z-10"
        >
          <div className="w-0.5 h-12 rounded-full bg-[var(--theme-text-muted,#94a3b8)] group-hover:bg-[var(--theme-accent,#10b981)] transition-colors" />
        </div>
      )}

      {/* B. RENDERING VIEWER CONTAINER (Right half) */}
      {(mode === "preview" || mode === "split") && (
        <div
          ref={viewerScrollContainerRef}
          style={{
            width: mode === "split" ? `${100 - splitRatio}%` : "100%",
            flex: mode === "split" ? "none" : "1",
          }}
          className={`viewer-container h-full overflow-y-auto px-6 sm:px-12 py-6 sm:py-10 scrollbar-thin select-text flex flex-col transition-colors duration-300 ${getThemeBgClass(
            previewStyle,
          )}`}
        >
          {/* Clean seamless, frame-free wrapper */}
          <div
            className={`max-w-3xl w-full mx-auto transition-all duration-300 rendered-markdown-card ${getThemeClasses(
              previewStyle,
            )}`}
          >
            <MarkdownViewer
              content={content}
              previewStyle={previewStyle}
              isStreaming={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}

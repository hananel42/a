/**
 * @file MarkdownViewer.tsx
 * @description Wrapper component rendering Markdown content via the custom markdown-engine renderer.
 */

import React from "react";
import MarkdownRenderer from "../../markdown-engine";
import { PreviewStyle } from "../../markdown-engine/types";

interface MarkdownViewerProps {
  content: string;
  previewStyle?: PreviewStyle;
  isStreaming?: boolean;
  className?: string;
}

/**
 * High performance Markdown preview component.
 */
export default function MarkdownViewer({
  content,
  previewStyle = "standard",
  isStreaming = false,
  className = "",
}: MarkdownViewerProps) {
  return (
    <div className={className}>
      <MarkdownRenderer
        content={content}
        previewStyle={previewStyle}
        isStreaming={isStreaming}
      />
    </div>
  );
}

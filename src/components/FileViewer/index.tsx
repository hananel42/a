/**
 * @file index.tsx
 * @description Central routing component for the file viewer/editor workspace.
 * Resolves the appropriate editor or preview component based on the active file name's extension.
 *
 * API Props:
 * - fileName: The full name of the file (including extension).
 * - content: The text content of the file.
 * - onChange: Callback fired when file contents are modified.
 * - onFormat: Callback function to format Markdown selections.
 * - mode: Layout split viewing mode: 'split' | 'edit' | 'preview'.
 * - previewStyle: Visual theme choice for rendered markdown templates.
 * - activeFileId: Identifier of the current active file.
 * - editorRef: React mutable reference to the underlying textarea.
 * - viewerScrollContainerRef: React scroll viewport reference for dual pane synchronization.
 * - onDownload: Trigger to download the active file.
 */

import React, { useState, useEffect } from "react";
import MarkdownFileEditor from "./MarkdownFileEditor";
import CodeFileEditor from "./CodeFileEditor";
import MediaFileViewer from "./MediaFileViewer";
import UnknownFileViewer from "./UnknownFileViewer";
import { FormatType } from "../../utils/formatter";
import { WorkspaceItem } from "../../types/workspace";

interface FileViewerRouterProps {
  fileName: string;
  content: string;
  onChange: (val: string) => void;
  onFormat: (type: FormatType, data?: any) => void;
  mode: "split" | "edit" | "preview";
  previewStyle: "standard" | "serif" | "newspaper" | "nord" | "tech";
  activeFileId: string;
  editorRef: React.RefObject<HTMLTextAreaElement | null>;
  viewerScrollContainerRef: React.RefObject<HTMLDivElement | null>;
  onDownload: () => void;
  workspaceItems?: WorkspaceItem[];
  updateFileContent?: (id: string, content: string) => Promise<void> | void;
  createFile?: (
    name: string,
    parentId: string | null,
    content?: string,
  ) => Promise<string> | string;
  createFolder?: (
    name: string,
    parentId: string | null,
  ) => Promise<string> | string;
}

export default function FileViewerRouter({
  fileName,
  content,
  onChange,
  onFormat,
  mode,
  previewStyle,
  activeFileId,
  editorRef,
  viewerScrollContainerRef,
  onDownload,
  workspaceItems,
  updateFileContent,
  createFile,
  createFolder,
}: FileViewerRouterProps) {
  const [forceAsText, setForceAsText] = useState(false);

  // Reset override whenever the file swaps
  useEffect(() => {
    setForceAsText(false);
  }, [activeFileId]);

  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  // 1. Markdown Files
  if ((ext === "md" || ext === "markdown") && !forceAsText) {
    return (
      <MarkdownFileEditor
        content={content}
        onChange={onChange}
        onFormat={onFormat}
        mode={mode}
        previewStyle={previewStyle}
        activeFileId={activeFileId}
        editorRef={editorRef}
        viewerScrollContainerRef={viewerScrollContainerRef}
      />
    );
  }

  // 2. Image and GIF Files
  const imageExtensions = [
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp",
    "svg",
    "ico",
    "bmp",
  ];
  if (imageExtensions.includes(ext)) {
    const isGif = ext === "gif";
    return (
      <MediaFileViewer
        fileName={fileName}
        fileUrl={content} // Content contains the base64 or blob URL of the image
        fileType={isGif ? "gif" : "image"}
        fileSize={
          content.startsWith("data:")
            ? `${Math.ceil((content.length * 3) / 4 / 1024)} KB`
            : undefined
        }
      />
    );
  }

  // 3. Video Files
  const videoExtensions = ["mp4", "webm", "ogg", "mov"];
  if (videoExtensions.includes(ext)) {
    return (
      <MediaFileViewer
        fileName={fileName}
        fileUrl={content} // Content contains the blob URL or video source path
        fileType="video"
      />
    );
  }

  // 4. Known Code and Text Formats (or if forced as plain text)
  const codeExtensions = [
    "txt",
    "js",
    "jsx",
    "ts",
    "tsx",
    "json",
    "css",
    "html",
    "xml",
    "py",
    "sh",
    "bash",
    "yaml",
    "yml",
    "ini",
    "cfg",
    "go",
    "rs",
    "c",
    "cpp",
    "java",
  ];
  if (codeExtensions.includes(ext) || forceAsText) {
    return (
      <CodeFileEditor
        key={fileName}
        fileName={fileName}
        content={content}
        onChange={onChange}
        language={ext === "py" ? "python" : ext}
        workspaceItems={workspaceItems}
        updateFileContent={updateFileContent}
        createFile={createFile}
        createFolder={createFolder}
        activeFileId={activeFileId}
      />
    );
  }

  // 5. Unknown Format Fallback Page
  return (
    <UnknownFileViewer
      fileName={fileName}
      fileSize={
        content ? `${Math.ceil(new Blob([content]).size / 1024)} KB` : undefined
      }
      onOpenAsText={() => setForceAsText(true)}
      onDownload={onDownload}
    />
  );
}
export {
  MarkdownFileEditor,
  CodeFileEditor,
  MediaFileViewer,
  UnknownFileViewer,
};

/**
 * @file WorkspaceTab.tsx
 * @description Main document workspace view module. Coordinates the FileExplorer tree,
 * Header, Toolbar, FileViewerRouter, and Dialog overlays.
 */

import React, { useRef, useState } from "react";
import { EditorMode } from "../../types";
import { applyFormatting, FormatType } from "../../utils/formatter";
import { useExport } from "../../hooks/useExport";
import FileViewerRouter from "../FileViewer";
import FileExplorer from "./FileExplorer";
import PrintStyle from "../layout/PrintStyle";
import Header from "../layout/Header";
import Toolbar from "../layout/Toolbar";
import HelpDrawer from "../layout/HelpDrawer";
import { LinkDialog, MediaDialog, TableDialog } from "../Dialogs/index";

interface WorkspaceTabProps {
  workspace: any;
  showNotification: (msg: string, type?: "success" | "error") => void;
}

/**
 * Main Markdown and document workspace component.
 */
export default function WorkspaceTab({
  workspace,
  showNotification,
}: WorkspaceTabProps) {
  const {
    items,
    activeItemId,
    setActiveItemId,
    activeFile,
    createFile,
    createFolder,
    renameItem,
    deleteItem,
    updateFileContent,
    localFolder,
    toggleFolderExpanded,
    connectLocalFolder,
    disconnectLocalFolder,
    processUploadedFiles,
    moveItem,
  } = workspace;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const [dialogs, setDialogs] = useState({
    link: false,
    table: false,
    media: false,
  });
  const [mode, setMode] = useState<EditorMode>("split");
  const [previewStyle, setPreviewStyle] = useState<
    "standard" | "serif" | "newspaper" | "nord" | "tech"
  >("standard");

  const editorTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const viewerScrollContainerRef = useRef<HTMLDivElement | null>(null);

  const mappedActiveFile = {
    id: activeFile.id,
    title: activeFile.name,
    content: activeFile.content || "",
    createdAt: activeFile.createdAt,
    updatedAt: activeFile.updatedAt,
  };
  useExport(mappedActiveFile, previewStyle, showNotification);

  const handleContentChange = (newContent: string) => {
    updateFileContent(activeFile.id, newContent);
  };

  const handleFormat = (type: FormatType, additionalData?: any) => {
    const textarea = editorTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;

    const result = applyFormatting(
      type,
      currentVal,
      start,
      end,
      additionalData,
    );
    handleContentChange(result.text);

    setTimeout(() => {
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
    }, 50);
  };

  const handleLinkSubmit = (label: string, url: string) => {
    handleFormat("link", { label, url });
  };

  const handleTableSubmit = (rows: number, cols: number, headers: boolean) => {
    handleFormat("table", { rows, cols, headers });
  };

  const handleMediaSubmit = (config: {
    type: "image" | "video" | "youtube";
    url: string;
    altOrId: string;
    poster?: string;
  }) => {
    if (config.type === "image") {
      handleFormat("image", { url: config.url, alt: config.altOrId });
    } else if (config.type === "video") {
      handleFormat("video", { url: config.url, poster: config.poster });
    } else if (config.type === "youtube") {
      handleFormat("youtube", { videoId: config.url });
    }
  };

  const openModalDialog = (type: "link" | "table" | "media") => {
    setDialogs((prev) => ({ ...prev, [type]: true }));
  };

  const downloadActiveFile = () => {
    const contentVal = activeFile.content || "";
    const isBase64 = contentVal.startsWith("data:");

    let blob: Blob;
    if (isBase64) {
      const parts = contentVal.split(",");
      const byteString = atob(parts[1]);
      const mimeString = parts[0].split(":")[1].split(";")[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      blob = new Blob([ab], { type: mimeString });
    } else {
      blob = new Blob([contentVal], { type: "text/plain;charset=utf-8" });
    }

    const element = document.createElement("a");
    element.href = URL.createObjectURL(blob);
    element.download = activeFile.name;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showNotification(
      `"${activeFile.name}" downloaded successfully!`,
      "success",
    );
  };

  const isMarkdown =
    activeFile.name.endsWith(".md") || activeFile.name.endsWith(".markdown");
  const wordCount =
    isMarkdown && activeFile.content
      ? activeFile.content.trim().split(/\s+/).filter(Boolean).length
      : 0;
  const charCount = activeFile.content ? activeFile.content.length : 0;

  return (
    <div id="workspace-tab" className="flex flex-1 h-full overflow-hidden">
      <PrintStyle previewStyle={previewStyle} />

      {/* A. FILE EXPLORER SIDEBAR */}
      {isSidebarOpen && (
        <FileExplorer
          items={items}
          activeItemId={activeItemId}
          localFolder={localFolder}
          setActiveItemId={setActiveItemId}
          toggleFolderExpanded={toggleFolderExpanded}
          createFile={createFile}
          createFolder={createFolder}
          renameItem={renameItem}
          deleteItem={deleteItem}
          connectLocalFolder={connectLocalFolder}
          disconnectLocalFolder={disconnectLocalFolder}
          processUploadedFiles={processUploadedFiles}
          moveItem={moveItem}
        />
      )}

      {/* B. MAIN EDITOR VIEW */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          activeFile={{
            id: activeFile.id,
            title: activeFile.name,
            content: activeFile.content || "",
            createdAt: activeFile.createdAt,
            updatedAt: activeFile.updatedAt,
          }}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {isMarkdown && (
          <Toolbar
            onFormat={handleFormat}
            onOpenDialog={openModalDialog}
            mode={mode}
            setMode={setMode}
            wordCount={wordCount}
            charCount={charCount}
            previewStyle={previewStyle}
            setPreviewStyle={setPreviewStyle}
          />
        )}

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative bg-white dark:bg-slate-950">
          <FileViewerRouter
            fileName={activeFile.name}
            content={activeFile.content || ""}
            onChange={handleContentChange}
            onFormat={handleFormat}
            mode={mode}
            previewStyle={previewStyle}
            activeFileId={activeFile.id}
            editorRef={editorTextareaRef}
            viewerScrollContainerRef={viewerScrollContainerRef}
            onDownload={downloadActiveFile}
            workspaceItems={items}
            updateFileContent={updateFileContent}
            createFile={createFile}
            createFolder={createFolder}
          />
        </div>
      </div>

      {/* C. DIALOG OVERLAYS */}
      <HelpDrawer isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <LinkDialog
        isOpen={dialogs.link}
        onClose={() => setDialogs((prev) => ({ ...prev, link: false }))}
        onSubmit={handleLinkSubmit}
        defaultLabel={
          editorTextareaRef.current
            ? editorTextareaRef.current.value.substring(
                editorTextareaRef.current.selectionStart,
                editorTextareaRef.current.selectionEnd,
              )
            : ""
        }
      />

      <TableDialog
        isOpen={dialogs.table}
        onClose={() => setDialogs((prev) => ({ ...prev, table: false }))}
        onSubmit={handleTableSubmit}
      />

      <MediaDialog
        isOpen={dialogs.media}
        onClose={() => setDialogs((prev) => ({ ...prev, media: false }))}
        onSubmit={handleMediaSubmit}
      />
    </div>
  );
}

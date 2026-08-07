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
import FileTabs from "./FileTabs";
import { Compass } from "lucide-react";

import { AppTheme } from "../../utils/theme";

interface WorkspaceTabProps {
  workspace: any;
  showNotification: (msg: string, type?: "success" | "error") => void;
  appTheme?: AppTheme;
}

/**
 * Main Markdown and document workspace component.
 */
export default function WorkspaceTab({
  workspace,
  showNotification,
  appTheme,
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
    collapseAllFolders,
    openFileIds,
    closeTab,
  } = workspace;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const [dialogs, setDialogs] = useState({
    link: false,
    table: false,
    media: false,
  });
  const [mode, setMode] = useState<EditorMode>("split");
  const [internalPreviewStyle, setPreviewStyle] = useState<
    "standard" | "serif" | "newspaper" | "nord" | "tech"
  >("standard");

  const previewStyle = appTheme ? appTheme.markdownStyle : internalPreviewStyle;

  const editorTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const viewerScrollContainerRef = useRef<HTMLDivElement | null>(null);

  const mappedActiveFile = activeFile
    ? {
        id: activeFile.id,
        title: activeFile.name,
        content: activeFile.content || "",
        createdAt: activeFile.createdAt,
        updatedAt: activeFile.updatedAt,
      }
    : {
        id: "",
        title: "",
        content: "",
        createdAt: "",
        updatedAt: "",
      };
  const { downloadPDFFile } = useExport(
    mappedActiveFile,
    previewStyle,
    showNotification,
  );

  const handleContentChange = (newContent: string) => {
    if (activeFile) {
      updateFileContent(activeFile.id, newContent);
    }
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
    if (!activeFile) return;
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
    activeFile
      ? activeFile.name.endsWith(".md") || activeFile.name.endsWith(".markdown")
      : false;
  const wordCount =
    isMarkdown && activeFile && activeFile.content
      ? activeFile.content.trim().split(/\s+/).filter(Boolean).length
      : 0;
  const charCount = activeFile && activeFile.content ? activeFile.content.length : 0;

  const hasTabs = Boolean(openFileIds && openFileIds.length > 0 && activeFile);

  return (
    <div id="workspace-tab" className="flex flex-1 h-full overflow-hidden bg-[var(--theme-bg,#09090b)] text-[var(--theme-text,#f4f4f5)]">
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
          collapseAllFolders={collapseAllFolders}
        />
      )}

      {/* B. MAIN EDITOR VIEW */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          activeFile={{
            id: hasTabs && activeFile ? activeFile.id : "",
            title: hasTabs && activeFile ? activeFile.name : "(No open files)",
            content: hasTabs && activeFile ? (activeFile.content || "") : "",
            createdAt: hasTabs && activeFile ? activeFile.createdAt : "",
            updatedAt: hasTabs && activeFile ? activeFile.updatedAt : "",
          }}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          onExportPDF={downloadPDFFile}
        />

        {/* File Tabs Bar */}
        <FileTabs
          openFileIds={openFileIds || []}
          activeFileId={hasTabs && activeFile ? activeFile.id : ""}
          items={items}
          onSelect={setActiveItemId}
          onClose={closeTab}
        />

        {!hasTabs || !activeFile ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--theme-bg,#09090b)] text-[var(--theme-text-muted,#a1a1aa)] select-none">
            <div className="w-16 h-16 rounded-full bg-[var(--theme-card,#18181b)] flex items-center justify-center text-[var(--theme-accent,#6366f1)] mb-4 animate-pulse border border-[var(--theme-border,#27272a)]">
              <Compass size={28} />
            </div>
            <h3 className="text-sm font-semibold text-[var(--theme-text,#f4f4f5)] mb-1.5">No open files</h3>
            <p className="text-[11px] text-[var(--theme-text-muted,#a1a1aa)] max-w-xs mb-4 leading-relaxed">
              Select any file from the sidebar explorer, or create a new document to begin writing.
            </p>
            <button
              onClick={() => {
                createFile("untitled.md", null, "# Untitled\n\nStart writing here...", true);
              }}
              className="px-3.5 py-1.5 bg-[var(--theme-accent,#6366f1)] hover:opacity-90 text-white font-medium text-[11px] rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Create New Document
            </button>
          </div>
        ) : (
          <>
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
                onExportPDF={downloadPDFFile}
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
          </>
        )}
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

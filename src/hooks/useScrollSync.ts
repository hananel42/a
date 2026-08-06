import React, { useEffect } from "react";

export function useScrollSync(
  editorRef: React.RefObject<HTMLTextAreaElement | null>,
  viewerRef: React.RefObject<HTMLDivElement | null>,
  mode: string,
  activeFileId: string,
) {
  useEffect(() => {
    const editor = editorRef.current;
    const viewer = viewerRef.current;
    if (!editor || !viewer || mode !== "split") return;

    let activeScroller: "editor" | "viewer" | null = null;

    const handleEditorMouseEnter = () => {
      activeScroller = "editor";
    };
    const handleViewerMouseEnter = () => {
      activeScroller = "viewer";
    };

    const handleEditorScroll = () => {
      if (activeScroller !== "editor") return;
      const pct =
        editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
      viewer.scrollTop = pct * (viewer.scrollHeight - viewer.clientHeight);
    };

    const handleViewerScroll = () => {
      if (activeScroller !== "viewer") return;
      const pct =
        viewer.scrollTop / (viewer.scrollHeight - viewer.clientHeight);
      editor.scrollTop = pct * (editor.scrollHeight - editor.clientHeight);
    };

    editor.addEventListener("mouseenter", handleEditorMouseEnter);
    editor.addEventListener("touchstart", handleEditorMouseEnter, {
      passive: true,
    });
    editor.addEventListener("scroll", handleEditorScroll);

    viewer.addEventListener("mouseenter", handleViewerMouseEnter);
    viewer.addEventListener("touchstart", handleViewerMouseEnter, {
      passive: true,
    });
    viewer.addEventListener("scroll", handleViewerScroll);

    return () => {
      editor.removeEventListener("mouseenter", handleEditorMouseEnter);
      editor.removeEventListener("touchstart", handleEditorMouseEnter);
      editor.removeEventListener("scroll", handleEditorScroll);

      viewer.removeEventListener("mouseenter", handleViewerMouseEnter);
      viewer.removeEventListener("touchstart", handleViewerMouseEnter);
      viewer.removeEventListener("scroll", handleViewerScroll);
    };
  }, [mode, activeFileId, editorRef, viewerRef]);
}

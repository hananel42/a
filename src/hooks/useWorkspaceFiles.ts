import React, { useState, useEffect } from "react";
import { MarkdownFile } from "../types";
import { templates } from "../data/templates";

export function useWorkspaceFiles(
  showNotification: (msg: string, type: "success" | "error") => void,
) {
  const [files, setFiles] = useState<MarkdownFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>("welcome");

  useEffect(() => {
    const savedFiles = localStorage.getItem("markdown_files");
    if (savedFiles) {
      try {
        const parsed = JSON.parse(savedFiles) as MarkdownFile[];
        if (parsed.length > 0) {
          setFiles(parsed);
          setActiveFileId(parsed[0].id);
        } else {
          setFiles(templates);
          localStorage.setItem("markdown_files", JSON.stringify(templates));
        }
      } catch (err) {
        setFiles(templates);
      }
    } else {
      setFiles(templates);
      localStorage.setItem("markdown_files", JSON.stringify(templates));
    }
  }, []);

  const saveFilesToStorage = (updatedFiles: MarkdownFile[]) => {
    setFiles(updatedFiles);
    localStorage.setItem("markdown_files", JSON.stringify(updatedFiles));
  };

  const handleContentChange = (newContent: string) => {
    const updated = files.map((file) => {
      if (file.id === activeFileId) {
        return {
          ...file,
          content: newContent,
          updatedAt: new Date().toISOString(),
        };
      }
      return file;
    });
    saveFilesToStorage(updated);
  };

  const createNewFile = () => {
    const newId = `file-${Date.now()}`;
    const newFile: MarkdownFile = {
      id: newId,
      title: "Untitled Document",
      content: "# Untitled Document\n\nWrite your content here...",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newFile, ...files];
    saveFilesToStorage(updated);
    setActiveFileId(newId);
    return newId; // Return new ID to allow auto-triggering rename if needed
  };

  const deleteFile = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (files.length <= 1) {
      alert("Keep at least one document in your workspace!");
      return;
    }
    if (
      window.confirm(
        "Are you sure you want to delete this file? This action is irreversible.",
      )
    ) {
      const updated = files.filter((f) => f.id !== id);
      saveFilesToStorage(updated);
      if (activeFileId === id) {
        setActiveFileId(updated[0].id);
      }
    }
  };

  const updateFileTitle = (id: string, newTitle: string) => {
    const cleanTitle = newTitle.trim() || "Untitled Document";
    const updated = files.map((file) => {
      if (file.id === id) {
        return {
          ...file,
          title: cleanTitle,
          updatedAt: new Date().toISOString(),
        };
      }
      return file;
    });
    saveFilesToStorage(updated);
  };

  const downloadSingleFile = (file: MarkdownFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const blob = new Blob([file.content], {
      type: "text/markdown;charset=utf-8",
    });
    const element = document.createElement("a");
    element.href = URL.createObjectURL(blob);
    element.download = `${
      file.title
        .replace(/[^\\ws-]/gi, "")
        .trim()
        .replace(/\\s+/g, "_") || "document"
    }.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showNotification(`"${file.title}" downloaded successfully!`, "success");
  };

  const processUploadedFiles = (uploadedFiles: File[]) => {
    const validFiles = uploadedFiles.filter(
      (f) => f.name.endsWith(".md") || f.name.endsWith(".txt"),
    );
    if (validFiles.length === 0) {
      showNotification(
        "Please upload valid Markdown (.md) or Text (.txt) files.",
        "error",
      );
      return;
    }

    let processedCount = 0;
    const newFileObjects: MarkdownFile[] = [];

    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const cleanTitle = file.name
          .replace(/\\.(md|txt)$/i, "")
          .replace(/_/g, " ")
          .trim();

        newFileObjects.push({
          id: `file-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
          title: cleanTitle || "Uploaded Document",
          content: text || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        processedCount++;
        if (processedCount === validFiles.length) {
          const updated = [...newFileObjects, ...files];
          saveFilesToStorage(updated);
          setActiveFileId(newFileObjects[0].id);
          showNotification(
            `Successfully uploaded ${validFiles.length} file(s)!`,
            "success",
          );
        }
      };
      reader.readAsText(file);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      processUploadedFiles(selectedFiles);
    }
  };

  const activeFile = files.find((f) => f.id === activeFileId) || templates[0];

  return {
    files,
    activeFileId,
    setActiveFileId,
    activeFile,
    handleContentChange,
    createNewFile,
    deleteFile,
    updateFileTitle,
    downloadSingleFile,
    processUploadedFiles,
    handleFileUpload,
  };
}

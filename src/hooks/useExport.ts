import { MarkdownFile } from "../types";
import { exportToPDF } from "../utils/pdfExport";

export function useExport(
  activeFile: MarkdownFile,
  _previewStyle: "standard" | "serif" | "newspaper" | "nord" | "tech",
  showNotification: (msg: string, type: "success" | "error" | "info") => void,
) {
  const downloadPDFFile = async () => {
    if (!activeFile || !activeFile.title) {
      showNotification("No active document to print/export.", "error");
      return;
    }
    await exportToPDF({
      title: activeFile.title,
      showNotification,
    });
  };

  const downloadMarkdownFile = () => {
    const blob = new Blob([activeFile.content], {
      type: "text/markdown;charset=utf-8",
    });
    const element = document.createElement("a");
    element.href = URL.createObjectURL(blob);
    element.download = `${
      activeFile.title
        .replace(/[^\w\s-]/gi, "")
        .trim()
        .replace(/\s+/g, "_") || "document"
    }.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showNotification("Markdown (.md) file downloaded successfully!", "success");
  };

  const copyMDToClipboard = () => {
    navigator.clipboard
      .writeText(activeFile.content)
      .then(() => {
        showNotification("Markdown content copied to clipboard!", "success");
      })
      .catch(() => {
        showNotification("Failed to copy Markdown content.", "error");
      });
  };

  const invokePrintWindow = () => {
    window.print();
  };

  return {
    downloadPDFFile,
    downloadMarkdownFile,
    copyMDToClipboard,
    invokePrintWindow,
  };
}

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
    copyMDToClipboard,
    invokePrintWindow,
  };
}

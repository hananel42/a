/**
 * @file pdfExport.ts
 * @description Triggers the native browser print / Save-as-PDF dialog.
 * Uses browser's built-in layout engine for 100% accurate rendering of Hebrew/RTL,
 * fonts, code blocks, tables, math formulas, and images without external dependencies.
 */

export interface PDFExportOptions {
  /** Document title */
  title: string;
  /** Notification callback */
  showNotification?: (msg: string, type: "success" | "error" | "info") => void;
}

/**
 * Triggers the browser's native print / PDF export window.
 */
export async function exportToPDF({
  showNotification,
}: PDFExportOptions): Promise<void> {
  if (showNotification) {
    showNotification("Opening native PDF / Print dialog...", "info");
  }

  // Allow a tiny delay for notification to register before opening print modal
  setTimeout(() => {
    window.print();
  }, 100);
}

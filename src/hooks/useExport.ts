import { MarkdownFile } from "../types";
import { getThemeExportCSS } from "../utils/theme";

export function useExport(
  activeFile: MarkdownFile,
  previewStyle: "standard" | "serif" | "newspaper" | "nord" | "tech",
  showNotification: (msg: string, type: "success" | "error") => void,
) {
  const downloadMarkdownFile = () => {
    const blob = new Blob([activeFile.content], {
      type: "text/markdown;charset=utf-8",
    });
    const element = document.createElement("a");
    element.href = URL.createObjectURL(blob);
    element.download = `${
      activeFile.title
        .replace(/[^\\ws-]/gi, "")
        .trim()
        .replace(/\\s+/g, "_") || "document"
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

  const getExportHTMLContent = () => {
    const viewerElement = document.querySelector(".markdown-body");
    const inlineStyleCSS = `
      <style>
        ${getThemeExportCSS(previewStyle)}
      </style>
    `;
    const innerHTML = viewerElement
      ? viewerElement.innerHTML
      : `<div><p>${activeFile.content.replace(/\\n/g, "<br>")}</p></div>`;
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${activeFile.title}</title>
  ${inlineStyleCSS}
</head>
<body>
  ${innerHTML}
</body>
</html>`;
  };

  const downloadHTMLFile = () => {
    const htmlContent = getExportHTMLContent();
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const element = document.createElement("a");
    element.href = URL.createObjectURL(blob);
    element.download = `${
      activeFile.title
        .replace(/[^\\ws-]/gi, "")
        .trim()
        .replace(/\\s+/g, "_") || "document"
    }.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showNotification(
      "HTML exported successfully with chosen theme embedded.",
      "success",
    );
  };

  const copyHTMLToClipboard = () => {
    const htmlContent = getExportHTMLContent();
    navigator.clipboard
      .writeText(htmlContent)
      .then(() => {
        showNotification("Raw HTML copied to clipboard.", "success");
      })
      .catch(() => {
        showNotification("Failed to copy HTML content.", "error");
      });
  };

  const invokePrintWindow = () => {
    window.print();
  };

  return {
    downloadMarkdownFile,
    copyMDToClipboard,
    downloadHTMLFile,
    copyHTMLToClipboard,
    invokePrintWindow,
  };
}

/**
 * @file PrintStyle.tsx
 * @description Injects print CSS media query rules to hide non-printable UI elements during PDF export or printing.
 */

import React from "react";

interface PrintStyleProps {
  previewStyle: "standard" | "serif" | "newspaper" | "nord" | "tech";
}

/**
 * Injects clean @media print styles customized to the selected document theme.
 */
export default function PrintStyle({ previewStyle }: PrintStyleProps) {
  return (
    <style>{`
      @media print {
        @page {
          margin: 15mm;
          size: auto;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          background-color: #ffffff !important;
          color: #18181b !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        /* Hide all UI toolbars, sidebars, headers, editor panels, buttons, and popups */
        header,
        nav,
        aside,
        button,
        .no-print,
        .sidebar-panel,
        .top-header-bar,
        .workspace-toolbar,
        .file-tabs-bar,
        .resizer-divider,
        .cheatsheet-sidebar,
        .editor-container,
        .toast-container,
        .help-drawer {
          display: none !important;
        }
        .viewer-container {
          display: block !important;
          width: 100% !important;
          height: auto !important;
          overflow: visible !important;
          padding: 0 !important;
          margin: 0 !important;
          background: transparent !important;
        }
        .rendered-markdown-card {
          max-width: 100% !important;
          width: 100% !important;
          border: ${previewStyle === "newspaper" ? "4px double #d2c29d" : "none"} !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
          background-color: transparent !important;
          color: inherit !important;
        }
        .rendered-markdown-card h1,
        .rendered-markdown-card h2,
        .rendered-markdown-card h3,
        .rendered-markdown-card h4,
        .rendered-markdown-card h5,
        .rendered-markdown-card h6 {
          color: ${
            previewStyle === "standard"
              ? "#0f172a"
              : previewStyle === "serif"
                ? "#1a1a19"
                : previewStyle === "newspaper"
                  ? "#000000"
                  : previewStyle === "nord"
                    ? "#eceff4"
                    : "#39ff14"
          } !important;
          border-bottom: 1px solid ${
            previewStyle === "standard"
              ? "#e2e8f0"
              : previewStyle === "serif"
                ? "#eae6db"
                : previewStyle === "newspaper"
                  ? "#121212"
                  : previewStyle === "nord"
                    ? "#3b4252"
                    : "#102a18"
          } !important;
        }
        .rendered-markdown-card blockquote {
          border-left-color: ${
            previewStyle === "standard"
              ? "#6366f1"
              : previewStyle === "serif"
                ? "#d97706"
                : previewStyle === "newspaper"
                  ? "#121212"
                  : previewStyle === "nord"
                    ? "#81a1c1"
                    : "#39ff14"
          } !important;
          background-color: ${
            previewStyle === "standard"
              ? "#f8fafc"
              : previewStyle === "serif"
                ? "#f6f3eb"
                : previewStyle === "newspaper"
                  ? "rgba(0,0,0,0.03)"
                  : previewStyle === "nord"
                    ? "#3b4252"
                    : "rgba(57, 255, 20, 0.05)"
          } !important;
        }
        .rendered-markdown-card pre {
          background-color: ${
            previewStyle === "standard"
              ? "#0f172a"
              : previewStyle === "serif"
                ? "#1c1b19"
                : previewStyle === "newspaper"
                  ? "#1a1a1a"
                  : previewStyle === "nord"
                    ? "#242933"
                    : "#001405"
          } !important;
          color: ${
            previewStyle === "standard"
              ? "#f8fafc"
              : previewStyle === "serif"
                ? "#e3e1db"
                : previewStyle === "newspaper"
                  ? "#ebdcb9"
                  : previewStyle === "nord"
                    ? "#eceff4"
                    : "#39ff14"
          } !important;
        }
        .rendered-markdown-card th, 
        .rendered-markdown-card td {
          border-color: ${
            previewStyle === "standard"
              ? "#e2e8f0"
              : previewStyle === "serif"
                ? "#eae6db"
                : previewStyle === "newspaper"
                  ? "#d2c29d"
                  : previewStyle === "nord"
                    ? "#3b4252"
                    : "#102a18"
          } !important;
        }
      }
    `}</style>
  );
}

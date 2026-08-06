export const getThemeBgClass = (
  style: "standard" | "serif" | "newspaper" | "nord" | "tech",
) => {
  switch (style) {
    case "standard":
      return "bg-white dark:bg-slate-950";
    case "serif":
      return "bg-[#fcfbf7] dark:bg-[#161614]";
    case "newspaper":
      return "bg-[#f5ebd2] dark:bg-[#1e1a14]";
    case "nord":
      return "bg-[#f0f4f8] dark:bg-[#2e3440]";
    case "tech":
      return "bg-[#060a07]";
  }
};

// Utility helper to fetch precise legibility class list for the preview modes
export const getThemeClasses = (
  style: "standard" | "serif" | "newspaper" | "nord" | "tech",
) => {
  switch (style) {
    case "standard":
      return "bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 prose prose-slate dark:prose-invert font-sans";
    case "serif":
      return "bg-[#fcfbf7] dark:bg-[#161614] text-[#2c2b29] dark:text-[#e3e1db] font-serif prose prose-stone dark:prose-invert prose-headings:text-[#1a1a19] dark:prose-headings:text-[#f3f2ef] prose-headings:font-serif prose-strong:text-[#1a1a19] dark:prose-strong:text-[#f3f2ef] prose-blockquote:text-[#42413e] dark:prose-blockquote:text-[#c4c1ba] prose-blockquote:border-amber-600/60 dark:prose-blockquote:border-amber-500/40 leading-relaxed";
    case "newspaper":
      return "bg-[#f5ebd2] dark:bg-[#1e1a14] text-[#121212] dark:text-[#ebdcb9] font-serif prose prose-stone dark:prose-invert prose-headings:text-black dark:prose-headings:text-[#faedd0] prose-headings:font-bold prose-headings:font-serif prose-strong:text-black dark:prose-strong:text-[#faedd0] prose-blockquote:text-[#333] dark:prose-blockquote:text-[#ebdcb9] prose-blockquote:border-black dark:prose-blockquote:border-[#ebdcb9] leading-loose";
    case "nord":
      return "bg-[#f0f4f8] dark:bg-[#2e3440] text-[#2e3440] dark:text-[#eceff4] font-sans prose prose-slate dark:prose-invert prose-headings:text-[#2e3440] dark:prose-headings:text-[#eceff4] prose-strong:text-[#2e3440] dark:prose-strong:text-[#eceff4] prose-blockquote:text-[#4c566a] dark:prose-blockquote:text-[#d8dee9] prose-blockquote:border-[#81a1c1] prose-code:text-[#5e81ac] dark:prose-code:text-[#88c0d0] prose-code:bg-slate-200/50 dark:prose-code:bg-[#3b4252]/40 prose-a:text-[#5e81ac] dark:prose-a:text-[#81a1c1]";
    case "tech":
      return "bg-[#060a07] text-[#39ff14] font-mono text-xs leading-relaxed prose prose-emerald prose-p:text-[#39ff14] prose-headings:text-[#39ff14] prose-headings:font-mono prose-strong:text-[#39ff14] prose-blockquote:text-[#82ff6e] prose-blockquote:border-[#39ff14] prose-ul:text-[#39ff14] prose-ol:text-[#39ff14] prose-li:text-[#39ff14] prose-table:text-[#39ff14] prose-th:text-[#39ff14] prose-td:text-[#39ff14] prose-code:text-[#39ff14] prose-code:bg-emerald-950/60 prose-a:text-[#39ff14] hover:prose-a:text-white";
  }
};

// Generates embedded styling for compiled HTML exports to look exactly as it does in-app
export const getThemeExportCSS = (
  style: "standard" | "serif" | "newspaper" | "nord" | "tech",
) => {
  const commonStyles = `
    body {
      line-height: 1.6;
      padding: 3rem 2rem;
      max-width: 800px;
      margin: 0 auto;
      box-sizing: border-box;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }
    pre {
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
    }
    code {
      font-family: monospace;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 0.75rem;
      text-align: left;
    }
    th {
      background-color: rgba(0,0,0,0.02);
      font-weight: 600;
    }
    blockquote {
      border-left: 4px solid;
      padding: 0.5rem 1rem;
      margin: 1.5rem 0;
      font-style: italic;
    }
    ul, ol {
      padding-left: 1.5rem;
    }
  `;

  switch (style) {
    case "standard":
      return `
        ${commonStyles}
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #1e293b;
          background-color: #ffffff;
        }
        h1, h2, h3, h4, h5, h6 {
          color: #0f172a;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 700;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.3em;
        }
        pre {
          background-color: #0f172a;
          color: #f8fafc;
        }
        code {
          background-color: #f1f5f9;
          color: #db2777;
        }
        blockquote {
          border-color: #6366f1;
          background-color: #f8fafc;
          color: #475569;
        }
      `;
    case "serif":
      return `
        ${commonStyles}
        body {
          font-family: Georgia, Cambria, "Times New Roman", Times, serif;
          color: #2c2b29;
          background-color: #fcfbf7;
          line-height: 1.8;
        }
        h1, h2, h3, h4, h5, h6 {
          color: #1a1a19;
          margin-top: 1.6em;
          margin-bottom: 0.6em;
          font-weight: 600;
          border-bottom: 1px solid #eae6db;
          padding-bottom: 0.4em;
        }
        pre {
          background-color: #1c1b19;
          color: #e3e1db;
        }
        code {
          background-color: #f4f1ea;
          color: #b45309;
        }
        blockquote {
          border-color: #d97706;
          background-color: #f6f3eb;
          color: #42413e;
        }
        th, td {
          border-color: #eae6db;
        }
      `;
    case "newspaper":
      return `
        ${commonStyles}
        body {
          font-family: Georgia, "Times New Roman", Times, serif;
          color: #121212;
          background-color: #f5ebd2;
          border: 4px double #d2c29d;
          padding: 3rem;
          line-height: 1.8;
        }
        h1, h2, h3, h4, h5, h6 {
          color: #000000;
          margin-top: 1.8em;
          margin-bottom: 0.6em;
          font-weight: 800;
          text-transform: uppercase;
          border-bottom: 2px solid #121212;
          padding-bottom: 0.2em;
        }
        pre {
          background-color: #1a1a1a;
          color: #ebdcb9;
          border: 1px solid #d2c29d;
        }
        code {
          background-color: #ebdcb9;
          color: #000000;
        }
        blockquote {
          border-color: #121212;
          background-color: rgba(0,0,0,0.03);
          color: #121212;
        }
        th, td {
          border-color: #d2c29d;
        }
      `;
    case "nord":
      return `
        ${commonStyles}
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #eceff4;
          background-color: #2e3440;
        }
        h1, h2, h3, h4, h5, h6 {
          color: #eceff4;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 700;
          border-bottom: 1px solid #3b4252;
          padding-bottom: 0.3em;
        }
        pre {
          background-color: #242933;
          color: #eceff4;
        }
        code {
          background-color: #3b4252;
          color: #88c0d0;
        }
        blockquote {
          border-color: #81a1c1;
          background-color: #3b4252;
          color: #d8dee9;
        }
        th, td {
          border-color: #3b4252;
        }
      `;
    case "tech":
      return `
        ${commonStyles}
        body {
          font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
          color: #39ff14;
          background-color: #060a07;
          font-size: 14px;
        }
        h1, h2, h3, h4, h5, h6 {
          color: #39ff14;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 700;
          border-bottom: 1px solid #102a18;
          padding-bottom: 0.3em;
        }
        pre {
          background-color: #001405;
          color: #39ff14;
          border: 1px solid #102a18;
        }
        code {
          background-color: #001405;
          color: #39ff14;
          border: 1px solid #102a18;
        }
        blockquote {
          border-color: #39ff14;
          background-color: rgba(57, 255, 20, 0.05);
          color: #82ff6e;
        }
        th, td {
          border-color: #102a18;
        }
      `;
  }
};

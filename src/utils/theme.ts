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
    blockquote {
      border-left: 4px solid;
      padding-left: 1rem;
      margin-left: 0;
      margin-right: 0;
      font-style: italic;
    }
    pre {
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      padding: 0.2em 0.4em;
      border-radius: 4px;
      font-size: 85%;
    }
    pre code {
      padding: 0;
      font-size: 100%;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
    }
    th, td {
      border: 1px solid;
      padding: 0.75rem;
      text-align: left;
    }
  `;

  const themeSpecificStyles = {
    standard: `
      body {
        background-color: #ffffff;
        color: #1e293b;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
      }
      h1, h2, h3, h4, h5, h6 { color: #0f172a; }
      blockquote { border-color: #6366f1; background-color: #eef2ff; color: #334155; padding-top: 0.5rem; padding-bottom: 0.5rem; border-radius: 0 0.5rem 0.5rem 0; }
      pre { background-color: #f1f5f9; }
      code { background-color: #f1f5f9; color: #db2777; }
      a { color: #4f46e5; }
      th, td { border-color: #e2e8f0; }
      th { background-color: #f8fafc; }
    `,
    serif: `
      body {
        background-color: #fcfbf7;
        color: #2c2b29;
        font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
      }
      h1, h2, h3, h4, h5, h6 { color: #1a1a19; font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; }
      blockquote { border-color: #d97706; background-color: #fbf9f3; color: #42413e; padding-top: 0.5rem; padding-bottom: 0.5rem; border-radius: 0 0.5rem 0.5rem 0; }
      pre { background-color: #f4f1ea; }
      code { background-color: #f4f1ea; color: #b45309; }
      a { color: #92400e; }
      th, td { border-color: #eae6db; }
      th { background-color: #f6f3eb; }
    `,
    newspaper: `
      body {
        background-color: #f5ebd2;
        color: #121212;
        font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
        line-height: 1.8;
      }
      h1, h2, h3, h4, h5, h6 { color: #000000; font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; font-weight: bold; }
      blockquote { border-color: #000000; background-color: rgba(0,0,0,0.05); color: #333333; padding-top: 0.5rem; padding-bottom: 0.5rem; }
      pre { background-color: #ebdcb9; }
      code { background-color: #ebdcb9; color: #000000; }
      a { color: #000000; text-decoration: underline; font-weight: bold; }
      th, td { border-color: #d2c29d; }
      th { background-color: #ebdcb9; }
    `,
    nord: `
      body {
        background-color: #f0f4f8;
        color: #2e3440;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
      }
      h1, h2, h3, h4, h5, h6 { color: #2e3440; }
      blockquote { border-color: #81a1c1; background-color: rgba(229, 233, 240, 0.4); color: #4c566a; padding-top: 0.5rem; padding-bottom: 0.5rem; }
      pre { background-color: #e5e9f0; }
      code { background-color: rgba(229, 233, 240, 0.6); color: #5e81ac; }
      a { color: #5e81ac; }
      th, td { border-color: #d8dee9; }
      th { background-color: #e5e9f0; }
    `,
    tech: `
      body {
        background-color: #060a07;
        color: #39ff14;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 14px;
      }
      h1, h2, h3, h4, h5, h6 { color: #39ff14; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
      blockquote { border-color: #39ff14; background-color: rgba(5, 150, 105, 0.2); color: #82ff6e; padding-top: 0.5rem; padding-bottom: 0.5rem; }
      pre { background-color: #001405; border: 1px solid #102a18; }
      code { background-color: #001405; color: #39ff14; }
      a { color: #39ff14; text-decoration: underline; }
      th, td { border-color: #102a18; }
      th { background-color: #001405; }
    `,
  };

  return commonStyles + themeSpecificStyles[style];
};

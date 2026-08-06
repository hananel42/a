import { PreviewStyle } from "./types";

export const getThemeBackgroundClasses = (style: PreviewStyle): string => {
  switch (style) {
    case "standard":
      return "bg-[var(--theme-card,#101726)] text-[var(--theme-text,#f1f5f9)]";
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

export const getThemeTextClasses = (style: PreviewStyle): string => {
  switch (style) {
    case "standard":
      return "text-[var(--theme-text,#f1f5f9)] font-sans text-[14.5px] leading-relaxed";
    case "serif":
      return "text-[#2c2b29] dark:text-[#e3e1db] font-sans text-[14.5px] leading-relaxed";
    case "newspaper":
      return "text-[#121212] dark:text-[#ebdcb9] font-sans text-[14.5px] leading-loose";
    case "nord":
      return "text-[#2e3440] dark:text-[#eceff4] font-sans text-[14.5px] leading-relaxed";
    case "tech":
      return "text-[#39ff14] font-mono text-xs leading-relaxed";
  }
};

export const getThemeContainerClasses = (style: PreviewStyle): string => {
  return `${getThemeBackgroundClasses(style)} ${getThemeTextClasses(style)}`;
};

export const getHeadingClasses = (
  style: PreviewStyle,
  level: 1 | 2 | 3 | 4,
): string => {
  const fontClass = style === "tech" ? "font-mono" : "font-sans";

  const sizeClasses = {
    1: "text-2xl sm:text-3xl font-bold tracking-tight mt-10 mb-4",
    2: "text-xl sm:text-2xl font-semibold tracking-tight mt-8 mb-3.5",
    3: "text-lg sm:text-xl font-medium tracking-tight mt-6 mb-2.5",
    4: "text-base sm:text-lg font-medium tracking-tight mt-4 mb-2",
  }[level];

  const colorClasses = {
    standard: "text-[var(--theme-text,#f1f5f9)]",
    serif: "text-[#1a1a19] dark:text-[#f3f2ef]",
    newspaper: "text-black dark:text-[#faedd0]",
    nord: "text-[#2e3440] dark:text-[#eceff4]",
    tech: "text-[#39ff14]",
  }[style];

  return `${fontClass} ${sizeClasses} ${colorClasses}`;
};

export const getBlockquoteClasses = (style: PreviewStyle): string => {
  switch (style) {
    case "standard":
      return "my-6 pl-5 py-1.5 border-l-4 border-[var(--theme-accent,#10b981)] bg-[var(--theme-accent-subtle,rgba(16,185,129,0.1))] text-[var(--theme-text,#f1f5f9)] italic rounded-r-lg font-sans";
    case "serif":
      return "my-6 pl-5 py-1.5 border-l-4 border-amber-600 bg-[#fbf9f3] dark:bg-[#1e1d1a] text-[#42413e] dark:text-[#c4c1ba] italic rounded-r-lg font-sans";
    case "newspaper":
      return "my-6 pl-5 py-1.5 border-l-4 border-black dark:border-[#ebdcb9] bg-black/5 dark:bg-white/5 text-[#121212] dark:text-[#ebdcb9] italic font-sans";
    case "nord":
      return "my-6 pl-5 py-1.5 border-l-4 border-[#81a1c1] bg-slate-200/40 dark:bg-[#3b4252]/40 text-[#4c566a] dark:text-[#d8dee9] italic font-sans";
    case "tech":
      return "my-6 pl-5 py-1.5 border-l-4 border-[#39ff14] bg-emerald-950/20 text-[#82ff6e] italic font-mono";
  }
};

export const getInlineCodeClasses = (style: PreviewStyle): string => {
  switch (style) {
    case "standard":
      return "bg-[var(--theme-bg,#070c18)] text-[var(--theme-accent,#10b981)] font-mono text-[0.85em] px-1.5 py-0.5 rounded font-semibold border border-[var(--theme-border,#141d30)]";
    case "serif":
      return "bg-[#f4f1ea] dark:bg-[#252422] text-[#b45309] dark:text-[#f59e0b] font-mono text-[0.85em] px-1.5 py-0.5 rounded";
    case "newspaper":
      return "bg-[#ebdcb9] dark:bg-[#2e261d] text-black dark:text-[#faedd0] font-mono text-[0.85em] px-1.5 py-0.5 rounded";
    case "nord":
      return "bg-slate-200/60 dark:bg-[#3b4252] text-[#5e81ac] dark:text-[#88c0d0] font-mono text-[0.85em] px-1.5 py-0.5 rounded";
    case "tech":
      return "bg-[#001405] text-[#39ff14] font-mono text-[0.85em] px-1.5 py-0.5";
  }
};

export const getPlainPreBlockClasses = (style: PreviewStyle): string => {
  switch (style) {
    case "standard":
      return "my-3 overflow-x-auto w-full max-w-full rounded-xl border border-[var(--theme-border,#141d30)] bg-[var(--theme-bg,#070c18)] p-3.5 text-[var(--theme-text,#f1f5f9)] font-mono text-xs leading-relaxed";
    case "serif":
      return "my-3 overflow-x-auto w-full max-w-full rounded-xl border border-[#eae6db] dark:border-[#2a2926] bg-[#f4f1ea]/80 dark:bg-[#252422]/80 p-3.5 text-[#2c2b29] dark:text-[#e3e1db] font-mono text-xs leading-relaxed";
    case "newspaper":
      return "my-3 overflow-x-auto w-full max-w-full rounded-xl border border-[#d2c29d] dark:border-[#524935] bg-[#ebdcb9]/60 dark:bg-[#2e261d]/60 p-3.5 text-black dark:text-[#faedd0] font-mono text-xs leading-relaxed";
    case "nord":
      return "my-3 overflow-x-auto w-full max-w-full rounded-xl border border-slate-300/60 dark:border-[#3b4252] bg-slate-200/50 dark:bg-[#2e3440] p-3.5 text-[#2e3440] dark:text-[#eceff4] font-mono text-xs leading-relaxed";
    case "tech":
      return "my-3 overflow-x-auto w-full max-w-full border border-[#39ff14]/30 bg-[#001405] p-3.5 text-[#39ff14] font-mono text-xs leading-relaxed";
  }
};

export const getLinkClasses = (style: PreviewStyle): string => {
  switch (style) {
    case "standard":
      return "inline-flex items-center gap-0.5 text-[var(--theme-accent,#10b981)] hover:opacity-80 font-semibold underline underline-offset-4 transition-colors cursor-pointer";
    case "serif":
      return "inline-flex items-center gap-0.5 text-amber-800 dark:text-amber-400 hover:text-amber-950 dark:hover:text-amber-300 font-semibold underline underline-offset-4 decoration-1 decoration-amber-600/50 hover:decoration-amber-800 transition-colors cursor-pointer";
    case "newspaper":
      return "inline-flex items-center gap-0.5 text-black dark:text-[#faedd0] hover:bg-black/5 dark:hover:bg-white/5 font-bold underline decoration-2 decoration-black dark:decoration-[#faedd0] transition-colors cursor-pointer";
    case "nord":
      return "inline-flex items-center gap-0.5 text-[#5e81ac] dark:text-[#81a1c1] hover:text-[#81a1c1] dark:hover:text-[#88c0d0] font-semibold underline underline-offset-4 decoration-1 decoration-[#81a1c1]/50 transition-colors cursor-pointer";
    case "tech":
      return "inline-flex items-center gap-0.5 text-[#39ff14] hover:text-white font-mono underline decoration-1 decoration-[#39ff14] transition-colors cursor-pointer";
  }
};

export const getTableClasses = (style: PreviewStyle) => {
  const baseTable = "w-full text-left text-sm border-collapse";
  const tableWrapper =
    "w-full my-6 overflow-x-auto rounded-xl border shadow-sm";
  const headRow = "border-b font-semibold select-none";
  const dataRow = "border-b last:border-b-0 transition-colors";
  const headerCell = "px-4 py-3 font-semibold";
  const dataCell = "px-4 py-2.5";

  switch (style) {
    case "standard":
      return {
        wrapper: `${tableWrapper} border-[var(--theme-border,#141d30)]`,
        table: `${baseTable} bg-[var(--theme-card,#101726)]`,
        thead: `${headRow} bg-[var(--theme-bg,#070c18)] border-[var(--theme-border,#141d30)] text-[var(--theme-text,#f1f5f9)]`,
        tbody: "divide-y divide-[var(--theme-border,#141d30)]",
        tr: `${dataRow} border-[var(--theme-border,#141d30)] hover:bg-[var(--theme-card-hover,#162032)]`,
        th: `${headerCell} border-[var(--theme-border,#141d30)] text-[var(--theme-text,#f1f5f9)]`,
        td: `${dataCell} border-[var(--theme-border,#141d30)] text-[var(--theme-text,#f1f5f9)]`,
      };
    case "serif":
      return {
        wrapper: `${tableWrapper} border-[#eae6db] dark:border-[#2a2926]`,
        table: `${baseTable} bg-[#fcfbf7] dark:bg-[#161614]`,
        thead: `${headRow} bg-[#f6f3eb] dark:bg-[#1e1d1a] border-[#eae6db] dark:border-[#2a2926] text-[#42413e] dark:text-[#c4c1ba]`,
        tbody: "divide-y divide-[#eae6db]/60 dark:divide-[#2a2926]/60",
        tr: `${dataRow} border-[#eae6db]/40 dark:border-[#2a2926]/40 hover:bg-[#f6f3eb]/40 dark:hover:bg-[#1e1d1a]/30`,
        th: `${headerCell} border-[#eae6db] dark:border-[#2a2926] text-[#1a1a19] dark:text-[#f3f2ef]`,
        td: `${dataCell} border-[#eae6db] dark:border-[#2a2926] text-[#2c2b29] dark:text-[#e3e1db]`,
      };
    case "newspaper":
      return {
        wrapper: `${tableWrapper} border-[#d2c29d] dark:border-[#524935]`,
        table: `${baseTable} bg-[#f5ebd2] dark:bg-[#1e1a14]`,
        thead: `${headRow} bg-[#ebdcb9] dark:bg-[#2e261d] border-[#d2c29d] dark:border-[#524935] text-black dark:text-[#faedd0]`,
        tbody: "divide-y divide-[#d2c29d]/60 dark:divide-[#524935]/60",
        tr: `${dataRow} border-[#d2c29d]/40 dark:border-[#524935]/40 hover:bg-[#ebdcb9]/30 dark:hover:bg-[#2e261d]/20`,
        th: `${headerCell} border-[#d2c29d] dark:border-[#524935] text-black dark:text-[#faedd0]`,
        td: `${dataCell} border-[#d2c29d] dark:border-[#524935] text-[#121212] dark:text-[#ebdcb9]`,
      };
    case "nord":
      return {
        wrapper: `${tableWrapper} border-[#d8dee9] dark:border-[#3b4252]`,
        table: `${baseTable} bg-[#f0f4f8] dark:bg-[#2e3440]`,
        thead: `${headRow} bg-[#e5e9f0] dark:bg-[#3b4252] border-[#d8dee9] dark:border-[#3b4252] text-[#4c566a] dark:text-[#eceff4]`,
        tbody: "divide-y divide-[#d8dee9]/60 dark:divide-[#3b4252]/60",
        tr: `${dataRow} border-[#d8dee9]/40 dark:border-[#3b4252]/40 hover:bg-slate-200/30 dark:hover:bg-[#3b4252]/30`,
        th: `${headerCell} border-[#d8dee9] dark:border-[#3b4252] text-[#2e3440] dark:text-[#eceff4]`,
        td: `${dataCell} border-[#d8dee9] dark:border-[#3b4252] text-[#2e3440] dark:text-[#eceff4]`,
      };
    case "tech":
      return {
        wrapper: `${tableWrapper} border-[#102a18]`,
        table: `${baseTable} bg-[#060a07] font-mono text-xs`,
        thead: `${headRow} bg-[#001405] border-[#102a18] text-[#39ff14]`,
        tbody: "divide-y divide-[#102a18]/60",
        tr: `${dataRow} border-[#102a18]/40 hover:bg-emerald-950/20`,
        th: `${headerCell} border-[#102a18] text-[#39ff14]`,
        td: `${dataCell} border-[#102a18] text-[#39ff14]`,
      };
  }
};

export const getListClasses = (
  style: PreviewStyle,
  ordered: boolean,
): string => {
  const base = ordered ? "list-decimal" : "list-disc";
  const textClass = {
    standard: "text-slate-700 dark:text-slate-300",
    serif: "text-[#2c2b29] dark:text-[#e3e1db]",
    newspaper: "text-[#121212] dark:text-[#ebdcb9]",
    nord: "text-[#2e3440] dark:text-[#eceff4]",
    tech: "text-[#39ff14] font-mono",
  }[style];

  return `${base} list-outside pl-6 ml-2 my-4 space-y-2 ${textClass} [&_li>p]:inline-block [&_li>p]:my-0`;
};

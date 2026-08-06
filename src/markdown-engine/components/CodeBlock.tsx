import React, { useState } from "react";
import Prism from "prismjs";
import { Copy, Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { PreviewStyle } from "../types";

// Import essential PrismJS language grammars
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markup"; // HTML/XML
import "prismjs/components/prism-bash";
import "prismjs/components/prism-python";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-go";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-yaml";

interface CodeBlockProps {
  children: string;
  className?: string;
  theme?: PreviewStyle;
  initialCollapsed?: boolean;
  fileName?: string;
}

export default function CodeBlock({
  children,
  className,
  fileName,
  theme = "standard",
  initialCollapsed = true,
}: CodeBlockProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  // Memoize rawCode and language
  const { rawCode, language } = React.useMemo(() => {
    const langMatch = /language-(\w+)/.exec(className || "");
    return {
      rawCode: String(children).replace(/\n$/, ""),
      language: langMatch ? langMatch[1] : "text",
    };
  }, [children, className]);

  const linesCount = React.useMemo(() => rawCode.split("\n").length, [rawCode]);
  const isLongCode = linesCount > 6;
  const [isCollapsed, setIsCollapsed] = useState(
    () => initialCollapsed ?? linesCount > 6,
  );

  // Check if first line specifies a filename (e.g. "// src/App.tsx")
  const finalFileName =
    fileName ??
    React.useMemo(() => {
      const lines = rawCode.split("\n");
      const firstLine = lines[0]?.trim();
      if (
        firstLine &&
        (firstLine.startsWith("//") ||
          firstLine.startsWith("#") ||
          firstLine.startsWith("/*")) &&
        firstLine.includes(".")
      ) {
        const cleanLine = firstLine
          .replace(/^\/\/|^\/|^\*|^\s*#\s*/, "")
          .replace(/\*\/$/, "")
          .trim();
        if (
          cleanLine.length > 3 &&
          cleanLine.length < 50 &&
          !cleanLine.includes(" ")
        ) {
          return cleanLine;
        }
      }
      return null;
    }, [rawCode]);

  const handleCopy = async () => {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      console.error("Clipboard API not available");
      setCopyState("failed");
      setTimeout(() => setCopyState("idle"), 2000);
      return;
    }
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch (err) {
      console.error("Failed to copy code: ", err);
      setCopyState("failed");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  };

  // Safe Highlighting using PrismJS
  const highlightedHtml = React.useMemo(() => {
    try {
      const grammar = Prism.languages[language] || Prism.languages.text;
      if (grammar) {
        return Prism.highlight(rawCode, grammar, language);
      }
    } catch (e) {
      console.warn("Prism highlight failed, falling back to safe escape.", e);
    }
    // Safe fallback escaping
    return rawCode
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }, [rawCode, language]);

  // Style customization for code blocks based on the theme style preset
  const blockThemeStyles = React.useMemo(
    () =>
      ({
        standard: {
          outer: "bg-slate-950 border border-slate-800 text-slate-100",
          header: "bg-slate-900 border-b border-slate-800 text-slate-400",
          badge: "bg-slate-800 text-indigo-300",
          tag: "bg-indigo-500 animate-pulse",
          lineNo: "text-slate-600 border-r border-slate-800/80",
          copyBtn: "hover:bg-slate-800 hover:text-white",
        },
        serif: {
          outer: "bg-[#1c1b19] border border-[#2f2e2a] text-[#e3e1db]",
          header: "bg-[#252422] border-b border-[#2f2e2a] text-[#8e8d89]",
          badge: "bg-[#161614] text-amber-500",
          tag: "bg-amber-600",
          lineNo: "text-[#5c5b57] border-r border-[#2f2e2a]/50",
          copyBtn: "hover:bg-[#252422] hover:text-white",
        },
        newspaper: {
          outer: "bg-[#121212] border-2 border-black text-[#ebdcb9]",
          header: "bg-black border-b-2 border-[#ebdcb9]/40 text-[#ebdcb9]/80",
          badge: "bg-[#222] text-[#faedd0] font-bold",
          tag: "bg-[#faedd0]",
          lineNo: "text-[#ebdcb9]/40 border-r border-[#ebdcb9]/20",
          copyBtn: "hover:bg-white/10 hover:text-white",
        },
        nord: {
          outer: "bg-[#242933] border border-[#3b4252] text-[#eceff4]",
          header: "bg-[#2e3440] border-b border-[#3b4252] text-[#d8dee9]",
          badge: "bg-[#3b4252] text-[#88c0d0]",
          tag: "bg-[#81a1c1]",
          lineNo: "text-[#4c566a] border-r border-[#3b4252]/60",
          copyBtn: "hover:bg-[#3b4252] hover:text-white",
        },
        tech: {
          outer: "bg-[#001405] border border-[#102a18] text-[#39ff14]",
          header: "bg-[#060a07] border-b border-[#102a18] text-[#39ff14]/70",
          badge: "bg-[#001405] text-[#39ff14] border border-[#102a18]",
          tag: "bg-[#39ff14] shadow-[0_0_8px_#39ff14]",
          lineNo: "text-[#102a18] border-r border-[#102a18]/60",
          copyBtn: "hover:bg-emerald-950/40 hover:text-[#39ff14]",
        },
      })[theme],
    [theme],
  );

  // Specific token inline styling class maps depending on the preset
  const tokenStylesMap = React.useMemo(
    () =>
      ({
        standard: `
      .token.keyword { color: #f472b6; font-weight: 600; }
      .token.string { color: #34d399; }
      .token.comment { color: #64748b; font-style: italic; }
      .token.number { color: #fbbf24; }
      .token.function { color: #38bdf8; }
      .token.operator { color: #94a3b8; background: transparent !important; }
      .token.boolean { color: #fbbf24; }
      .token.class-name { color: #818cf8; }
    `,
        serif: `
      .token.keyword { color: #b45309; font-weight: 600; }
      .token.string { color: #047857; }
      .token.comment { color: #78716c; font-style: italic; }
      .token.number { color: #ea580c; }
      .token.function { color: #a21caf; }
      .token.operator { color: #78716c; background: transparent !important; }
      .token.boolean { color: #ea580c; }
      .token.class-name { color: #4338ca; }
    `,
        newspaper: `
      .token.keyword { color: #ffffff; font-weight: 800; text-decoration: underline; }
      .token.string { color: #a3be8c; font-style: italic; }
      .token.comment { color: #888888; font-style: italic; }
      .token.number { color: #d08770; font-weight: bold; }
      .token.function { color: #faedd0; font-weight: bold; }
      .token.operator { color: #ebdcb9; background: transparent !important; }
      .token.boolean { color: #d08770; }
      .token.class-name { color: #faedd0; }
    `,
        nord: `
      .token.keyword { color: #81a1c1; font-weight: 600; }
      .token.string { color: #a3be8c; }
      .token.comment { color: #4c566a; font-style: italic; }
      .token.number { color: #b48ead; }
      .token.function { color: #88c0d0; }
      .token.operator { color: #81a1c1; background: transparent !important; }
      .token.boolean { color: #b48ead; }
      .token.class-name { color: #8fbcbb; }
    `,
        tech: `
      .token.keyword { color: #39ff14; font-weight: 800; text-decoration: underline; }
      .token.string { color: #82ff6e; }
      .token.comment { color: #102a18; font-style: italic; }
      .token.number { color: #39ff14; font-weight: bold; }
      .token.function { color: #82ff6e; }
      .token.operator { color: #39ff14; background: transparent !important; }
      .token.boolean { color: #39ff14; }
      .token.class-name { color: #39ff14; }
    `,
      })[theme],
    [theme],
  );

  return (
    <div
      className={`relative my-6 rounded-xl border overflow-hidden shadow-xl max-w-full font-mono text-xs ${blockThemeStyles.outer}`}
    >
      {/* Dynamic Token Stylesheet Injector */}
      <style>{`
        #codeblock-wrapper-${theme} ${tokenStylesMap}
      `}</style>

      {/* Code Block Toolbar Header */}
      <div
        className={`flex items-center justify-between px-4 py-2 select-none text-[11px] ${blockThemeStyles.header}`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${blockThemeStyles.tag}`}
          />
          <span
            className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] ${blockThemeStyles.badge}`}
          >
            {language}
          </span>
          {finalFileName && (
            <span className="font-mono text-slate-400 dark:text-stone-400 ml-1 border-l border-slate-800 pl-2">
              {finalFileName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLongCode && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Expand code block" : "Collapse code block"}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors duration-200 cursor-pointer ${blockThemeStyles.copyBtn}`}
            >
              {isCollapsed ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronUp size={12} />
              )}
              <span>{isCollapsed ? "Expand" : "Collapse"}</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            title="Copy code content to clipboard"
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors duration-200 cursor-pointer ${blockThemeStyles.copyBtn}`}
          >
            {copyState === "copied" ? (
              <Check size={12} className="text-emerald-400" />
            ) : copyState === "failed" ? (
              <X size={12} className="text-red-400" />
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Area with foldability */}
      <div
        id={`codeblock-wrapper-${theme}`}
        className={`relative transition-all duration-300 ${
          isCollapsed ? "max-h-65 overflow-hidden" : "max-h-none"
        }`}
      >
        <div className="overflow-x-auto py-3.5 max-w-full select-text">
          <table className="w-full border-collapse">
            <tbody>
              {highlightedHtml.split("\n").map((line, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  {/* Line Number Column */}
                  <td
                    className={`pr-4 text-right select-none text-[10px] w-9 font-semibold ${blockThemeStyles.lineNo}`}
                  >
                    {idx + 1}
                  </td>
                  {/* Syntax Highlighted Line Column */}
                  <td
                    className="pl-4 font-mono text-xs whitespace-pre pr-4"
                    dangerouslySetInnerHTML={{ __html: line || " " }}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Fading Collapse overlay for long codes */}
        {isLongCode && isCollapsed && (
          <div
            onClick={() => setIsCollapsed(false)}
            title="Expand block"
            className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-slate-950 via-slate-950/80 to-transparent dark:from-slate-950/90 flex items-end justify-center pb-3 cursor-pointer"
            style={{
              backgroundImage:
                theme === "serif"
                  ? "linear-gradient(to top, #1c1b19, rgba(28, 27, 25, 0.9), transparent)"
                  : theme === "newspaper"
                    ? "linear-gradient(to top, #121212, rgba(18, 18, 18, 0.9), transparent)"
                    : theme === "nord"
                      ? "linear-gradient(to top, #242933, rgba(36, 41, 51, 0.9), transparent)"
                      : theme === "tech"
                        ? "linear-gradient(to top, #001405, rgba(0, 20, 5, 0.9), transparent)"
                        : undefined,
            }}
          >
            <span className="flex items-center gap-1 bg-slate-900 border border-slate-800 dark:border-stone-800 px-3 py-1.5 rounded-full text-[10px] font-bold text-indigo-300 shadow-xl hover:scale-105 transition-transform">
              <ChevronDown size={12} className="animate-bounce" />
              <span>Show more ({linesCount} lines)</span>
            </span>
          </div>
        )}
      </div>

      {/* Collapse Trigger button when expanded */}
      {isLongCode && !isCollapsed && (
        <div
          className="flex justify-center pb-2.5 pt-1 bg-black/10"
          style={{
            borderColor:
              theme === "tech" ? "#102a18" : "rgba(255,255,255,0.05)",
            borderTopWidth: "1px",
          }}
        >
          <button
            onClick={() => setIsCollapsed(true)}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 hover:text-white transition-all cursor-pointer hover:scale-105"
          >
            <ChevronUp size={12} />
            <span>Show less</span>
          </button>
        </div>
      )}
    </div>
  );
}

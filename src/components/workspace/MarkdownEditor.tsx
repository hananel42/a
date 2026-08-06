/**
 * @file MarkdownEditor.tsx
 * @description Highly responsive Markdown textarea editor with local buffering, debounced parent updates,
 * real-time line/word/character statistics, search-and-replace overlay, keyboard formatting shortcuts, and copy actions.
 */

import React, { useRef, useEffect, useState } from "react";
import {
  Search,
  Replace,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Copy,
  Check,
} from "lucide-react";
import { FormatType } from "../../utils/formatter";
import { useEditorShortcuts } from "../../hooks/useEditorShortcuts";
import { useSearchReplace } from "../../hooks/useSearchReplace";

interface MarkdownEditorProps {
  content: string;
  onChange: (val: string) => void;
  onFormat: (type: FormatType, data?: any) => void;
  editorRef: React.RefObject<HTMLTextAreaElement | null>;
  viewerScrollContainerRef: React.RefObject<HTMLDivElement | null>;
  mode: "split" | "edit" | "preview";
}

/**
 * Textarea editor for Markdown documents.
 */
export default function MarkdownEditor({
  content,
  onChange,
  onFormat,
  editorRef,
  viewerScrollContainerRef,
  mode,
}: MarkdownEditorProps) {
  const textareaRef = editorRef;

  const [localVal, setLocalVal] = useState(content);
  const lastPropagatedValRef = useRef(content);

  const handleLocalChange = (newVal: string, immediate = false) => {
    setLocalVal(newVal);
    if (immediate) {
      lastPropagatedValRef.current = newVal;
      onChange(newVal);
    }
  };

  useEffect(() => {
    if (localVal === content) return;

    const timer = setTimeout(() => {
      lastPropagatedValRef.current = localVal;
      onChange(localVal);
    }, 150);

    return () => clearTimeout(timer);
  }, [localVal, content, onChange]);

  useEffect(() => {
    if (content !== lastPropagatedValRef.current) {
      setLocalVal(content);
      lastPropagatedValRef.current = content;
    }
  }, [content]);

  const [copied, setCopied] = useState(false);

  const {
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    replaceQuery,
    setReplaceQuery,
    matchCase,
    setMatchCase,
    searchIndices,
    activeIndex,
    handleNextSearch,
    handlePrevSearch,
    handleReplace,
    handleReplaceAll,
  } = useSearchReplace(
    localVal,
    (newVal) => handleLocalChange(newVal, true),
    textareaRef,
  );

  const linesCount = localVal ? localVal.split("\n").length : 0;
  const wordCount = localVal
    ? localVal.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const charCount = localVal ? localVal.length : 0;
  const readingTime = Math.ceil(wordCount / 200);

  const toggleSearch = () => setSearchOpen((prev) => !prev);
  const { handleKeyDown } = useEditorShortcuts(
    textareaRef,
    (newVal) => handleLocalChange(newVal, true),
    onFormat,
    toggleSearch,
  );

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(localVal);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy markdown: ", err);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-white dark:bg-slate-950 overflow-hidden relative">
      {searchOpen && (
        <div className="flex flex-col gap-2.5 p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 animate-slide-down z-10 select-none">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Find text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                autoFocus
              />

              {searchQuery && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-500 font-mono">
                  <span>{searchIndices.length > 0 ? activeIndex + 1 : 0}</span>
                  <span>/</span>
                  <span>{searchIndices.length}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevSearch}
                disabled={searchIndices.length <= 1}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 disabled:opacity-35 disabled:hover:bg-transparent cursor-pointer"
                title="Previous Occurrence"
              >
                <ChevronUp size={15} />
              </button>
              <button
                onClick={handleNextSearch}
                disabled={searchIndices.length <= 1}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 disabled:opacity-35 disabled:hover:bg-transparent cursor-pointer"
                title="Next Occurrence"
              >
                <ChevronDown size={15} />
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

              <button
                onClick={() => setMatchCase(!matchCase)}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold tracking-wider uppercase transition-colors border cursor-pointer ${matchCase ? "bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-900 dark:text-indigo-300" : "bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                title="Match character case"
              >
                Aa
              </button>

              <button
                onClick={() => setSearchOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Replace size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleReplace}
                disabled={searchIndices.length === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-35 cursor-pointer"
              >
                Replace
              </button>
              <button
                onClick={handleReplaceAll}
                disabled={searchIndices.length === 0}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-35 cursor-pointer shadow-sm"
              >
                Replace All
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 relative flex">
        <textarea
          ref={textareaRef}
          value={localVal}
          onChange={(e) => handleLocalChange(e.target.value)}
          onKeyDown={handleKeyDown}
          dir="auto"
          placeholder="Start writing awesome Markdown here..."
          className={`flex-1 h-full w-full outline-none resize-none py-4 px-5 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-mono text-sm leading-relaxed focus:ring-0 focus:outline-none placeholder-slate-400 overflow-auto scrollbar-thin`}
          style={{ tabSize: 4 }}
        />
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 py-1.5 text-[10px] sm:text-xs text-slate-400 font-mono select-none shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-slate-400" />
            <span>{readingTime} min read</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText size={12} className="text-slate-400" />
            <span>{linesCount} lines</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyMarkdown}
            title="Copy whole document as Raw Markdown to clipboard"
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 font-sans font-semibold text-[10px] transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check
                  size={11}
                  className="text-emerald-500 dark:text-emerald-400"
                />
                <span className="text-emerald-500 dark:text-emerald-400">
                  Copied!
                </span>
              </>
            ) : (
              <>
                <Copy size={11} className="text-slate-400" />
                <span>Copy MD</span>
              </>
            )}
          </button>

          <div className="h-4.5 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

          <span className="text-slate-400 flex items-center gap-1">
            <span>Editor Sync</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
          </span>
          <span className="hidden sm:inline border-l border-slate-200 dark:border-slate-800 pl-2 text-slate-500 uppercase tracking-wider font-semibold">
            UTF-8
          </span>
        </div>
      </div>
    </div>
  );
}

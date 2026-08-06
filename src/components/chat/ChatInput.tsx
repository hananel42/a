/**
 * @file ChatInput.tsx
 * @description
 * High-performance, minimalist chat input component with multi-line prompt expansion editor
 * and attachment chips.
 */

import React, { useRef, useState, useEffect } from "react";
import { Send, Square, Paperclip, Maximize2, X, FileText } from "lucide-react";

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  isStreaming: boolean;
  onSendMessage: (e?: React.FormEvent) => void;
  onStopStreaming: () => void;
  onUploadFiles?: (files: File[]) => void;
  attachedFiles?: string[];
  onRemoveAttachedFile?: (fileName: string) => void;
}

export default function ChatInput({
  inputText,
  setInputText,
  isStreaming,
  onSendMessage,
  onStopStreaming,
  onUploadFiles,
  attachedFiles = [],
  onRemoveAttachedFile,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const expandedTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isExpanded && expandedTextareaRef.current) {
      expandedTextareaRef.current.focus();
    }
  }, [isExpanded]);

  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onUploadFiles) {
      onUploadFiles(Array.from(e.target.files));
      e.target.value = ""; // Reset
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStreaming) return;
    onSendMessage(e);
    if (isExpanded) {
      setIsExpanded(false);
    }
  };

  const handleExpandedKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isStreaming && (inputText.trim() || attachedFiles.length > 0)) {
        onSendMessage();
        setIsExpanded(false);
      }
    } else if (e.key === "Escape") {
      setIsExpanded(false);
    }
  };

  const lineCount = inputText ? inputText.split("\n").length : 1;
  const charCount = inputText.length;

  return (
    <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 select-none">
      {/* Hidden File Input */}
      {onUploadFiles && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
        />
      )}

      <form
        onSubmit={handleFormSubmit}
        className="max-w-4xl mx-auto flex flex-col gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 sm:px-4 sm:py-2.5 transition-all focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/25"
      >
        {/* Attached Files Bar */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mr-1">
              Attached ({attachedFiles.length}):
            </span>
            {attachedFiles.map((fileName, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-mono"
              >
                <FileText size={12} className="shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {fileName}
                </span>
                {onRemoveAttachedFile && (
                  <button
                    type="button"
                    onClick={() => onRemoveAttachedFile(fileName)}
                    className="p-0.5 hover:bg-indigo-500/20 rounded-md text-indigo-400 hover:text-indigo-200 transition-colors cursor-pointer ml-0.5"
                    title="Remove attached file"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {onUploadFiles && (
            <button
              type="button"
              onClick={handleAttachmentClick}
              disabled={isStreaming}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-900 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
              title="Upload files to workspace"
            >
              <Paperclip size={14} className="stroke-[2.5px]" />
            </button>
          )}

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isStreaming}
            placeholder={
              isStreaming
                ? "Agent is busy evaluating workspace code and instructions..."
                : "Send instruction to AI workspace..."
            }
            className="flex-1 text-xs sm:text-sm bg-transparent border-0 outline-none focus:ring-0 focus:outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 font-sans"
          />

          <div className="flex items-center gap-1.5 shrink-0 select-none">
            {/* Expand Editor Button */}
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              disabled={isStreaming}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-900 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Expand prompt editor (Multi-line mode)"
            >
              <Maximize2 size={13} className="stroke-[2.5px]" />
            </button>

            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center cursor-pointer transition-all hover:bg-red-500/20 active:scale-95"
                title="Stop Generation"
              >
                <Square size={10} className="fill-red-500 stroke-0" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputText.trim() && attachedFiles.length === 0}
                className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-25 transition-all cursor-pointer flex items-center justify-center shadow-xs active:scale-95"
              >
                <Send size={11} className="stroke-[2.5px] ml-0.5" />
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Expanded Minimalist Prompt Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-3xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <FileText
                  size={15}
                  className="text-indigo-500 stroke-[2.5px]"
                />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
                  Expanded Prompt Editor
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-[10px] text-slate-400 font-mono">
                  Press{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    Enter
                  </kbd>{" "}
                  for line break,{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    ⌘ + Enter
                  </kbd>{" "}
                  to send
                </span>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Attached Files inside Modal if any */}
            {attachedFiles.length > 0 && (
              <div className="px-5 py-2.5 bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-400 font-bold mr-1">
                  Attached Files ({attachedFiles.length}):
                </span>
                {attachedFiles.map((fileName, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-mono"
                  >
                    <FileText size={12} />
                    <span className="truncate max-w-[180px]">{fileName}</span>
                    {onRemoveAttachedFile && (
                      <button
                        type="button"
                        onClick={() => onRemoveAttachedFile(fileName)}
                        className="p-0.5 hover:bg-indigo-500/20 rounded-md text-indigo-400 transition-colors cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Modal Textarea */}
            <div className="p-4 flex-1 overflow-y-auto">
              <textarea
                ref={expandedTextareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleExpandedKeyDown}
                placeholder="Type your multi-line instruction to the AI agent..."
                rows={10}
                className="w-full h-full min-h-[220px] max-h-[50vh] p-2 text-xs sm:text-sm font-sans bg-transparent border-0 outline-none focus:ring-0 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 resize-y leading-relaxed"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                <span>{charCount} characters</span>
                <span>•</span>
                <span>
                  {lineCount} {lineCount === 1 ? "line" : "lines"}
                </span>
                {onUploadFiles && (
                  <>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={handleAttachmentClick}
                      className="text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 font-sans cursor-pointer"
                    >
                      <Paperclip size={12} />
                      <span>Attach file</span>
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      !isStreaming &&
                      (inputText.trim() || attachedFiles.length > 0)
                    ) {
                      onSendMessage();
                      setIsExpanded(false);
                    }
                  }}
                  disabled={!inputText.trim() && attachedFiles.length === 0}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-30 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
                >
                  <span>Send Instruction</span>
                  <Send size={11} className="stroke-[2.5px]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @file AgentMemoryEditor.tsx
 * @description Interactive manager for viewing and editing persistent agent memories (agent/[agentId]/memories.txt).
 */

import React, { useState } from "react";
import {
  Brain,
  Plus,
  Trash2,
  Edit3,
  Check,
  Sparkles,
  FileText,
  AlertCircle,
} from "lucide-react";

interface AgentMemoryEditorProps {
  agentId: string;
  memoryContent: string;
  onChangeMemoryContent: (newContent: string) => void;
}

export default function AgentMemoryEditor({
  agentId,
  memoryContent,
  onChangeMemoryContent,
}: AgentMemoryEditorProps) {
  const [viewMode, setViewMode] = useState<"list" | "raw">("list");
  const [newMemoryText, setNewMemoryText] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  // Parse lines into clean bullet points
  const memoryLines = memoryContent
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const handleAddMemory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMemoryText.trim()) return;

    const formatted = newMemoryText.trim().startsWith("- ")
      ? newMemoryText.trim()
      : `- ${newMemoryText.trim()}`;

    const updated = memoryContent.trim()
      ? `${memoryContent.trim()}\n${formatted}`
      : formatted;

    onChangeMemoryContent(updated);
    setNewMemoryText("");
  };

  const handleDeleteLine = (index: number) => {
    const updatedLines = memoryLines.filter((_, i) => i !== index);
    onChangeMemoryContent(updatedLines.join("\n"));
  };

  const handleStartEdit = (index: number, currentLine: string) => {
    setEditingIndex(index);
    setEditText(currentLine.replace(/^- /, ""));
  };

  const handleSaveEdit = (index: number) => {
    if (!editText.trim()) {
      handleDeleteLine(index);
    } else {
      const formatted = `- ${editText.trim()}`;
      const updatedLines = memoryLines.map((line, i) =>
        i === index ? formatted : line,
      );
      onChangeMemoryContent(updatedLines.join("\n"));
    }
    setEditingIndex(null);
    setEditText("");
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all persistent memories for this agent?",
      )
    ) {
      onChangeMemoryContent("");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 space-y-4 shadow-2xs">
      {/* Editor Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Brain size={14} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span>Agent Long-Term Memories</span>
              <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                agent/{agentId}/memories.txt
              </span>
            </h3>
            <p className="text-[10.5px] text-slate-400">
              Persistent facts, user rules, and system choices preserved across
              sessions.
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
              viewMode === "list"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Structured List ({memoryLines.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode("raw")}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
              viewMode === "raw"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Raw Editor
          </button>
        </div>
      </div>

      {/* Structured List View */}
      {viewMode === "list" ? (
        <div className="space-y-3">
          {/* Quick Add Form */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add long-term memory entry (e.g. 'Prefers TypeScript over JS')..."
              value={newMemoryText}
              onChange={(e) => setNewMemoryText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddMemory();
                }
              }}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-sans"
            />
            <button
              type="button"
              onClick={() => handleAddMemory()}
              disabled={!newMemoryText.trim()}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={13} />
              <span>Add</span>
            </button>
          </div>

          {/* Memory List Items */}
          {memoryLines.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40">
              <Sparkles size={20} className="mx-auto text-slate-400 mb-1.5" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                No memories recorded yet.
              </p>
              <p className="text-[10.5px] text-slate-400 mt-0.5">
                The agent saves memories automatically via the 'save_memory'
                tool, or you can add custom entries above.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {memoryLines.map((line, idx) => {
                const cleanText = line.replace(/^- /, "");
                const isEditing = editingIndex === idx;

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/70 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 group transition-all"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSaveEdit(idx)
                          }
                          className="flex-1 px-2 py-1 text-xs rounded-lg border border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(idx)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg"
                          title="Save"
                        >
                          <Check size={13} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className="text-indigo-500 font-bold shrink-0 mt-0.5">
                            •
                          </span>
                          <span className="font-sans break-words leading-snug">
                            {cleanText}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(idx, line)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit entry"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLine(idx)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Delete entry"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Raw Text Area View */
        <div className="space-y-2">
          <textarea
            value={memoryContent}
            onChange={(e) => onChangeMemoryContent(e.target.value)}
            rows={6}
            placeholder={`- Prefers concise markdown outputs\n- Use TypeScript for all code snippets`}
            className="w-full p-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
          />
          <div className="flex items-center justify-between text-[10.5px] text-slate-400 font-mono">
            <span>
              Lines: {memoryLines.length} | Characters: {memoryContent.length}
            </span>
            <span className="text-slate-400 font-sans">
              Format: standard bullet points (- note)
            </span>
          </div>
        </div>
      )}

      {/* Clear All Footer Button */}
      {memoryLines.length > 0 && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[10.5px] text-red-500 hover:text-red-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
          >
            <Trash2 size={11} />
            <span>Clear Memory File</span>
          </button>
        </div>
      )}
    </div>
  );
}

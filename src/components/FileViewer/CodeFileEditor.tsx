/**
 * @file CodeFileEditor.tsx
 * @description A high-performance code editor component using react-simple-code-editor and Prism.
 * Features debounced local typing state, synchronized vertical scroll layout, and manual
 * Python file execution with interactive STDOUT/STDERR terminal console & stdin support.
 */

import React, { useRef, useState, useEffect } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";
import "prismjs/components/prism-python";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-sql";
import { Copy } from "lucide-react";
import "prismjs/themes/prism.css";

import PythonRunButton from "../workspace/python/PythonRunButton";
import PythonConsole from "../workspace/python/PythonConsole";
import PythonInputDialog from "../workspace/python/PythonInputDialog";
import {
  executeWorkspacePython,
  executeWorkspacePythonStream,
  extractInputPrompt,
  prewarmPyodide,
} from "../../services/pythonRunner";
import { PythonConsoleLog, PythonExecutionState } from "../../types/python";
import { WorkspaceItem } from "../../types/workspace";
import { getVirtualPath } from "../../tools/types";

interface CodeFileEditorProps {
  content: string;
  onChange: (val: string) => void;
  language?: string;
  fileName?: string;
  workspaceItems?: WorkspaceItem[];
  updateFileContent?: (id: string, content: string) => Promise<void> | void;
  createFile?: (
    name: string,
    parentId: string | null,
    content?: string,
  ) => Promise<string> | string;
  createFolder?: (
    name: string,
    parentId: string | null,
  ) => Promise<string> | string;
  activeFileId?: string;
}

export default function CodeFileEditor({
  content,
  onChange,
  language = "javascript",
  fileName,
  workspaceItems = [],
  updateFileContent,
  createFile,
  createFolder,
  activeFileId,
}: CodeFileEditorProps) {
  const [localContent, setLocalContent] = useState(content);
  const isFocused = useRef(false);

  // Detect Python file
  const isPython =
    language === "py" ||
    language === "python" ||
    (Boolean(fileName) && fileName!.endsWith(".py"));

  // Pre-warm Pyodide runtime in background when opening Python files
  useEffect(() => {
    if (isPython) {
      prewarmPyodide();
    }
  }, [isPython]);

  // Python Execution & Terminal States
  const [execState, setExecState] = useState<PythonExecutionState>("idle");
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [logs, setLogs] = useState<PythonConsoleLog[]>([]);
  const [inputs, setInputs] = useState<string[]>([]);
  const [durationMs, setDurationMs] = useState<number | undefined>(undefined);
  const [syncedPaths, setSyncedPaths] = useState<string[]>([]);

  // Dialog state for interactive input prompts in sandboxed iframes
  const [inputDialogState, setInputDialogState] = useState<{
    isOpen: boolean;
    promptText: string;
    accumulatedInputs: string[];
  }>({
    isOpen: false,
    promptText: "",
    accumulatedInputs: [],
  });

  // Keep a ref of content to sync from parent if needed
  useEffect(() => {
    if (!isFocused.current && content !== localContentRef.current) {
      setLocalContent(content);
    }
  }, [content]);

  // Keep refs for unmount flushing to avoid stale closure issues
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const localContentRef = useRef(localContent);
  useEffect(() => {
    localContentRef.current = localContent;
  }, [localContent]);

  // Handle debounced callback
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleValueChange = (newVal: string) => {
    setLocalContent(newVal);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onChangeRef.current(newVal);
    }, 250); // Debounce keeps typing instantaneous and extremely responsive
  };

  // Flush final content to parent on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      onChangeRef.current(localContentRef.current);
    };
  }, []);

  const highlight = (code: string) => {
    const prismLangKey = language === "py" ? "python" : language;
    const prismLanguage =
      Prism.languages[prismLangKey] || Prism.languages.javascript;
    return Prism.highlight(code, prismLanguage, prismLangKey);
  };

  const lines = localContent.split("\n");

  const copyToClipboard = () => {
    navigator.clipboard.writeText(localContent);
  };

  const isCancelledRef = useRef(false);
  const activeRunIdRef = useRef<string | null>(null);

  const handleStopPython = () => {
    isCancelledRef.current = true;
    setExecState("idle");
    setInputDialogState({
      isOpen: false,
      promptText: "",
      accumulatedInputs: [],
    });
    const nowStr = new Date().toLocaleTimeString([], { hour12: false });
    setLogs((prev) => [
      ...prev,
      {
        id: Date.now().toString() + "-stopped",
        type: "system",
        text: `[${nowStr}] Execution stopped by user.`,
        timestamp: nowStr,
      },
    ]);
  };

  // Execute Python Script with real-time streaming stdout/stderr & handle input() prompts
  const handleRunPython = async (overrideInputs?: string[]) => {
    if (!isPython) return;

    isCancelledRef.current = false;
    const currentInputs = overrideInputs !== undefined ? overrideInputs : [];
    const isNewRun = overrideInputs === undefined;

    const startTimeStr = new Date().toLocaleTimeString([], { hour12: false });

    if (isNewRun) {
      setInputs([]);
    }

    setLogs([
      {
        id: Date.now().toString() + "-divider",
        type: "divider",
        text: "",
        timestamp: startTimeStr,
      },
    ]);

    setIsConsoleOpen(true);
    setExecState("running");

    const activeFileItem = activeFileId ? workspaceItems.find((i) => i.id === activeFileId) : null;
    const resolvedPath = activeFileItem ? getVirtualPath(activeFileItem.id, workspaceItems) : (fileName || "script.py");

    const result = await executeWorkspacePythonStream({
      code: localContentRef.current,
      filePath: resolvedPath,
      files: workspaceItems,
      inputs: currentInputs,
      items: workspaceItems,
      updateFileContent,
      createFile,
      createFolder,
      onChunk: (chunk) => {
        if (isCancelledRef.current) return;
        const nowStr = new Date().toLocaleTimeString([], { hour12: false });

        // Stream chunk live into logs
        setLogs((prev) => {
          // If stderr hint or EOFError, omit raw hint from live stream
          if (
            chunk.type === "stderr" &&
            (chunk.text.includes("EOFError: EOF when reading a line") ||
             chunk.text.includes("EOFError: __PROMPT__:"))
          ) {
            return prev;
          }
          return [
            ...prev,
            {
              id:
                Date.now().toString() +
                "-" +
                Math.random().toString(36).slice(2, 6),
              type: chunk.type,
              text: chunk.text,
              timestamp: nowStr,
            },
          ];
        });
      },
    });

    if (isCancelledRef.current) return;

    const finishTimeStr = new Date().toLocaleTimeString([], { hour12: false });

    // If script is requesting input() via EOFError or prompt hint
    if (
      result.requiresInput ||
      (result.stderr &&
        (result.stderr.includes("EOFError: __PROMPT__:") ||
          result.stderr.includes("EOFError: EOF when reading a line") ||
          result.stderr.includes("input()")))
    ) {
      const promptText = result.extractedPrompt !== undefined && result.extractedPrompt !== "" 
        ? result.extractedPrompt 
        : extractInputPrompt(result.stdout, result.stderr);

      setInputDialogState({
        isOpen: true,
        promptText,
        accumulatedInputs: currentInputs,
      });
      setExecState("awaiting_input");
      return;
    }

    // Append completion status line
    const statusLog: PythonConsoleLog = result.success
      ? {
          id: Date.now().toString() + "-success-status",
          type: "system",
          text: `[${finishTimeStr}] Process completed in ${(result.durationMs / 1000).toFixed(2)}s | Exit code 0`,
          timestamp: finishTimeStr,
        }
      : {
          id: Date.now().toString() + "-error-status",
          type: "system",
          text: `[${finishTimeStr}] Process finished with error | Exit code 1`,
          timestamp: finishTimeStr,
        };

    setLogs((prev) => [...prev, statusLog]);

    // Log created/updated workspace files info if any
    if (result.syncedPaths && result.syncedPaths.length > 0) {
      const syncLog: PythonConsoleLog = {
        id: Date.now().toString() + "-synced-files",
        type: "system",
        text: `[${finishTimeStr}] Updated workspace files: ${result.syncedPaths.join(", ")}`,
        timestamp: finishTimeStr,
      };
      setLogs((prev) => [...prev, syncLog]);
    }

    setDurationMs(result.durationMs);
    setSyncedPaths(result.syncedPaths);
    setExecState(result.success ? "success" : "error");
  };

  const handleProvideDialogInput = (val: string) => {
    const updatedInputs = [...inputDialogState.accumulatedInputs, val];
    setInputs(updatedInputs);
    setInputDialogState({
      isOpen: false,
      promptText: "",
      accumulatedInputs: [],
    });

    handleRunPython(updatedInputs);
  };

  const handleCancelDialogInput = () => {
    setInputDialogState({
      isOpen: false,
      promptText: "",
      accumulatedInputs: [],
    });
    setExecState("idle");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isPython && (e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleRunPython();
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      className="flex flex-col h-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden font-mono text-sm relative"
    >
      {/* Inline styles to guarantee no wrapping on long lines and perfect styling */}
      <style>{`
        .code-editor-component textarea,
        .code-editor-component pre {
          white-space: pre !important;
          overflow-wrap: normal !important;
          word-break: normal !important;
          word-wrap: normal !important;
          min-width: 100%;
        }
        /* Fix prism default styling weirdness (like operator backgrounds) */
        .code-editor-component .token.operator,
        .code-editor-component .token.entity,
        .code-editor-component .token.url,
        .language-css .token.string,
        .style .token.string {
          background: none !important;
        }
        /* Ensure dark mode colors look stunning and readable */
        .dark .code-editor-component .token.operator {
          color: #f8f8f2 !important;
        }
        .dark .code-editor-component .token.comment,
        .dark .code-editor-component .token.prolog,
        .dark .code-editor-component .token.doctype,
        .dark .code-editor-component .token.cdata {
          color: #6272a4 !important;
        }
        .dark .code-editor-component .token.keyword {
          color: #ff79c6 !important;
        }
        .dark .code-editor-component .token.string {
          color: #f1fa8c !important;
        }
        .dark .code-editor-component .token.function {
          color: #50fa7b !important;
        }
        .dark .code-editor-component .token.number {
          color: #bd93f9 !important;
        }
      `}</style>

      {/* Outer Scroll Container: Scrolls Vertically and Horizontally */}
      <div className="flex-1 overflow-auto relative scrollbar-thin">
        <div className="flex min-h-full min-w-max">
          {/* Line numbers gutter: Sticky so line numbers stay visible when scrolling horizontally */}
          <div
            className="sticky left-0 z-10 text-right py-4 pr-3 pl-4 text-slate-400 dark:text-slate-500 select-none border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex-shrink-0"
            style={{
              lineHeight: "20px",
            }}
          >
            {lines.map((_, i) => (
              <div key={i} style={{ height: "20px" }}>
                {i + 1}
              </div>
            ))}
          </div>

          {/* Editor Container: Scrolls Horizontally for long lines */}
          <div className="flex-1 overflow-x-auto min-w-0 scrollbar-thin">
            <Editor
              value={localContent}
              onValueChange={handleValueChange}
              highlight={highlight}
              padding={16}
              className="font-mono text-sm min-h-full code-editor-component"
              textareaClassName="focus:outline-none"
              onFocus={() => {
                isFocused.current = true;
              }}
              onBlur={() => {
                isFocused.current = false;
                // Instantly sync on blur
                onChangeRef.current(localContentRef.current);
              }}
              style={{
                fontFamily: '"Fira Code", "JetBrains Mono", monospace',
                fontSize: 14,
                lineHeight: "20px",
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer / Toolbar */}
      <div className="flex items-center justify-between p-2 px-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 select-none">
        <div className="flex items-center gap-3">
          <span className="uppercase font-semibold tracking-wider text-slate-600 dark:text-slate-400">
            {language}
          </span>
          {isPython && (
            <PythonRunButton
              onRun={() => handleRunPython()}
              onStop={handleStopPython}
              state={execState}
              onToggleConsole={() => setIsConsoleOpen(!isConsoleOpen)}
              isConsoleOpen={isConsoleOpen}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title="Copy code"
          >
            <Copy size={12} />
            Copy
          </button>
        </div>
      </div>

      {/* Bottom Python Terminal Console */}
      {isPython && isConsoleOpen && (
        <PythonConsole
          logs={logs}
          state={execState}
          durationMs={durationMs}
          syncedPaths={syncedPaths}
          onClearLogs={() => setLogs([])}
          onClose={() => setIsConsoleOpen(false)}
          fileName={fileName || "script.py"}
        />
      )}

      {/* In-app Input Dialog (Works in Sandboxed IFrames) */}
      <PythonInputDialog
        isOpen={inputDialogState.isOpen}
        promptText={inputDialogState.promptText}
        onSubmit={handleProvideDialogInput}
        onCancel={handleCancelDialogInput}
      />
    </div>
  );
}

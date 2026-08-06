/**
 * @file AgentAdvancedSettings.tsx
 * @description Advanced Settings panel with full system prompt template editing,
 * variable substitution pills (${name}, ${instructions}, ${allowedTools}, etc.), and context injection controls.
 */

import React, { useRef, useState } from "react";
import { Sliders, RefreshCw, Eye, FileCode } from "lucide-react";
import { AgentPromptConfig } from "../../types/agent";
import { DEFAULT_SYSTEM_PROMPT_TEMPLATE } from "../../constants/agentPrompts";
import { WORKSPACE_PYTHON_DOCS } from "../../constants/workspacePythonDocs";

interface AgentAdvancedSettingsProps {
  promptConfig: AgentPromptConfig;
  onChangePromptConfig: (updated: AgentPromptConfig) => void;
  agentName: string;
  agentId: string;
  agentDescription: string;
  agentInstructions: string;
}

export default function AgentAdvancedSettings({
  promptConfig,
  onChangePromptConfig,
  agentName,
  agentId,
  agentDescription,
  agentInstructions,
}: AgentAdvancedSettingsProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const template = promptConfig.systemPromptTemplate ?? "";

  const VAR_PILLS = [
    { label: "${name}", desc: "Agent display name" },
    { label: "${id}", desc: "Agent ID" },
    { label: "${description}", desc: "Role description" },
    { label: "${instructions}", desc: "Core system instructions" },
    {
      label: "${workspace-python-docs}",
      desc: "Workspace Python Library API documentation",
    },
    { label: "${allowedTools}", desc: "Authorized tools list" },
    { label: "${allowedReadPaths}", desc: "Read path boundaries" },
    { label: "${allowedWritePaths}", desc: "Write path boundaries" },
    { label: "${activeFiles}", desc: "Active workspace files list" },
    { label: "${workspaceTree}", desc: "Workspace directory tree" },
    { label: "${memories}", desc: "Persistent memories content" },
  ];

  const handleInsertVariable = (varStr: string) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentVal = template || DEFAULT_SYSTEM_PROMPT_TEMPLATE;

    const newVal =
      currentVal.substring(0, start) + varStr + currentVal.substring(end);
    onChangePromptConfig({ ...promptConfig, systemPromptTemplate: newVal });

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + varStr.length, start + varStr.length);
    }, 50);
  };

  const handleLoadDefaultTemplate = () => {
    onChangePromptConfig({
      ...promptConfig,
      systemPromptTemplate: DEFAULT_SYSTEM_PROMPT_TEMPLATE,
    });
  };

  // Evaluate preview string
  const evaluatePreview = () => {
    let tmpl = template.trim() ? template : DEFAULT_SYSTEM_PROMPT_TEMPLATE;
    tmpl = tmpl.replace(/\$\{name\}/g, agentName || "Code Auditor");
    tmpl = tmpl.replace(/\$\{id\}/g, agentId || "code-auditor");
    tmpl = tmpl.replace(
      /\$\{description\}/g,
      agentDescription || "Reviews files and checks code quality.",
    );
    tmpl = tmpl.replace(
      /\$\{instructions\}/g,
      agentInstructions || "Enforce clean design principles.",
    );
    tmpl = tmpl.replace(
      /\$\{workspace-python-docs\}/g,
      "[Workspace Python Documentation Block]"
    );
    tmpl = tmpl.replace(
      /\$\{workspacePythonDocs\}/g,
      "[Workspace Python Documentation Block]"
    );
    tmpl = tmpl.replace(
      /\$\{allowedTools\}/g,
      "read_file, write_file, list_dir",
    );
    tmpl = tmpl.replace(/\$\{allowedReadPaths\}/g, "/");
    tmpl = tmpl.replace(/\$\{allowedWritePaths\}/g, "/");
    tmpl = tmpl.replace(
      /\$\{activeFiles\}/g,
      promptConfig.includeActiveFiles === true ? `### WORKSPACE ACTIVE FILES\n- src/App.tsx (file)\n- package.json (file)` : ""
    );
    tmpl = tmpl.replace(
      /\$\{workspaceTree\}/g,
      promptConfig.includeWorkspaceTree === true ? `### WORKSPACE DIRECTORY TREE\n\`\`\`\n📁 src\n  📄 App.tsx\n\`\`\`` : ""
    );
    tmpl = tmpl.replace(
      /\$\{memories\}/g,
      promptConfig.includeMemories !== false ? `### PERSISTENT MEMORIES\n- Prefers modular TypeScript code.` : ""
    );
    return tmpl;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Full System Prompt Template Control */}
      <div className="bg-gradient-to-r from-indigo-900/10 via-slate-900/5 to-purple-900/10 dark:from-indigo-950/40 dark:to-purple-950/30 border border-indigo-200/60 dark:border-indigo-800/40 p-4 md:p-5 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-200/40 dark:border-indigo-800/40 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Sliders
                size={14}
                className="text-indigo-600 dark:text-indigo-400"
              />
              <span>Final System Prompt Template</span>
            </h3>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
              Complete raw control over the exact system prompt template fed to
              the model. Insert variables to position instructions, context, or
              tools anywhere.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadDefaultTemplate}
              className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-[10.5px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw size={11} />
              <span>Load Standard Template</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10.5px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Eye size={11} />
              <span>{showPreview ? "Hide Preview" : "Live Preview"}</span>
            </button>
          </div>
        </div>

        {/* Variable Pills Toolbar */}
        <div>
          <span className="block text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Click to Insert Variable at Cursor Position
          </span>
          <div className="flex flex-wrap gap-1">
            {VAR_PILLS.map((pill) => (
              <button
                key={pill.label}
                type="button"
                onClick={() => handleInsertVariable(pill.label)}
                className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-500 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer shadow-2xs"
                title={pill.desc}
              >
                + {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* System Prompt Template Textarea */}
        <div className="space-y-1.5">
          <textarea
            ref={textareaRef}
            value={template}
            onChange={(e) =>
              onChangePromptConfig({
                ...promptConfig,
                systemPromptTemplate: e.target.value,
              })
            }
            rows={10}
            placeholder={DEFAULT_SYSTEM_PROMPT_TEMPLATE}
            className="w-full p-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 leading-relaxed"
          />
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>
              Leaving empty will default to standard modular prompt assembly.
            </span>
            <span>{template.length} Characters</span>
          </div>
        </div>

        {/* Live Evaluated Preview Box */}
        {showPreview && (
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-slate-200 text-xs font-mono">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1">
                <FileCode size={12} />
                <span>Interpolated Final Prompt Preview</span>
              </span>
              <span>LIVE OUTPUT</span>
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed text-[11px] text-slate-300 max-h-60 overflow-y-auto pr-1">
              {evaluatePreview()}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

# Agentic Workspace Console v3.0 - Code Architecture & Module Guide

This document provides a comprehensive developer reference for the codebase of **Agentic Workspace Console v3.0**. It details the responsibility, exports, state hooks, and design patterns of every directory and file in the project.

---

## Directory Index

1. [Root Configuration & Build Files](#1-root-configuration--build-files)
2. [Express Backend (`server.ts`)](#2-express-backend-server-ts)
3. [Application Entry & Main Layout (`src/`)](#3-application-entry--main-layout-src)
4. [Types & Data Models (`src/types/`)](#4-types--data-models-srctypes)
5. [Data Constants & Presets (`src/data/`, `src/constants/`)](#5-data-constants--presets-srcdata-srcconstants)
6. [Core Engine & Services (`src/services/`)](#6-core-engine--services-srcservices)
7. [Tool Modules & MCP Registry (`src/tools/`)](#7-tool-modules--mcp-registry-srctools)
8. [Custom React Hooks (`src/hooks/`)](#8-custom-react-hooks-srchooks)
9. [UI Components (`src/components/`)](#9-ui-components-srccomponents)
   - [Root Tab Views](#root-tab-views)
   - [Chat Console Components (`src/components/chat/`)](#chat-console-components-srccomponentschat)
   - [Workspace & File Components (`src/components/workspace/`, `src/components/FileViewer/`)](#workspace--file-components-srccomponentsworkspace-srccomponentsfileviewer)
   - [Agent Management Components (`src/components/agents/`)](#agent-management-components-srccomponentsagents)
   - [Settings & Modal Dialog Components (`src/components/settings/`, `src/components/Dialogs/`)](#settings--modal-dialog-components-srccomponentssettings-srccomponentsdialogs)
10. [Markdown Engine (`src/markdown-engine/`)](#10-markdown-engine-srcmarkdown-engine)
11. [Utilities (`src/utils/`)](#11-utilities-srcutils)

---

## 1. Root Configuration & Build Files

- `package.json`: Project manifest defining dependencies (`openai`, `express`, `react`, `react-markdown`, `katex`, `prismjs`, `motion`, `lucide-react`, `tailwindcss`, `vite`), scripts (`dev`, `build`, `start`, `clean`, `lint`), and Node ESM module target.
- `vite.config.ts`: Vite 6 bundler setup configuring React plugin, Tailwind CSS integration, and dev server proxy settings.
- `tsconfig.json`: TypeScript compiler settings enabling React JSX transform, strict type checking, and ES2022 module resolution.
- `metadata.json`: Application metadata file storing application display name (`Agentic Workspace Console`), description, frame permissions, and major platform capabilities (`MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` required by the hosting sandbox environment).
- `.env`: Template for required environment variables (`OPENAI_API_KEY`, `OPENAI_API_BASE`).
- `index.html`: Main HTML entry point configuring browser viewport and mounting target (`#root`).

---

## 2. Express Backend (`server.ts`)

- **File**: `/server.ts`
- **Role**: Express backend server running on port `3000` (host `0.0.0.0`) providing static asset serving and Vite dev middleware.
- **Key Functions & Features**:
  - `initServer()`: Mounts Vite dev middleware in development or serves compiled static files from `dist/` in production.

---

## 3. Application Entry & Main Layout (`src/`)

- `src/main.tsx`: React DOM mounting script attaching `<App />` to the DOM root.
- `src/index.css`: Global CSS entry file importing `@import "tailwindcss";` and custom animations (`animate-fade-in`).
- `src/App.tsx`: Top-level application component. Manages active tab state (`chat`, `workspace`, `agents`, `settings`), global dark mode theme class toggling, API endpoint state, model dropdown synchronization, toast notifications, and renders the header navigation bar.

---

## 4. Types & Data Models (`src/types/`)

- `src/types/index.ts`: Barrel export re-exporting all interfaces from `agent.ts`, `workspace.ts`, and `markdown.ts`.
- `src/types/agent.ts`: Defines core agent data models:
  - `AgentPermissions`: Allowed tools, allowed read/write paths, character limits, agent calling rights, and folder access flags.
  - `AgentPromptConfig`: System prompt preambles, postambles, file inclusion flags, and custom templates.
  - `Agent`: Complete profile schema for AI agents.
  - `ToolCallStep`: Recursive tool execution state and sub-step logs.
  - `MessagePart`: Interleaved text, thinking, and tool execution blocks.
  - `Message`: Chat message schema containing sender, content, reasoning, thinking time, steps, and parts.
  - `ChatSession`: Multi-thread chat session data model.
- `src/types/task.ts`: Data structures for task-centric execution (`Task`, `TaskStatus`, `TaskResult`, `TaskCreator`, `TaskQueueNode`).
- `src/types/workspace.ts`: Schemas for virtual filesystem items (`WorkspaceItem`) and local directory handles (`LocalFolderConnection`).
- `src/types/markdown.ts`: Types for markdown formatting actions (`FormatType`) and toolbar items.
- `src/types/python.ts`: Types for Python sandbox execution requests, responses, streaming events, and stdout/stderr chunks.
- `src/types.ts`: Legacy centralized export file re-exporting type modules.

---

## 5. Data Constants & Presets (`src/data/`, `src/constants/`)

- `src/data/defaultAgents.ts`: Factory default agent definitions (Manager Agent, Python Developer, Code Architect, Research Analyst, File Organizer).
- `src/data/models.ts`: Static lists of fallback LLM models and provider profiles.
- `src/data/templates.ts`: Starter workspace templates and sample project structures.
- `src/data/cheatsheet.ts`: Markdown reference syntax cheat-sheet data for the help drawer.
- `src/constants/agentPrompts.ts`: Core prompt fragments and default persona instructions.
- `src/constants/initialWorkspace.ts`: Initial workspace seeding files and welcome documents.
- `src/constants/workspacePythonDocs.ts`: Interactive reference documentation string for the `workspace.py` Python library (`workspace.llm`, `workspace.fs`, `workspace.agent`, `workspace.tools`).

---

## 5.1 Python Sandbox Helper Library (`server/python/`)

- `server/python/workspace.py`: Re-export wrapper making `workspace` modules accessible via `import workspace` or `from workspace import llm, fs, agent, tools`.
- `server/python/workspace/__init__.py`: Package initialization file re-exporting `LLMClient`, `Filesystem`, `AgentHelper`, and `ToolHelper`.
- `server/python/workspace/llm.py`: `LLMClient` class providing `generate()`, `chat()`, and `structured()` completions connecting directly to the workspace LLM endpoint.
- `server/python/workspace/fs.py`: `Filesystem` class providing permission-enforced `read()`, `write()`, `append()`, `list()`, `exists()`, and `delete()` methods.
- `server/python/workspace/agent.py`: `AgentHelper` class providing `save_memory()` and `read_memories()` for persistent memory entries.
- `server/python/workspace/tools.py`: `ToolHelper` class providing authorized tool executions (`search_wikipedia`, `read_file`, `write_file`, `list_dir`, `delete_file`, `get_info`, `save_memory`, `run_command`).

---

## 6. Core Engine & Services (`src/services/`)

- `src/services/agentEngine.ts`: Core multi-agent conversation engine (`runAgentConversation`). Orchestrates the agent execution loop, injects persona prompts and memories, streams model responses, limits turn tool execution to 1 tool, handles human confirmation pauses, and manages recursive sub-agent delegation (`call_agent`).
- `src/services/openai.ts`: High-performance OpenAI streaming client adapter (`streamOpenAIChat`). Handles memoized client initialization, SSE delta streaming, reasoning content extraction (`reasoning_content` and `<think>` tags), text-based pseudo tool call parsing (`extractPseudoToolCalls`), and chat context pruning (`pruneChatContext`).
- `src/services/mcp.ts`: Proxy re-export file for Model Context Protocol schemas and execution handlers.
- `src/services/mcpExecutor.ts`: Re-exports tool executor routers and path resolution helpers.
- `src/services/mcpTools.ts`: Re-exports function schemas for built-in tools.
- `src/services/taskEngine.ts`: High-level manager for creating, running, pausing, and resolving multi-agent tasks.
- `src/services/taskQueue.ts`: Priority queue data structure for managing pending agent tasks without call-stack overflow.
- `src/services/pythonRunner.ts`: In-browser Python sandbox engine powered by Pyodide (WebAssembly). Synchronizes workspace virtual filesystem, streams STDOUT/STDERR, and executes code locally.
- `src/services/pythonWorkspaceLib.ts`: Bundled Python helper modules (`workspace` package) injected into Pyodide virtual filesystem.
- `src/services/workspaceApi.ts`: REST and virtual file access client methods for workspace CRUD operations.
- `src/services/agent/contextManager.ts`: Helpers for assembling prompt context chunks and file tree representations.
- `src/services/agent/thinkingChunkHandler.ts`: Stream delta processor for managing reasoning text, thinking block timers, and tool step deltas during active LLM streaming.
- `src/services/agent/thinkingTimer.ts`: Timer utility tracking reasoning duration in milliseconds.

---

## 7. Tool Modules & MCP Registry (`src/tools/`)

- `src/tools/index.ts`: Central registry (`toolRegistry`), schema generator (`getAvailableTools`), and tool dispatcher (`executeTool`). Handles built-in tools and dynamic custom tools in `agent/[agentId]/tools/`.
- `src/tools/types.ts`: TypeScript interfaces for tool execution modules (`ToolModule`, `ToolContext`).
- `src/tools/readFile.ts`: Tool execution handler for `read_file`. Performs path normalization, read permission verification, character limits, and line slicing.
- `src/tools/writeFile.ts`: Tool execution handler for `write_file`. Handles file creation, overwriting, and directory creation.
- `src/tools/listDir.ts`: Tool execution handler for `list_dir`. Scans virtual workspace directories.
- `src/tools/getInfo.ts`: Tool execution handler for `get_info`. Returns file metadata, type, and size.
- `src/tools/deleteFile.ts`: Tool execution handler for `delete_file`. Performs file and directory deletion.
- `src/tools/runPython.ts`: Tool execution handler for `run_python`. Executes Python code in browser via Pyodide.
- `src/tools/searchWikipedia.ts`: Tool execution handler for `search_wikipedia`. Queries Wikipedia REST API.
- `src/tools/callAgent.ts`: Tool execution handler for `call_agent`. Triggers recursive sub-agent conversation loops.
- `src/tools/createAgent.ts`: Tool execution handler for `create_agent`. Dynamically provisions new agent profiles in the workspace.
- `src/tools/saveMemory.ts`: Tool execution handler for `save_memory`. Appends persistent memory strings to `.agents/[agent-id]/memories.txt`.
- `src/tools/listAgents.ts`: Tool execution handler for `list_agents`. Returns active agent catalog.
- `src/tools/customTools.ts`: Custom tool discovery and execution engine (`discoverCustomTools`, `executeCustomTool`).

---

## 8. Custom React Hooks (`src/hooks/`)

- `src/hooks/useWorkspace.ts`: Core workspace state hook. Manages file tree state, CRUD operations, local directory handles via File System Access API, and file uploads.
- `src/hooks/useWorkspaceFiles.ts`: Specialized hook for managing virtual workspace files and local storage synchronization.
- `src/hooks/useAgentSync.ts`: Synchronizes agent profiles between memory state and workspace storage (`.agents/agents.json`).
- `src/hooks/useChatSessions.ts`: Primary hook for chat management. Manages sessions, active agent selection, message streaming, user edits, thread splitting, response regeneration, and human tool approvals.
- `src/hooks/useConnectionCheck.ts`: Periodically checks LLM endpoint status (`/v1/models`) and returns model lists and connection status (`connected`, `checking`, `disconnected`).
- `src/hooks/useAppTheme.ts`: Controls dark/light mode document classes and local storage persistence.
- `src/hooks/useAutoScroll.ts`: Auto-scroll controller for streaming chat output with manual scroll detection.
- `src/hooks/useEditorShortcuts.ts`: Keyboard shortcut listener for code and markdown editors (`Ctrl+S`, `Ctrl+F`, `Tab`).
- `src/hooks/useSearchReplace.ts`: Search and replace state engine for inline text editing.
- `src/hooks/useSplitPane.ts`: Resizable split pane layout hook for editor/viewer panels.
- `src/hooks/useScrollSync.ts`: Dual-viewport synchronized scroll hook for split-pane markdown editing.
- `src/hooks/useExport.ts`: Export utility hook for workspace documents.
- `src/hooks/useTaskManager.ts`: Manages multi-agent background task queue states.
- `src/hooks/agentSyncUtils.ts`: Serialization helpers for writing agent configurations to JSON files.

---

## 9. UI Components (`src/components/`)

### Root Tab Views

- `src/components/chat/ChatTab.tsx`: Primary chat interface layout. Houses `ChatSidebar`, `ChatMessageList`, and `ChatInput`.
- `src/components/workspace/WorkspaceTab.tsx`: File explorer layout housing `FileExplorer`, split editor viewports, formatting toolbar, and help drawers.
- `src/components/agents/AgentsTab.tsx`: Agent management suite housing agent lists, `AgentForm`, `AgentMemoryEditor`, and path permission managers.
- `src/components/settings/SettingsTab.tsx`: Platform settings page housing `VisualSettings` and `SecuritySettings`.

### Chat Console Components (`src/components/chat/`)

- `src/components/chat/ChatSidebar.tsx`: Sidebar displaying session threads, agent profile swapper, and thread creation/deletion controls.
- `src/components/chat/ChatMessageList.tsx`: Smart auto-scrolling message list rendering message items, thinking blocks, and tool step steps.
- `src/components/chat/MessageItem.tsx`: Renders individual user/assistant chat bubbles, edit forms, action buttons (edit, branch, regenerate), and avatars.
- `src/components/chat/ChatInput.tsx`: Prompt textarea supporting file uploads, attachment chips, multiline expansion, and stop generation triggers.
- `src/components/chat/ThinkingBlock.tsx`: Collapsible reasoning component displaying model thinking time and streamed thoughts.
- `src/components/chat/ToolCallStepRenderer.tsx`: Renders execution steps for tool calls, progress bars, and nested sub-agent delegation cards.
- `src/components/chat/AgentActivityRenderer.tsx`: Displays live sub-agent status indicators.
- `src/components/chat/AgentAvatar.tsx`: Agent avatar rendering utility.

### Workspace & File Components (`src/components/workspace/`, `src/components/FileViewer/`)

- `src/components/workspace/WorkspaceTab.tsx`: Primary document workspace component composing split-pane viewports, file navigation, toolbar actions, and help drawers.
- `src/components/workspace/FileExplorer.tsx`: Tree navigator pane for virtual workspace folders and files.
- `src/components/workspace/FileTreeItem.tsx`: Individual row component for files/folders with rename/delete context menus.
- `src/components/workspace/MarkdownEditor.tsx`: Raw markdown text editor.
- `src/components/workspace/MarkdownViewer.tsx`: Rendered markdown viewport.
- `src/components/workspace/python/PythonConsole.tsx`: Terminal console displaying live streaming stdout, stderr, and execution outputs from the Python sandbox.
- `src/components/workspace/python/PythonInputDialog.tsx`: Interactive modal dialog for providing stdin inputs to Python sandbox script executions.
- `src/components/workspace/python/PythonRunButton.tsx`: Action button component triggering sandboxed Python execution.
- `src/components/FileViewer/index.tsx`: Central router component dispatching editors based on file extension.
- `src/components/FileViewer/MarkdownFileEditor.tsx`: Split-view markdown editor and live viewer.
- `src/components/FileViewer/CodeFileEditor.tsx`: Text editor with PrismJS code highlighting and line numbers.
- `src/components/FileViewer/MediaFileViewer.tsx`: Media player for images, GIFs, and videos.
- `src/components/FileViewer/UnknownFileViewer.tsx`: Fallback view for unsupported binary files.

### Agent Management Components (`src/components/agents/`)

- `src/components/agents/AgentForm.tsx`: Tabbed modal form for creating or editing agent profiles.
- `src/components/agents/AgentNormalSettings.tsx`: Form section for agent name, role, avatar, persona instructions, and model override.
- `src/components/agents/AgentPathPermissions.tsx`: Controls for setting allowed read/write paths and file character limits.
- `src/components/agents/AgentAdvancedSettings.tsx`: Advanced prompt assembly settings and starter prompts manager.
- `src/components/agents/AgentMemoryEditor.tsx`: Memory text editor for viewing and editing `.agents/[agent-id]/memories.txt`.

### Layout Components (`src/components/layout/`)

- `src/components/layout/Header.tsx`: Document header toolbar component.
- `src/components/layout/Toolbar.tsx`: Formatting toolbar for Markdown text editing.
- `src/components/layout/HelpDrawer.tsx`: Collapsible side drawer with Markdown cheat-sheets and keyboard shortcuts.
- `src/components/layout/NotificationToast.tsx`: Floating alert toast component for system notifications.
- `src/components/layout/PrintStyle.tsx`: CSS print layout overrides for document exporting.

### Task Visualization Components (`src/components/tasks/`)

- `src/components/tasks/TaskTreeVisualizer.tsx`: Flowchart visualizer rendering multi-agent task trees, execution progress, and step dependencies.

### Settings & Modal Dialog Components (`src/components/settings/`, `src/components/Dialogs/`)

- `src/components/settings/VisualSettings.tsx`: Settings panel for dark mode and markdown visual presets.
- `src/components/settings/SecuritySettings.tsx`: Settings panel for protected tool confirmation rules.
- `src/components/Dialogs/BaseDialog.tsx`: Reusable modal wrapper with backdrop blur and escape key handling.
- `src/components/Dialogs/CreateItemDialog.tsx`: Modal for creating files or folders.
- `src/components/Dialogs/DeleteConfirmDialog.tsx`: Confirmation modal for destructive deletions.
- `src/components/Dialogs/LinkDialog.tsx`: Modal for inserting markdown links.
- `src/components/Dialogs/MediaDialog.tsx`: Modal for embedding images or video URLs.
- `src/components/Dialogs/TableDialog.tsx`: Grid picker modal for inserting markdown tables.

---

## 10. Markdown Engine (`src/markdown-engine/`)

- `src/markdown-engine/index.tsx`: Customized React Markdown renderer using `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`, and `rehype-raw`.
- `src/markdown-engine/styles.ts`: Theme styling helper functions (`getThemeContainerClasses`, `getThemeBackgroundClasses`, `getThemeTextClasses`) for Standard, Serif, Newspaper, Nord, and Tech presets.
- `src/markdown-engine/types.ts`: Markdown theme type definitions.
- `src/markdown-engine/utils/streaming.ts`: Utility for closing unclosed markdown tags during active streaming.
- `src/markdown-engine/components/CodeBlock.tsx`: Syntax-highlighted code block component with copy-to-clipboard button.
- `src/markdown-engine/components/ChecklistItem.tsx`: Interactive GFM task checklist checkbox.
- `src/markdown-engine/components/CustomBlockquote.tsx`: Styled callout quote component.
- `src/markdown-engine/components/CustomTable.tsx`: Scrollable responsive markdown table component.
- `src/markdown-engine/components/CustomImage.tsx`: Responsive image component with zoom overlay.
- `src/markdown-engine/components/CustomVideo.tsx`: Video player component.

---

## 11. Utilities (`src/utils/`)

- `src/utils/promptBuilder.ts`: Assembles system prompts by compiling persona instructions, memory files, workspace folder structure, active files, and formatting guidelines.
- `src/utils/formatter.ts`: Markdown formatting helpers (bold, italic, headers, code, tables, lists).
- `src/utils/theme.ts`: Tailored Tailwind class builders for UI controls.
- `src/utils/safeEnv.ts`: Safe environment variable fallback retriever.
- `src/utils/Styles.tsx`: Dynamic SVG icons and CSS utility components.

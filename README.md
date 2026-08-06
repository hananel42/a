# Multi-Agent Workspace and Sandbox Environment

Welcome to the **Multi-Agent Workspace and Sandbox Environment**, a fully-featured, full-stack development workspace powered by coordinated AI agent networks, virtual sandboxes, and modular developer tooling.

This document provides complete, thorough, and highly detailed technical documentation covering every aspect of the application's design, architecture, implementation details, and core state machines.

---

## 1. Architectural Overview

The application is engineered as a highly responsive, modern, full-stack application. It merges a **React SPA frontend** with a **Node.js/Express backend**, facilitating safe, sandboxed file writing, multi-agent recursive model invocation, and real-time execution outputs.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          REACT FRONTEND (Vite)                         │
│                                                                        │
│  ┌───────────────────────┐  ┌─────────────────────┐  ┌──────────────┐  │
│  │   Workspace Explorer  │  │ Chat & Thought View │  │  Theme & UI  │  │
│  └───────────┬───────────┘  └──────────┬──────────┘  └──────┬───────┘  │
└──────────────┼─────────────────────────┼────────────────────┼──────────┘
               │ File Sync Hooks         │ Agent Invocation   │ CSS Themes
               ▼                         ▼                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         EXPRESS API GATEWAY                            │
│                                                                        │
│  ┌───────────────────────┐  ┌─────────────────────┐  ┌──────────────┐  │
│  │  Workspace File API   │  │   OpenAI API SDK    │  │ Python Exec  │  │
│  └───────────┬───────────┘  └──────────┬──────────┘  └──────┬───────┘  │
└──────────────┼─────────────────────────┼────────────────────┼──────────┘
               ▼                         ▼                    ▼
     Virtual Workspace Disk           LLM Models        Safe Sandbox VM
```

### High-Level Tech Stack

- **Unified Application Theme System**: 7 complete, eye-pleasing application themes (`APP_THEMES` in `src/utils/theme.ts`) unifying the UI canvas, header, file explorer, document editor, and markdown typography into cohesive light and dark styles.
- **Multi-File Tab Workspace Navigation**: Persistent open file tabs bar (`FileTabs.tsx`) supporting quick switching between multiple documents, auto-opening created files, and tab dismissal.
- **Backend**: Express (Node.js), custom middleware, `openai` API Client SDK, and local filesystem endpoints.
- **Data Stores**: Local Storage (chat sessions, active profiles, user configuration persistence) alongside a Virtual Workspace tree managed directly on the server's workspace disk.
- **Sandbox Environment**: In-browser Pyodide WebAssembly sandbox engine performing client-side Python execution, capturing STDOUT/STDERR, and tracking modified files to synchronize changes back into the user's workspace.

---

## 2. Directory Structure

Below is the definitive layout of the codebase, detailing the purpose of each structural folder and file:

```
├── .env                        # Environment variables configurations (OPENAI_API_KEY, OPENAI_API_BASE)
├── README.md                   # Complete system and technical documentation (this file)
├── index.html                  # Main SPA entry point HTML
├── metadata.json               # Application metadata, name, description, and permissions
├── package.json                # Project configuration, scripts, and npm dependencies
├── server.ts                   # Full-stack Express server routing requests, serving assets, and API routes
├── tsconfig.json               # TypeScript compiler configuration
├── vite.config.ts              # Vite configurations
├── docs/                       # Official documentation suite
│   ├── USER_GUIDE.md           # Application User Guide
│   ├── TECHNICAL_ARCHITECTURE.md# Systems Engineering & Architecture Specification
│   └── CODE_DOCUMENTATION.md   # Complete Developer Code & Module Reference
├── server/python/              # Zero-dependency Python helper library injected into sandbox
│   ├── workspace.py            # Re-export wrapper
│   └── workspace/              # Package modules (llm, fs, agent, tools)
└── src/
    ├── App.tsx                 # Main application layout, header bar, active tab routing, and notifications
    ├── index.css               # Global Tailwind CSS directive imports
    ├── main.tsx                # React DOM mounting bootstrap file
    ├── types.ts                # Legacy centralized type re-exports
    ├── components/             # Reusable UI component modules
    │   ├── ChatTab.tsx         # Chat console layout housing chat sidebar, messages, and prompt box
    │   ├── WorkspaceTab.tsx    # Workspace view tab wrapper (re-exports workspace/WorkspaceTab)
    │   ├── AgentsTab.tsx       # Multi-agent workforce management view
    │   ├── SettingsTab.tsx     # Platform settings view (Visual appearance & security rules)
    │   ├── ToolStepRenderer.tsx# Renders active tool execution steps
    │   ├── chat/               # Chat console sub-components (sidebar, messages, thinking block, avatar)
    │   ├── workspace/          # Workspace sub-components (file tree, markdown editor/viewer, python console)
    │   ├── agents/             # Agent management sub-components (form, settings, permissions, memories)
    │   ├── settings/           # Settings panels (VisualSettings, SecuritySettings)
    │   ├── FileViewer/         # Modular file editors and viewers (code, markdown, media, unknown)
    │   ├── Dialogs/            # Accessible modal dialogs (base, create, delete, link, media, table)
    │   ├── layout/             # Layout atoms (header, toolbar, help drawer, toast, print style)
    │   └── tasks/              # Interactive task tree flowchart visualizer
    ├── constants/              # System prompt preambles, initial workspace seeding, and python docs
    ├── data/                   # Default agents, model presets, workspace templates, and cheatsheet
    ├── hooks/                  # React state hooks (useWorkspace, useAgentSync, useChatSessions, etc.)
    ├── markdown-engine/        # Custom Markdown Engine (syntax highlighting, themes, streaming parser)
    ├── services/               # Core engine services (agentEngine, openai, pythonRunner, mcp, taskEngine)
    ├── tools/                  # Tool execution handlers (readFile, writeFile, listDir, runPython, callAgent, etc.)
    ├── types/                  # TypeScript interfaces and schemas (agent, workspace, task, markdown, python)
    └── utils/                  # Prompt builder, formatter, theme helpers, and safe environment utilities
```

---

## 3. Core Mechanics & State Machines

### A. Recursive Multi-Agent Execution Engine

The `agentEngine.ts` file acts as the primary orchestrator of the agentic workforce. When an agent runs:

1. It is fed with its specific persona instructions, workspace details, and current chat history.
2. In a loop, it issues chat completions to the OpenAI-compatible API endpoint.
3. If the model emits `tool_calls`, the engine intercepts them:
   - If the tool requires human confirmation (such as file modifications), it pauses execution, updates the UI to `pending_approval`, and awaits user action.
   - If a tool represents **Sub-Agent Delegation** (`call_agent`):
     - The engine spawns a recursive instance of `runAgentConversation` targeted at the sub-agent profile.
     - The sub-agent's live reasoning (`streamedReasoning`) and live output chunks (`streamedText`) are streamed **in real-time** inside the parent's thought process trace.
     - The parent's step properties (`subSteps`, `streamedText`, `streamedReasoning`) are preserved throughout the sub-agent's execution and continue to be rendered seamlessly in the UI after completion.

### B. Intelligent Auto-Scroll System

Located in `ChatMessageList.tsx`, this system optimizes the streaming UX:

- **Streaming Snap-To-Bottom**: Instead of employing stuttering scroll transitions, the scroll container instantly snaps to the exact bottom when new streaming chunks or reasoning blocks arrive (`scrollRef.current.scrollTop = scrollRef.current.scrollHeight`).
- **Interactive Scroll Lock Release**: The system tracks whether the user manually scrolled away from the stream using a lightweight tracking reference (`autoScrollEnabledRef`). If the user scrolls up by even a few pixels (setting `distanceToBottom >= 60px`), auto-scrolling is instantly paused.
- **Silent Resumption**: When the user scrolls back to the bottom (within `60px` tolerance) or presses the floating "Scroll to Bottom" button, auto-scrolling is automatically and seamlessly reactivated.

### C. Content-Aware Sandbox File Synchronization

Located in `runPython.ts`, the python-runner tool execute process behaves with ultimate precision:

- **Delta-Only Sync**: When the sandbox executes, it analyzes all workspace files. However, the frontend tool compares the contents of returned sandbox files against the existing file state in `context.items`.
- **Pristine Output Reports**: It only updates files that are _genuinely modified_ or _new_, eliminating false-positive sync alerts.
- **Terminal Aesthetics**: The returned output eliminates empty `stderr` messages (e.g. `(no stderr)`) and suppresses long list dumps of untouched workspace files. It only displays STDOUT, actual errors, and a clean list of files that were actually modified or written during execution.

### D. Multi-File Chat Upload Synchronization

The chat panel features a seamless, sandboxed file-upload attachment system:

- **Automatic Target Routing**: Selected files are processed and automatically uploaded into a persistent `/uploads/` folder at the root of the workspace.
- **Real-Time Workspace Synchronization**: Files are written to the virtual/physical workspace tree immediately, and the workspace interface reflects the updates instantly.
- **Agent Notification Alerts**: The upload action automatically dispatches a system alert context in the chat thread, rendering a premium, visually responsive "File Attachment Card" detailing all uploaded files, and informing the active agent of their presence so they are ready for inspection.

### E. Premium Inline Code-Block Styling

The markdown parser features dynamic block detection for code segments lacking explicit language declarations:

- **Visual Highlight**: Encloses un-tagged code segments inside single styled `<pre>` block elements.
- **Consistency**: Harmonizes colors and margins with the theme's default inline-code backgrounds, preventing fragmented, multi-line separation in standard raw code blocks.

---

## 4. Built-in Agent System

The application is pre-loaded with a suite of highly trained, specialized agents ready to collaborate:

| Agent Name           | ID                 | Icon | Role & Capabilities                                                                                                              |
| :------------------- | :----------------- | :--- | :------------------------------------------------------------------------------------------------------------------------------- |
| **Manager Agent**    | `manager-agent`    | 👑   | General coordinator. Excels at breaking down complex goals, creating checklists, and delegating sub-tasks to specialized agents. |
| **Code Architect**   | `code-architect`   | 📐   | Structural designer. Inspects code files, designs clean folder structures, and reviews best practices.                           |
| **Research Analyst** | `research-analyst` | 🔍   | Information gatherer. Uses web search tools to gather specifications, write markdown docs, and perform deep analyses.            |


---

## 5. Tool Specifications & Registries

Agents are equipped with a powerful tool suite defined in `/src/tools/` to interact with the environment:

1. **`read_file`**
   - **Params**: `path` (string, absolute), `startLine` (number, optional), `endLine` (number, optional)
   - **Action**: Reads the contents of a file within the workspace.

2. **`write_file`**
   - **Params**: `path` (string, absolute), `content` (string)
   - **Action**: Creates or overwrites a file in the workspace with specific text content.

3. **`list_dir`**
   - **Params**: `path` (string, optional), `keyword` (string, optional)
   - **Action**: Lists files and folders within a directory.

4. **`run_python`**
   - **Params**: `code` (string)
   - **Action**: Executes python code inside the virtual sandbox workspace, synchronizes changed files back, and returns the STDOUT or STDERR.

5. **`call_agent`**
   - **Params**: `agent-id` (string), `prompt` (string), `resume-id` (string, optional)
   - **Returns**: JSON object with `status` ("completed" | "partial" | "failed"), `id` (conversation ID), and `msg` (summary output).
   - **Action**: Dynamically delegates work to another agent profile or resumes a prior conversation, displaying their recursive trace inside the chat flow.

6. **`web_search`**
   - **Params**: `query` (string)
   - **Action**: Query the web search engine to gather real-time documentation or reference designs.

7. **`create_agent`**
   - **Params**: `name` (string), `description` (string), `instructions` (string), `allowedTools` (string[])
   - **Action**: Dynamic creation of a new specialized sub-agent that is appended to the workspace workforce.

---

## 6. How to Run Locally

To boot up this multi-agent sandbox environment locally:

### Prerequisites

- Node.js 18 or above.

### Steps

1. Clone the repository and navigate into the root directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the application:
   ```bash
   npm run build
   ```
4. Start the full-stack server:
   ```bash
   npm start
   ```
5. Open your browser and navigate to `http://localhost:3000`.

---

_Created and maintained with extreme precision in the Multi-Agent Workspace._

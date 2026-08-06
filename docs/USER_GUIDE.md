# Agentic Workspace Console v3.0 - Application User Guide

The **Agentic Workspace Console v3.0** is an interactive multi-agent workspace and document management environment. It empowers users to collaborate with networks of specialized AI agents, edit code and markdown documents in real time, run sandboxed code, and maintain persistent workspace files.

---

## Table of Contents

1. [Global Layout & Header Controls](#1-global-layout--header-controls)
2. [Chat Console Tab](#2-chat-console-tab)
   - [Chat Sessions & Threads](#chat-sessions--threads)
   - [Selecting & Interacting with Built-In Agents](#selecting--interacting-with-built-in-agents)
   - [File Attachments in Chat](#file-attachments-in-chat)
   - [Model Thinking & Reasoning Traces](#model-thinking--reasoning-traces)
   - [Interactive Tool Execution Steps & Approvals](#interactive-tool-execution-steps--approvals)
   - [Message Editing, Thread Splitting & Response Regeneration](#message-editing-thread-splitting--response-regeneration)
3. [Workspace Tab](#3-workspace-tab)
   - [File Explorer & Directory Tree](#file-explorer--directory-tree)
   - [Local Directory Link (Physical Folder Binding)](#local-directory-link-physical-folder-binding)
   - [Document & Code Editors](#document--code-editors)
   - [Markdown Live Preview & Visual Themes](#markdown-live-preview--visual-themes)
   - [Media & File Viewers](#media--file-viewers)
4. [Agents Management Tab](#4-agents-management-tab)
   - [Viewing & Managing Agents](#viewing--managing-agents)
   - [Creating & Editing Specialized Agents](#creating--editing-specialized-agents)
   - [Path Permissions & Safety Boundaries](#path-permissions--safety-boundaries)
   - [Agent Memory Manager](#agent-memory-manager)
   - [Custom Agent Python Tools](#custom-agent-python-tools)
5. [Platform Settings Tab](#5-platform-settings-tab)
   - [API & Local LLM Connection Config](#api--local-llm-connection-config)
   - [Visual Appearance & Markdown Styling](#visual-appearance--markdown-styling)
   - [Protected Tools Approval Rules](#protected-tools-approval-rules)

---

## 1. Global Layout & Header Controls

The top header bar remains accessible across all sections of the application:

- **Brand Badge**: Displays the application name (`Agentic Hub v3.0`) with an animated indicator.
- **Main Navigation Tabs**: Allows instant switching between:
  - **Chat**: Conversational interface with multi-agent intelligence.
  - **Workspace**: File tree explorer and side-by-side document/code editors.
  - **Agents**: Custom agent creator, persona editor, permissions manager, and memory inspector.
- **Model Dropdown Selector**: Displays all available models returned by the connected LLM endpoint (e.g., local LM Studio models, Ollama models, or cloud models). Selecting a model sets it as the active global default for new chat threads.
- **Connection Status Indicator**:
  - **Online (Green)**: Active connection established with the configured API endpoint.
  - **Pinging (Amber)**: Connection check in progress.
  - **Offline (Red)**: Unable to connect to the configured base URL or API key endpoint. Clicking the indicator manually re-tests the connection.
- **Platform Settings Button**: Gear icon that opens or closes the Settings tab.

---

## 2. Chat Console Tab

The Chat Console is the central operational hub for conversing with AI agents.

### Chat Sessions & Threads

- **Session List**: Located in the left sidebar, listing all active conversation threads sorted chronologically.
- **New Thread Creation**: Click the **New Session** button (`+`) to start a clean thread.
- **Renaming & Deleting Threads**: Hover over any chat session in the sidebar to delete it or view its unique session identifier.
- **Sidebar Toggle**: Collapse the left sidebar to maximize horizontal chat real estate.

### Selecting & Interacting with Built-In Agents

You can route messages to different built-in or user-created agents using the agent selector:

1. **Manager Agent** (`manager-agent`): Coordinates complex requests, builds task checklists, and delegates work to specialized agents.
2. **Python Developer** (`python-developer`): Writes, executes, and debugs algorithmic code inside the sandbox environment.
3. **Code Architect** (`code-architect`): Reviews project architecture, folder structures, and coding patterns.
4. **Research Analyst** (`research-analyst`): Searches external information sources and drafts structured markdown reports.
5. **File Organizer** (`file-organizer`): Scans, cleans, and reorganizes workspace files and directories.

### File Attachments in Chat

- Users can upload files directly into a chat thread by clicking the paperclip icon or dragging files into the prompt box.
- Uploaded files are automatically saved to the workspace under `/uploads/`.
- An interactive **Attachment Card** is displayed in the chat context so the agent is notified of the file paths and can inspect them using file reading tools.

### Model Thinking & Reasoning Traces

- For models supporting reasoning (e.g., DeepSeek R1, OpenAI o-series, or local thinking models), the console displays a dedicated **Thinking Block**.
- Displays real-time streaming reasoning text, active duration timer (in seconds), and collapsible expansion controls.
- When collapsed, the trace shows a subtle summary badge indicating total thinking duration.

### Interactive Tool Execution Steps & Approvals

When an agent takes action in the workspace, execution steps appear dynamically in the chat stream:

- **Tool Cards**: Show tool name (`read_file`, `write_file`, `run_python`, `list_dir`, `call_agent`, etc.), input parameters, and execution status (`running`, `success`, `error`, `pending_approval`, `cancelled`).
- **Sub-Agent Delegation Cards**: When an agent delegates sub-tasks using `call_agent`, a nested execution card appears inside the chat stream showing the sub-agent's live reasoning trace and response output in real time.
- **Human-in-the-Loop Approval Dialog**: If a tool is flagged as protected (e.g., executing Python scripts, modifying files, or creating new agents), execution pauses. An interactive approval prompt presents the user with **Approve Execution** or **Reject Execution** buttons before any disk changes occur.

### Message Editing, Thread Splitting & Response Regeneration

- **Message Editing**: Hover over any past user prompt and click **Edit** to modify the query and re-run the conversation from that point onward.
- **Branch/Split Thread**: Click the **Split Thread** button on any message to create a new independent branch session starting from that exact point in history.
- **Regenerate Response**: Click **Regenerate** to re-trigger the agent for the latest user prompt.
- **Stop Generation**: Click **Stop Streaming** to halt long-running agent streams or execution loops immediately.

---

## 3. Workspace Tab

The Workspace tab provides a complete file system browser, markdown studio, code editor, and media preview workspace.

### File Explorer & Directory Tree

- **Hierarchical Tree View**: Expand and collapse folders, inspect files, and see real-time updates when agents create or edit workspace files.
- **File & Folder Operations**: Create new files or folders, rename items, and delete items with confirm dialogs.
- **Drag-and-Drop Import**: Drag files from your desktop directly into the file tree to add them to your workspace.
- **Download Files**: Download any file directly to your local computer.

### Local Directory Link (Physical Folder Binding)

- Click **Link Local Directory** to mount a physical folder from your host computer using browser File System Access APIs.
- Changes made by agents or user editors sync directly with your physical host directory.

### Document & Code Editors

- **Code Editor**: Provides syntax highlighting for Python, JavaScript, TypeScript, HTML, CSS, JSON, SQL, Shell, C++, Java, Rust, Go, and YAML. Includes line numbers, search and replace bar, keyboard shortcuts, and auto-indentation.
- **Markdown Editor**: Equipped with a full formatting toolbar (bold, italic, headings, blockquotes, code blocks, tables, lists, links, images, video embeds).

### Markdown Live Preview & Visual Themes

Choose between multiple rendered Markdown themes:

1. **Standard**: Modern slate layout with clean sans-serif typography.
2. **Serif**: Elegant editorial layout with serif body fonts.
3. **Newspaper**: Classic print journal style with high-contrast rules.
4. **Nord**: Cool arctic palette with dark indigo accents.
5. **Tech**: Terminal-inspired monospace aesthetics.

Supports full **GFM (GitHub Flavored Markdown)** including interactive task checklists, tables, raw HTML rendering, and **KaTeX LaTeX math formulas** (inline `$e^{i\pi} + 1 = 0$` and display math blocks).

### Media & File Viewers

- **Image & GIF Viewer**: Displays PNG, JPG, GIF, WebP, SVG, ICO, and BMP files with dimensions and file size.
- **Video Player**: Plays MP4, WebM, OGG, and MOV video clips inline.
- **Unknown File Fallback**: Displays file metadata with options to force-open as plain text or download.

---

## 4. Agents Management Tab

The Agents tab gives users complete control over creating, configuring, and governing the AI workforce.

### Viewing & Managing Agents

- View a grid or list of all active agents, distinguishing built-in system agents from custom user-created agents.
- Search agents by name or role description.

### Creating & Editing Specialized Agents

Click **Create New Agent** to configure a custom agent with:

- **Agent Name & Identifier**: Unique display name and system key.
- **Avatar & Role Description**: Select an emoji/icon and short role summary.
- **System Instructions (Persona)**: Detailed prompt defining how the agent behaves, reasons, and responds.
- **Model Override**: Assign a specific default LLM model override for this agent (e.g., forcing a research agent to use a reasoning model).
- **Allowed Tools**: Select which tools this agent can run (`read_file`, `write_file`, `list_dir`, `get_info`, `delete_file`, `run_python`, `search_wikipedia`, `call_agent`, `create_agent`, `save_memory`, `list_agents`).
- **Starter Prompts**: Define custom starter prompt chips displayed when starting a chat with this agent.

### Path Permissions & Safety Boundaries

Fine-tune folder access rights for each agent:

- **Allowed Read Paths**: Whitelist specific directory paths the agent is permitted to read (e.g., `/docs` or `/public`).
- **Allowed Write Paths**: Whitelist specific directory paths the agent is permitted to write or delete.
- **Max File Read Character Limit**: Cap the maximum number of characters an agent can read in a single `read_file` call to protect context windows.
- **Max Directory Items Limit**: Limit directory scan outputs to prevent context pollution.
- **Agent Folder Access**: Toggle whether non-admin agents can inspect internal `.agents/` workspace configurations.

### Agent Memory Manager

- Inspect and edit persistent long-term memories stored for each agent in `.agents/[agent-id]/memories.txt`.
- Memories are automatically injected into the agent's system prompt during conversation turns.

### Custom Agent Python Tools & Workspace Python API

- Users or Admin agents can build and deploy custom Python tools inside `/.agents/[agent-id]/tools/[tool_name]/`.
- Each custom tool consists of `tool.json` (defining input properties and descriptions) and `script.py` (execution logic).
- **Built-in `workspace` Python Library**: All Python scripts and custom tools running in the sandbox automatically have access to the zero-dependency `workspace` library:
  - `from workspace import llm, fs, agent, tools`
  - **`llm`**: Perform nested LLM text generation (`llm.generate`), multi-turn chat (`llm.chat`), or schema-bound structured JSON generation (`llm.structured`).
  - **`fs`**: Read and write files with automatic agent permission checks (`fs.read`, `fs.write`, `fs.list`, `fs.delete`).
  - **`agent`**: Access active agent information (`agent.get_id`) and save memories (`agent.save_memory`).
  - **`tools`**: Execute Wikipedia research (`tools.search_wikipedia`), run sub-commands (`tools.run_command`), or format logs (`tools.log`).

---

## 5. Platform Settings Tab

The Platform Settings tab manages model endpoints, UI preferences, and safety rules.

### API & Local LLM Connection Config

- **API Base URL**: Set your target LLM endpoint (e.g., `http://localhost:1234/v1` for LM Studio, `http://localhost:11434/v1` for Ollama, or remote OpenAI-compatible gateways).
- **API Key**: Input your secret key (stored safely in browser local storage).
- **Model Selection**: Choose your default active model.
- **Test Connection**: Instant re-check button to verify connectivity.

### Visual Appearance & Markdown Styling

- **Dark / Light Mode**: Toggle dark workspace mode (twilight navy canvas) or light mode.
- **Default Markdown Theme**: Choose default preview preset (Standard, Serif, Newspaper, Nord, Tech).

### Protected Tools Approval Rules

- Customize which tools trigger the **Human-in-the-Loop Confirmation Dialog** before execution (`run_python`, `write_file`, `delete_file`, `create_agent`).

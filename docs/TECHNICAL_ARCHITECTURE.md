# Agentic Workspace Console v3.0 - Technical Architecture Specification

This document provides a technical specification of the underlying system architecture, data protocols, background processes, security mechanisms, and execution loops of **Agentic Workspace Console v3.0**.

---

## Table of Contents

1. [System Topography & Full-Stack Architecture](#1-system-topography--full-stack-architecture)
2. [Multi-Agent Conversation & Sub-Task Execution Engine](#2-multi-agent-conversation--sub-task-execution-engine)
3. [Model Context Protocol (MCP) & Dynamic Tool Execution Engine](#3-model-context-protocol-mcp--dynamic-tool-execution-engine)
4. [Python Sandbox Execution VM & File Sync Engine](#4-python-sandbox-execution-vm--file-sync-engine)
5. [Context Compiler Engine & Token Window Pruning](#5-context-compiler-engine--token-window-pruning)
6. [Stream Extraction & Reasoning Parser Protocol](#6-stream-extraction--reasoning-parser-protocol)
7. [Persistence & Workspace Synchronization Protocol](#7-persistence--workspace-synchronization-protocol)

---

## 1. System Topography & Full-Stack Architecture

The system operates as a hybrid full-stack application binding a client-side execution container with a Node.js/Express backend environment.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT RUNTIME                                │
│                                                                         │
│   ┌────────────────────┐   ┌───────────────────┐   ┌────────────────┐   │
│   │ Agent Orchestrator │   │ Dynamic Workspace │   │ Persistence &  │   │
│   │   (agentEngine)    │   │ File System Tree  │   │ LocalStorage   │   │
│   └─────────┬──────────┘   └─────────┬─────────┘   └───────┬────────┘   │
└─────────────┼────────────────────────┼─────────────────────┼────────────┘
              │ SSE / HTTP Stream      │ Virtual Disk Sync   │ Local Hydration
              ▼                        ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       EXPRESS BACKEND GATEWAY                           │
│  [Host: 0.0.0.0 | Port: 3000 | Static SPA & Vite Middleware]             │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ Browser Runtime
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       PYODIDE WEBASSEMBLY SANDBOX                       │
│                                                                         │
│   ┌────────────────────┐   ┌───────────────────┐   ┌────────────────┐   │
│   │ Virtual Emscripten │   │ Pyodide WebAssembly│   │ React State    │   │
│   │ /workspace FS      │   │ Python Runtime    │   │ File Sync Engine│   │
│   └────────────────────┘   └───────────────────┘   └────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Constraints

- **Network Binding**: All server endpoints bind to host `0.0.0.0` on hardcoded port `3000`.
- **Static File Proxying**: Express serves compiled SPA assets in production mode and mounts Vite dev middleware during development.
- **Dual Execution Runtime**: JavaScript/TypeScript handles agent turn orchestration, context building, and tool routing; native system binaries (`python3` / `python` / `node`) run sandboxed scripts.

---

## 2. Multi-Agent Conversation & Sub-Task Execution Engine

The agent execution pipeline (`runAgentConversation`) manages sequential turn loops, tool invocation, and recursive sub-agent delegation.

### Execution Loop State Machine

1. **Context Initialization**:
   - Compiles persona instructions, active memory files (`.agents/[agent-id]/memories.txt`), workspace directory tree representation, and active chat history.
2. **Model Request Dispatch**:
   - Streams completion tokens from the configured OpenAI-compatible endpoint (OpenAI, DeepSeek, Ollama, LM Studio, or any /v1 endpoint).
3. **Turn Constraint Enforcement**:
   - **Single-Tool Turn Rule**: The engine strictly limits execution to **1 tool call per turn** to preserve state determinism and prevent race conditions.
   - **Maximum Loop Bound**: Re-entry is bounded to a maximum of 8 sequential turns per prompt execution to prevent infinite model recursion.
4. **Sub-Agent Delegation Stack (`call_agent`)**:
   - When an agent invokes `call_agent(agent-id, prompt, resume-id)`:
     a. The engine resolves the target agent profile by ID or name.
     b. Checks if `resume-id` exists in sub-agent histories to restore previous conversation context.
     c. Spawns a recursive `runAgentConversation` child instance.
     d. Streams live text chunks, tool execution steps, and reasoning deltas from the sub-agent into the parent step's execution trace.
     e. Returns a structured JSON result (`{ status, id, msg }`) back to the parent agent context upon completion.

---

## 3. Model Context Protocol (MCP) & Dynamic Tool Execution Engine

Tools are defined as function schemas adhering to OpenAI function-calling specifications and executed through a centralized dispatch runtime.

### Tool Catalog & Security Specifications

| Tool Name          | Parameters                                                 | Security Boundary & Enforcement                                                                                |
| :----------------- | :--------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| `read_file`        | `path`, `startLine`, `endLine`                             | Path permission check (`allowedReadPaths`), path normalization, max character truncation (`maxFileReadChars`). |
| `write_file`       | `path`, `content`                                          | Path permission check (`allowedWritePaths`), automated parent folder creation, virtual tree update.            |
| `list_dir`         | `path`, `keyword`                                          | Directory path permission check (`allowedReadPaths`), max item count truncation (`maxDirItems`).               |
| `get_info`         | `path`                                                     | Validates file existence, metadata extraction, size computation.                                               |
| `delete_file`      | `path`                                                     | Path permission check (`allowedWritePaths`), recursive folder/file deletion.                                   |
| `run_python`       | `code`, `filePath`, `inputs`                               | In-browser Pyodide WebAssembly sandbox execution.                                                |
| `search_wikipedia` | `query`                                                    | External Wikipedia API query.                                                                                  |
| `call_agent`       | `agent-id`, `prompt`, `resume-id`                           | Permission check (`canCallAllAgents`), recursive engine invocation.                                            |
| `create_agent`     | `name`, `description`, `instructions`, `allowedTools`, ... | Dynamic profile validation, storage under workspace `.agents/` directory.                                      |
| `save_memory`      | `agentId`, `memory`                                        | Appends text entries to `.agents/[agent-id]/memories.txt`.                                                     |
| `list_agents`      | _None_                                                     | Returns catalog of active agent profiles.                                                                      |

### Dynamic Custom Python Tool Discovery Protocol

- The engine scans the workspace filesystem for directories matching `agent/[agent-id]/tools/[tool_name]/`.
- Expects `tool.json` (schema definition: name, description, parameters) and `script.py` (execution logic).
- Dynamically registers custom tools into the active agent's function-calling toolset and executes them inside the Python sandbox upon invocation.

### Path Permission Validator (`isPathAllowed`)

- All file path arguments are normalized by stripping leading/trailing slashes.
- Compares normalized target paths against the agent's `allowedReadPaths` and `allowedWritePaths` arrays.
- Root path `'/'` or empty array grants full workspace access.
- Protects internal `.agents/` folder unless `allowAgentFolderAccess` is explicitly granted.

---

## 4. Python Sandbox Execution VM & File Sync Engine

The Python sandbox service executes arbitrary python code in complete isolation from the main server process, automatically injecting a zero-dependency Python API helper module (`workspace.py` / `agent_workspace.py`) into every sandbox instance.

```
                    ┌───────────────────────────────┐
                    │ Client POST /api/run-python   │
                    │ Payload: code, inputs, files, │
                    │ envVars (keys, base URL, perms)│
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  Backend fs.mkdtemp()         │
                    │  Creates: /tmp/agent-py-XXXX  │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ Recreate Workspace Hierarchy  │
                    │ Inject workspace.py &         │
                    │ agent_workspace.py helpers    │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ Spawn exec("python3 script.py")│
                    │ Timeout: 15,000ms | envVars   │
                    └───────────────┬───────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            ▼                                               ▼
   [Process Succeeded]                             [Binary Missing / Fallback]
  Capture STDOUT & STDERR                         Execute JS Evaluator Fallback
            │                                               │
            └───────────────────────┬───────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ Read Sandbox Disk State       │
                    │ Scan changed/new text files   │
                    │ (Excludes script & helper py) │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ Remove /tmp/agent-py-XXXX     │
                    │ Return stdout, stderr, diff   │
                    └───────────────────────────────┘
```

### Injected Python Workspace API (`workspace.py` / `agent_workspace.py`)

Every Python script running inside the sandbox can immediately import the helper module:

- **`import workspace`** or **`from workspace import llm, fs, agent, tools`**
- **`workspace.llm`**:
  - `llm.generate(prompt, system=None, model=None, temperature=0.7)`: Generates text responses.
  - `llm.chat(messages, model=None, temperature=0.7)`: Multi-turn chat completion.
  - `llm.structured(prompt, schema=None, system=None)`: Returns parsed JSON objects matching an expected schema.
- **`workspace.fs`**:
  - `fs.read(path)`, `fs.write(path, content)`, `fs.append(path, content)`, `fs.list(path)`, `fs.exists(path)`, `fs.delete(path)`: File operations with automatic agent path permission validation (`AGENT_PERMISSIONS`).
- **`workspace.agent`**:
  - `agent.get_id()`: Returns active agent ID (`AGENT_ID`).
  - `agent.save_memory(text)`: Appends memory entries to `.agents/[agent-id]/memories.txt`.
- **`workspace.tools`**:
  - `tools.search_wikipedia(query, limit=3)`: Performs Wikipedia search.
  - `tools.run_command(cmd)`: Runs sub-shell commands.
  - `tools.log(*args)`: Timestamped console logging.

### Sandbox Execution Steps

1. **Isolated Temp Directory Creation**: `fs.mkdtemp` generates a unique, isolated OS temporary folder (`/tmp/agent-py-XXXX`).
2. **Virtual Workspace Materialization**: The flat virtual file tree passed in the HTTP request payload is projected onto the physical disk inside the temporary directory.
3. **Execution & Fallback Pipeline**:
   - Executes `python3 -u script.py` with a 15-second process timeout limit.
   - If `python3` is missing, falls back to `python`.
   - If Python binaries are absent in the host container, falls back to an internal JS evaluation engine.
4. **Post-Execution State Diffing**:
   - Recursively scans the sandbox folder using `readSandboxState`.
   - Compares disk state against pre-execution state, excluding binary assets and the temporary script file.
   - Transmits modified text files back to the client to update the virtual workspace tree.
5. **Sandbox Lifecycle Cleanup**: Permanently deletes the temporary directory and all created files.

---

## 5. Context Compiler Engine & Token Window Pruning

To maintain context window constraints while preserving system persona integrity, the system utilizes a Context Compiler Engine.

### System Prompt Assembly Sequence

1. **Role Preamble & Base Instructions**: Injects agent persona instructions and custom role preambles.
2. **Path Access Rights Summary**: Injects active permission boundaries (`allowedReadPaths`, `allowedWritePaths`, read character limits).
3. **Workspace Folder Tree Inclusion**: If enabled in `promptConfig.includeWorkspaceTree`, generates a text-based ASCII tree of the workspace structure.
4. **Active Workspace Files Injection**: Includes active workspace file paths and contents (subject to character caps).
5. **Agent Memory Integration**: Injects accumulated entries from `.agents/[agent-id]/memories.txt`.
6. **Formatting Constraints & Custom Instructions**: Appends Markdown formatting rules and user-defined postambles.

### Dynamic Context Pruning (`pruneChatContext`)

- Prevents context window overflows during long conversations.
- **Algorithm**:
  - Preserves all `system` role prompts.
  - Identifies a safe cut point near the `maxMessages` boundary (default: 15 messages) by seeking a `user` role message.
  - Ensures tool call pairs (`assistant tool_calls` and `tool` responses) are never orphaned or truncated mid-pair.
  - Injects a context truncation notification note into the payload (`[System Note: Older messages compressed...]`).

---

## 6. Stream Extraction & Reasoning Parser Protocol

The system parses incoming Server-Sent Events (SSE) and LLM streaming chunks to separate reasoning traces, text responses, and tool call deltas.

### Reasoning Stream Extraction

- **Native Reasoning Fields**: Intercepts `delta.reasoning_content`, `delta.reasoning`, and `delta.thought` (emitted by DeepSeek R1, OpenAI o1/o3, OpenRouter, and local vLLM endpoints).
- **Tag-Based Thinking Extraction**: Detects inline `<think>` ... `</think>` XML tag boundaries in raw content streams.
- **Pseudo Tool Extraction (`extractPseudoToolCalls`)**: Parses text-based tool calls embedded inside XML tags (e.g., `<tool_name>{...}</function>`) when models output tool calls as text rather than native API function calls.

### Chronological Message Part Architecture

Messages store content as an array of `MessagePart` objects to maintain strict chronological order:

- **`text` Part**: Standard markdown text response.
- **`thinking` Part**: Holds accumulated reasoning text, start timestamp, duration in milliseconds (`thinkingTimeMs`), and nested tool execution steps.
- **`tool` Part**: Holds reference to a `ToolCallStep` object containing execution arguments, status, streamed sub-agent outputs, and final stdout/stderr.

---

## 7. Persistence & Workspace Synchronization Protocol

The application maintains data state across browser sessions and host filesystem mounts.

### State Persistence Strategy

| Data Domain                 | Storage Mechanism                  | Key Namespaces                                                                               |
| :-------------------------- | :--------------------------------- | :------------------------------------------------------------------------------------------- |
| **API & Model Config**      | Browser `localStorage`             | `agent_hub_openai_key`, `agent_hub_api_base_url`, `agent_hub_model`, `agent_hub_temperature` |
| **UI & Theme Rules**        | Browser `localStorage`             | `agent_hub_dark_mode`, `agent_hub_preview_style`, `agent_hub_confirm_tools`                  |
| **Chat Sessions & History** | Browser `localStorage`             | `agent_hub_chat_sessions`, `agent_hub_active_session`                                        |
| **Custom Agents Catalog**   | Workspace Virtual Disk             | `.agents/agents.json`                                                                        |
| **Agent Memories**          | Workspace Virtual Disk             | `.agents/[agent-id]/memories.txt`                                                            |
| **Workspace File System**   | Virtual Memory State + Server Disk | Synced via `/api/run-python` & File System Access API                                        |

### Host Directory Binding (File System Access API)

- Uses native browser `showDirectoryPicker()` handles when available.
- Recursively reads host filesystem handles and maps them into `WorkspaceItem` structures.
- Propagates virtual file modifications back to host files via native `FileSystemFileHandle.createWritable()` streams.

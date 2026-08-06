# Platform Services Layer (`/src/services/`)

This directory provides external integrations, storage engines, execution orchestration, and background processing utilities. It isolates network logic, LLM streaming adapters, Python sandbox communications, task queues, and local/virtual workspace disk synchronization.

## Core Services & Modules

- `agentEngine.ts`: Core Multi-Agent Execution Engine (`runAgentConversation`). Orchestrates turn loops, streams reasoning and text tokens, limits turn tool execution to 1 tool, handles human confirmation pauses, and manages recursive sub-agent delegation (`call_agent`).
- `openai.ts`: High-performance OpenAI streaming client adapter (`streamOpenAIChat`). Handles SSE delta streaming, reasoning content extraction (`reasoning_content` and `<think>` tags), text-based pseudo tool call parsing, and chat context pruning.
- `pythonRunner.ts`: In-browser Python sandbox execution engine powered by Pyodide (WebAssembly). Synchronizes workspace virtual filesystem, streams STDOUT/STDERR, and executes Python code locally.
- `pythonWorkspaceLib.ts`: Bundled Python helper modules (`workspace` package) injected into Pyodide virtual filesystem.
- `workspaceApi.ts`: REST and File System Access API client wrapper for workspace CRUD operations, physical folder binding, file reading, and writing.
- `taskEngine.ts`: Multi-agent task manager for creating, tracking, and resolving multi-step agent tasks.
- `taskQueue.ts`: Priority queue data structure for scheduling pending agent tasks safely.
- `mcp.ts`: Unified entry point re-exporting Model Context Protocol tools, executors, and schema utilities.
- `mcpExecutor.ts`: Tool execution router translating agent instructions into sandboxed file operations, Python calculations, or sub-agent calls.
- `mcpTools.ts`: Standard JSON schemas for all built-in tools.
- `agent/contextManager.ts`: Utility helpers for assembling prompt context chunks, file tree representations, and system instructions.
- `agent/thinkingChunkHandler.ts`: Stream delta processor managing reasoning text, thinking block timers, and tool step deltas during active LLM streaming.
- `agent/thinkingTimer.ts`: Precision active timer utility for tracking model reasoning duration in milliseconds.


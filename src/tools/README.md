# Agent Tools Registry (`/src/tools/`)

Contains function schemas, permission checks, and execution handlers for agent tools operating on the virtual workspace and sandbox environment.

## File Registry

- `index.ts`: Central tool registry (`toolRegistry`), available tools generator (`getAvailableTools`), and tool dispatcher (`executeTool`). Handles built-in tools and dynamic custom workspace tools.
- `types.ts`: Interfaces for tool modules (`ToolModule`) and execution context (`ToolContext`).
- `readFile.ts`: Tool execution handler for `read_file`. Performs path normalization, permission checks, character limit enforcement, and line slicing.
- `writeFile.ts`: Tool execution handler for `write_file`. Creates or overwrites workspace files and auto-creates parent folders.
- `listDir.ts`: Tool execution handler for `list_dir`. Lists directory contents with keyword filtering.
- `getInfo.ts`: Tool execution handler for `get_info`. Extracts file metadata, size, and type information.
- `deleteFile.ts`: Tool execution handler for `delete_file`. Performs recursive file and folder deletion.
- `runPython.ts`: Tool execution handler for `run_python`. Executes Python scripts directly in the browser via Pyodide.
- `searchWikipedia.ts`: Tool execution handler for `search_wikipedia`. Queries Wikipedia's MediaWiki API, parsing rich HTML with DOMParser to cleanly convert headers, nested lists, and structured tabular data (including infoboxes) into beautifully formatted Markdown.
- `callAgent.ts`: Tool execution handler for `call_agent`. Triggers recursive sub-agent conversation loops with `agent-id`, `prompt`, and optional `resume-id`, returning structured `{ status, id, msg }` JSON. Supports advanced multi-tasking and recursive self-calling context-preservation tactics.
- `createAgent.ts`: Tool execution handler for `create_agent`. Dynamic creation of new agent profiles.
- `saveMemory.ts`: Tool execution handler for `save_memory`. Appends persistent memory text entries to `.agents/[agent-id]/memories.txt`.
- `listAgents.ts`: Tool execution handler for `list_agents`. Returns the active agent catalog.
- `customTools.ts`: Discovery and execution engine for workspace custom Python tools (`agent/[agent-id]/tools/[tool-name]/`).

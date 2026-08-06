# React Hooks Directory (`/src/hooks/`)

This directory houses reusable custom React state manager hooks. These hooks implement complex business logic, background loops, and browser system bindings while remaining completely isolated from presentation details.

## Hook Catalog

- `useWorkspace.ts`: Manages flat/nested file explorer records, creates virtual documents, triggers dropped file uploads, and connects to physical directories via directory handles.
- `useAgentSync.ts`: Synchronizes AI agent settings, creates custom profiles, and updates underlying metadata files (e.g., `agent.md`, `permissions.json`) in the sandbox environment.
- `useChatSessions.ts`: Manages thread lifecycle states, saves conversations to local storage, and handles branches or inline edits.
- `useConnectionCheck.ts`: Executes asynchronous ping-checks against the configured LLM API endpoint to detect offline/online states.
- `useExport.ts`: Compiles document layouts, processes styles, and formats items for instant ZIP downloads or clipboard exports.

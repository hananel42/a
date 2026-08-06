# Agent Profile Directory Components (`/src/components/agents/`)

Contains UI views related to multi-agent catalog listings, new profile provisioning, persona instructions editing, path permissions management, and memory inspection.

## Component Registry

- `AgentForm.tsx`: Primary tabbed modal form container for creating or editing agent profiles (Normal Settings, Path Permissions, Advanced Prompt Settings, Memory Inspection).
- `AgentNormalSettings.tsx`: Form section for setting agent identity, name, role, avatar icon, system prompt persona instructions, and model override.
- `AgentPathPermissions.tsx`: Controls for setting allowed read/write file paths, character limits, agent calling rights, and folder access flags.
- `AgentAdvancedSettings.tsx`: Advanced prompt assembly configuration (preambles, postambles, workspace file inclusion flags) and starter prompt manager.
- `AgentMemoryEditor.tsx`: Memory inspector and editor for viewing and editing persistent agent memory logs stored in `.agents/[agent-id]/memories.txt`.


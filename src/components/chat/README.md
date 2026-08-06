# Chat Sub-module Components (`/src/components/chat/`)

This sub-folder houses all React presentation layers dedicated to chat messaging, active threads, and model evaluations.

## Component Registry

- `ChatSidebar.tsx`: Left sidebar containing current profile descriptors, filtered chat threads, and backup control handlers.
- `ChatMessageList.tsx`: High-performance chat messages grid. Includes custom typing loaders, branching anchors, and tool block widgets.
- `ToolCallStepRenderer.tsx`: Interactive sandboxed step logs displaying active shell calculations or Python execution parameters with direct manual click-to-approve states.

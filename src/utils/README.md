# Utilities Directory (`/src/utils/`)

Contains prompt synthesis builders, markdown formatting helpers, theme class generators, and environment variable fallbacks.

## File Registry

- `promptBuilder.ts`: System prompt compiler (`buildAgentSystemPrompt`). Assembles persona instructions, active memories, workspace directory tree state, active files, and formatting guidelines.
- `formatter.ts`: Helper functions for applying Markdown text formatting (bold, italic, headers, blockquotes, code blocks, tables, lists).
- `theme.ts`: Tailored Tailwind CSS class builder functions for UI controls.
- `safeEnv.ts`: Safe environment variable retriever with graceful fallbacks.
- `Styles.tsx`: Utility CSS components and dynamic SVG icon helpers.

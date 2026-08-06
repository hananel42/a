# Workspace UI Components Directory (`/src/components/workspace/`)

Contains UI components powering the primary document workspace tab, filesystem explorer tree, markdown editor, live preview viewport, and sandboxed Python execution controls.

## Component Registry

- `WorkspaceTab.tsx`: Primary document workspace component composing split-pane viewports, file navigation, toolbar actions, and help drawers.
- `FileExplorer.tsx`: Tree navigator pane displaying virtual workspace folders and files with search filtering.
- `FileTreeItem.tsx`: Individual row component for files and folders with context action menus (rename, delete, duplicate).
- `MarkdownEditor.tsx`: Monospace raw Markdown text editor with search-and-replace, line numbers, and keyboard shortcuts.
- `MarkdownViewer.tsx`: Rendered Markdown viewport integration using the custom Markdown Engine.
- `python/PythonConsole.tsx`: Integrated terminal console displaying live streaming stdout, stderr, and execution outputs from the Python sandbox.
- `python/PythonInputDialog.tsx`: Interactive dialog for providing stdin text inputs to Python sandbox executions.
- `python/PythonRunButton.tsx`: Action button component triggering sandboxed Python execution.
- `index.ts`: Barrel export re-exporting workspace components.

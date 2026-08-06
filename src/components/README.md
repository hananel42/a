# Presentation Components Directory (`/src/components/`)

This directory comprises all React UI presentation modules, view tabs, modal dialogs, and workspace tools. The codebase is organized into primary tab views, modular subdirectories, and backward-compatible barrel re-exports.

## Root Tab Views & Components

- `ChatTab.tsx`: Main chat console layout composing the chat sidebar, message list, thinking blocks, and prompt input.
- `WorkspaceTab.tsx`: Re-exports `workspace/WorkspaceTab` for backwards compatibility.
- `AgentsTab.tsx`: Primary multi-agent workforce manager view.
- `SettingsTab.tsx`: Platform configurations view housing visual appearance settings and protected tool confirmation rules.
- `ToolStepRenderer.tsx`: Rendering container for active tool call execution steps.

## Modular Subdirectories

- `/chat/`: Active chat session sidebar, message list, thinking blocks, tool call step renderers, agent avatars, and agent activity indicators.
- `/workspace/`: Filesystem tree explorer, file tree items, markdown editor, rendered markdown viewer, and workspace tab views (`python/` console and run buttons).
- `/agents/`: Agent profile management form, normal settings, path permissions editor, advanced prompt settings, and memory editor.
- `/settings/`: Platform security settings and visual appearance configuration panels.
- `/Dialogs/`: Reusable modal dialogs (BaseDialog, CreateItemDialog, DeleteConfirmDialog, LinkDialog, MediaDialog, TableDialog).
- `/FileViewer/`: Modular file editors and viewers (CodeFileEditor, MarkdownFileEditor, MediaFileViewer, UnknownFileViewer).
- `/layout/`: Shared header bar, toolbar, help drawer, notification toast, and print styles.
- `/tasks/`: Interactive task tree flowchart visualizers.

## Backward-Compatibility Barrels

For seamless backward compatibility across older import paths, the following root components re-export from their respective modular subdirectories:
`Dialogs.tsx`, `FileExplorer.tsx`, `Header.tsx`, `HelpDrawer.tsx`, `MarkdownEditor.tsx`, `MarkdownViewer.tsx`, `NotificationToast.tsx`, `PrintStyle.tsx`, `Toolbar.tsx`, `WorkspaceTab.tsx`.


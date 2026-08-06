# Dialog Components Directory (`/src/components/Dialogs/`)

Contains accessible, theme-aware modal dialog components built for user prompts, item creations, deletions, and markdown element insertions.

## Component Registry

- `BaseDialog.tsx`: Core accessible dialog wrapper handling backdrop blur, escape key handling, click-outside dismissal, and transitions.
- `CreateItemDialog.tsx`: Modal dialog for creating new files or folders in the workspace.
- `DeleteConfirmDialog.tsx`: Confirmation dialog for destructive file, folder, or thread deletion actions.
- `LinkDialog.tsx`: Dialog for inserting formatted Markdown hyperlink targets.
- `MediaDialog.tsx`: Dialog for embedding remote image or video URLs into Markdown documents.
- `TableDialog.tsx`: Visual grid size picker dialog for inserting Markdown tables.
- `index.ts`: Barrel export exporting all dialog components.

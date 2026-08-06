# Workspace Document Viewer Components (`/src/components/FileViewer/`)

This directory includes specialized code editors, custom theme parsers, and media preview panels for the document hub.

## Components Registry

- `MarkdownFileEditor.tsx`: Responsive text editor equipped with a real-time Markdown preview split.
- `CodeFileEditor.tsx`: Monospace text editor for programming languages, equipped with a direct copyable run-sandbox console.
- `MediaFileViewer.tsx`: Responsive image/video offline player.
- `UnknownFileViewer.tsx`: Graceful fallback reader for unrecognized binary blobs.
- `index.tsx`: Main router directing files to the appropriate editor or preview container based on extension suffix.

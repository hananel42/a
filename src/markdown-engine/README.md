# Custom Markdown Engine Infrastructure Library

A highly optimized, modular, type-safe infrastructure library designed for real-time document rendering, live text streaming support, syntax highlighting, interactive check-lists, and fluid responsive layouts. 

This library resides entirely in a dedicated self-contained workspace at `/src/markdown-engine/` and supports five distinct typography design presets.

---

## 🛠 Features

1. **Lightweight & High-Speed Syntax Highlighting**:
   - Integrated with `prismjs` to parse code dynamically with official syntactic grammar sets (JS, TS, Python, Rust, HTML, CSS, JSON, Bash, SQL, YAML, Go, JSX, TSX).
   - Instant token parsing ensures perfect performance during live AI token streaming (no flickering, lagging, or re-highlighting glitches).
2. **Dynamic Aesthetic Presets**:
   - Supports 5 responsive typography presets (`standard`, `serif`, `newspaper`, `nord`, `tech`) that seamlessly adapt to light and dark modes.
3. **Collapsible Code Blocks**:
   - Smart code containers with automatic line numbers, filename badge support, clipboard-copy, and collapsible bounds for blocks longer than 15 lines.
4. **Fluid Image Lightbox**:
   - Multi-mode support with error diagnostics, custom captions, and an immersive high-contrast dark overlay modal with interactive zoom levels.
5. **Interactive Checklists**:
   - GFM list checkboxes are rendered as responsive stateful buttons that users can toggle.
6. **Responsive Layout Tables**:
   - Automatically wraps standard tables into clean horizontal scrolling card blocks with theme-paired dividers and headers.

---

## 📁 File Structure

```text
/src/markdown-engine/
├── components/
│   ├── ChecklistItem.tsx     # Custom interactive task check-list items
│   ├── CodeBlock.tsx         # PrismJS powered syntax highlighter with code controls
│   ├── CustomBlockquote.tsx  # Theme-aware citation blockquotes
│   ├── CustomImage.tsx       # Immersive lightbox image zooming system
│   ├── CustomTable.tsx       # Horizontal-scroll tables (thead, tbody, rows, cells)
│   └── CustomVideo.tsx       # Fluid native HTML5 video player component
├── index.tsx                 # Core Entry Point exporting <MarkdownRenderer />
├── styles.ts                 # Theme palettes, typography configurations, and class mappings
└── types.ts                  # Component props definitions and custom type definitions
```

---

## 🚀 Usage API

Simply import `MarkdownRenderer` and specify the content and design style.

```tsx
import MarkdownRenderer from './markdown-engine';

export default function DocumentPreview() {
  const content = `# Hello, World!\n\nThis is some **rich** text content.`;

  return (
    <div className="p-6">
      <MarkdownRenderer 
        content={content} 
        previewStyle="nord" 
        className="my-custom-styles"
      />
    </div>
  );
}
```

### Properties

| Name | Type | Required | Default | Description |
| :--- | :--- | :---: | :---: | :--- |
| `content` | `string` | **Yes** | — | Raw Markdown string to compile and render. Supports GFM and raw HTML. |
| `previewStyle` | `'standard' \| 'serif' \| 'newspaper' \| 'nord' \| 'tech'` | No | `'standard'` | Theme preset for typography, borders, backgrounds, and highlighting styles. |
| `className` | `string` | No | `""` | Optional additional CSS classes to append to the root container. |

---

## ⚡ Real-Time Streaming Design

This engine was tailored to support live streaming of AI responses:
- **Streaming Safe**: All regex parsing is linear, and Prism JS's tokenizing runs instantaneously without requiring expensive DOM manipulations.
- **Graceful Fault Tolerance**: Partially-written tokens (like unclosed code blocks, incomplete table tags, or markdown elements) are handled gracefully and safely by the virtual DOM without causing application crashes.

import { MarkdownFile } from "../types";

export const templates: MarkdownFile[] = [
  {
    id: "welcome",
    title: "👋 Welcome & Markdown Guide",
    content: `# Welcome to the Ultimate Markdown Editor & Viewer!

This is a modern, fast, and feature-rich Markdown editor designed for creators, developers, and technical writers. It has full support for standard Markdown, GitHub Flavored Markdown (GFM), inline HTML, embedded media (images, custom videos, YouTube), and rich syntax-highlighted code blocks.

---

## 🚀 Key Features

- **Split-Screen View**: See your live preview update in real-time as you type, complete with scroll synchronization.
- **Rich Media Support**: Direct rendering of \`<video>\` tags, YouTube/Vimeo links, responsive images, and captions.
- **Embedded HTML**: Write standard HTML elements like \`<div class="...">\` to style custom layouts, alert banners, and visual components.
- **Code Block Studio**: Beautifully highlighted code with file names, language badges, copy-to-clipboard, and wrapping options.
- **Interactive Tools**: Formatting toolbar, table generator, media embedder, and persistent auto-save storage.

---

## 📝 Markdown Basics

### Text Formatting
You can easily write **bold text** by wrapping words in double asterisks, or *italic text* with single asterisks. Need both? You can do **_bold & italic_** or even ~~strikethrough text~~.

> **Pro Tip**: Use Blockquotes to emphasize important quotes, tips, or notes.
> "The only way to do great work is to love what you do." — Steve Jobs

---

### Lists & Checklists

#### Ordered List
1. Setup the project structure
2. Install standard dependencies
3. Design a beautiful, fluid UI

#### Unordered List
- High performance rendering
- Seamless keyboard shortcuts
- Local storage persistent autosave

#### Tasks / Checklists (GFM)
- [x] Create a gorgeous user interface
- [x] Implement robust Markdown rendering
- [x] Configure live scroll synchronization
- [ ] Connect cloud storage backup (coming soon!)

---

### Links & Buttons

You can link to external websites such as [OpenAI](https://openai.com) or [GitHub](https://github.com).

Want a stylish visual alert? You can combine Markdown blockquotes and HTML:

<blockquote>
  <span style="font-weight: 600; color: #10B981;">💡 Pro-Tip:</span> Use the toolbar buttons to quickly insert links, code blocks, or format text without typing raw markdown!
</blockquote>

---

## 📊 Next Steps
Feel free to select other tabs from the sidebar, such as the **Code & Syntax Highlight** showcase or **Media & HTML Embeds** to see the full power of this editor!
`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "code-showcase",
    title: "💻 Code & Syntax Highlights",
    content: `# Syntax Highlighting Showcase

Our Markdown renderer supports advanced formatting for code blocks. Every code block is enclosed in a stylish container displaying the programming language badge, a copy button, a toggle to enable or disable line wrapping, and line numbers.

Here are examples of various languages and formats:

### TypeScript (Web Development)

\`\`\`typescript
// src/utils/math.ts
import { useState, useEffect } from 'react';

interface Vector2D {
  x: number;
  y: number;
}

export function usePointerPosition(): Vector2D {
  const [position, setPosition] = useState<Vector2D>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('pointermove', handleMove);
    return () => window.removeEventListener('pointermove', handleMove);
  }, []);

  return position;
}
\`\`\`

---

### Python (Data Science & AI)

\`\`\`python
# ai_agent.py
import os
import openai

def generate_markdown_summary(prompt: str) -> str:
    """Generates a structured document using any OpenAI-compatible API."""
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("API_KEY")
    base_url = os.getenv("OPENAI_API_BASE") # Optional custom endpoint base URL
    
    if not api_key:
        raise ValueError("Missing API_KEY or OPENAI_API_KEY environment variable")
        
    client = openai.OpenAI(api_key=api_key, base_url=base_url)
    
    response = client.chat.completions.create(
        model="gpt-4o-mini", # Replace with any available model
        messages=[
            {"role": "system", "content": "You are a meticulous technical documentation writer."},
            {"role": "user", "content": f"Generate a professional document about: {prompt}"}
        ],
        temperature=0.2
    )
    return response.choices[0].message.content
\`\`\`

---

### Rust (Systems & Performance)

\`\`\`rust
// main.rs
#[derive(Debug)]
struct Circle {
    radius: f64,
}

impl Circle {
    fn area(&self) -> f64 {
        std::f64::consts::PI * self.radius.powi(2)
    }
}

fn main() {
    let disk = Circle { radius: 4.5 };
    println!("The disk area is: {:.2} units²", disk.area());
}
\`\`\`

---

### CSS & Styling

\`\`\`css
/* index.css */
@theme {
  --color-primary-50: #f0fdf4;
  --color-primary-500: #22c55e;
  --color-primary-950: #022c22;
  
  --font-display: "Space Grotesk", sans-serif;
}

.markdown-body h1 {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
}
\`\`\`
`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "media-html",
    title: "🎬 Media & HTML Embeds",
    content: `# Advanced Media & HTML Rendering

In addition to traditional Markdown, you can write native HTML elements to create stunning interactive custom components, visual containers, and embed media files directly.

---

## 🎬 Custom Videos & YouTube

You can embed raw \`<video>\` elements or iframe players from YouTube/Vimeo. They render natively, in a fully responsive layout.

### 1. HTML Video Element
Here is a raw video loaded directly:

<video controls src="https://assets.mixkit.co/videos/preview/mixkit-starry-night-sky-over-a-lone-tree-43033-large.mp4" width="100%" poster="https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=600" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15)">
  Your browser does not support the video tag.
</video>

### 2. Embedded YouTube
You can also embed standard YouTube videos:

<iframe width="100%" height="400" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1)"></iframe>

---

## 🖼️ Gorgeous Images & Captions

Insert a beautiful image with custom styles, borders, or caption wrappers.

<div style="text-align: center; margin: 2rem 0;">
  <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200" alt="Nebula space exploration" style="border-radius: 16px; max-width: 100%; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.25);" />
  <p style="font-style: italic; color: #6B7280; margin-top: 0.75rem; font-size: 0.875rem;">
    Image Caption: Deep space nebula containing millions of stars and galactic dust.
  </p>
</div>

---

## 🎨 Rich HTML Styling Cards

Use standard HTML tag definitions to build beautiful interactive card notices, alerts, and columns.

<div style="display: grid; grid-template-columns: 1fr; gap: 1rem; margin: 2rem 0;">
  
  <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 1.25rem; border-radius: 0 8px 8px 0; color: #1E3A8A;">
    <h4 style="margin: 0 0 0.5rem 0; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
      <span>ℹ️</span> Info Alert Box
    </h4>
    <p style="margin: 0; font-size: 0.95rem; line-height: 1.5;">
      This container is rendered entirely from native HTML embedded within the editor. You can use CSS styles to create stunning announcements.
    </p>
  </div>

  <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 1.25rem; border-radius: 0 8px 8px 0; color: #7F1D1D;">
    <h4 style="margin: 0 0 0.5rem 0; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
      <span>⚠️</span> Warning Notification
    </h4>
    <p style="margin: 0; font-size: 0.95rem; line-height: 1.5;">
      Always ensure you use safe URLs when linking external videos and images. Raw HTML rendering runs in a sandbox mode but can still affect layout if styled incorrectly.
    </p>
  </div>

</div>
`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tables-showcase",
    title: "📊 GFM Tables & Lists",
    content: `# Tables & GitHub Flavored Markdown (GFM)

Our parser features comprehensive support for advanced GFM syntax. This includes multi-column tables, text alignments, nested task lists, autolinks, and strikethroughs.

---

## 📅 Comparison Tables

You can format standard comparison tables using pipe-and-hyphen notation with custom text alignment (:---, :---:, ---:).

| Feature Indicator | Core Markdown | GitHub Flavored (GFM) | Native HTML Hybrid |
| :--- | :---: | :---: | :---: |
| Basic Headings | ✅ Yes | ✅ Yes | ✅ Yes |
| Task Checklists | ❌ No | ✅ Yes | ✅ Yes |
| Custom Table Alignments | ❌ No | ✅ Yes | ✅ Yes |
| Dynamic Video Tags | ❌ No | ❌ No | ✅ Yes |
| Responsive Columns | ❌ No | ❌ No | ✅ Yes |
| CSS Custom Styles | ❌ No | ❌ No | ✅ Yes |

---

## 🧪 Advanced Layout Details

Here is another table representing technical specifications:

| Component Type | Tech Spec / Size | Speed Rating | Operational Status |
| :--- | :--- | :---: | ---: |
| **Vite Compiler** | ESM Bundler | Ultra-Fast | \`ACTIVE\` |
| **Tailwind engine** | PostCSS / JIT | Instantaneous | \`STABLE\` |
| **React UI Node** | Virtual DOM v19 | Fast | \`LOADED\` |
| **AI client** | REST/JSON Endpoint | Streaming | \`STANDBY\` |

---

## 🧬 Inline GFM Annotations

- **Strikethrough**: This is ~~an old deprecated rule~~ that has been deleted.
- **Autolinks**: Type a standard URL directly (e.g. https://openai.com) and the renderer will turn it into an active anchor automatically.
- **Task completion monitoring**:
  - [x] Create core structure
  - [x] Configure high-speed build scripts
  - [ ] Deploy container instances
`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "markdown-spec",
    title: "📖 Markdown Spec (LLM-Ready)",
    content: `# LLM-Ready Markdown & Custom Spec

This document is a comprehensive, precise, and minimal specification of all supported Markdown, GitHub Flavored Markdown (GFM), and custom media extension tags. It is optimized for both human reading and direct consumption by Large Language Models (LLMs).

---

## 1. Typography & Hierarchy
Headings are defined using '#' prefix. Avoid skipping levels for correct visual nesting:
\`\`\`markdown
# Heading 1 (Document Title)
## Heading 2 (Major Sections)
### Heading 3 (Sub-sections)
#### Heading 4 (Minor headings)
\`\`\`

---

## 2. Text Styles
Standard inline decoration selectors:
- **Bold**: \`**text**\` or \`__text__\`
- *Italic*: \`*text*\` or \`_text_\`
- ***Bold & Italic***: \`***text***\`
- ~~Strikethrough~~: \`~~text~~\`
- \`Inline Code\`: \`\\\`code\\\`\`

---

## 3. Lists and Task Lists
Unordered lists use \`-\` or \`*\`. Ordered lists use numbers. Task checklists use brackets with \`x\` for checked states:
\`\`\`markdown
- Unordered item A
  - Nested sub-item

1. Ordered step 1
2. Ordered step 2

- [x] Completed milestone task
- [ ] Remaining checklist item
\`\`\`

---

## 4. Tables (GFM Spec)
Tables require columns divided by pipes (\`|\n\`) and alignment parameters defined in the separator row:
\`\`\`markdown
| Left Aligned Header | Center Aligned Header | Right Aligned Header |
| :---                | :---:                  | ---:                 |
| Row Item 1          | Center Text            | $100.00              |
| Row Item 2          | Another Item           | $1,500.50            |
\`\`\`

---

## 5. Blockquotes & Callouts
Blockquotes are initiated with \`>\` and can be nested:
\`\`\`markdown
> This is a standard section blockquote callout.
>> Nested secondary citation level.
\`\`\`

---

## 6. Links and Responsive Media
- **Standard Link**: \`[Anchor Text](URL)\`
- **Auto-detected Link**: Standard URLs (e.g., \`https://example.com\`) resolve natively.
- **Embedded Image**: \`![Alt Text](ImageURL)\`

### Custom Media Extension Tags
Our system parses native HTML tags for responsive multimedia assets:
- **Responsive Video Tag**:
\`\`\`html
<video controls src="VIDEO_URL" width="100%" poster="POSTER_IMAGE_URL">
  Alternative Text
</video>
\`\`\`
- **Embedded YouTube/Vimeo Frame**:
\`\`\`html
<iframe width="100%" height="400" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>
\`\`\`

---

## 7. Syntax-Highlighted Code Blocks
Indicate programming language keyword names immediately after the opening triple backticks (\`\`\`) to trigger the advanced semantic tokenizer:
\`\`\`typescript
const multiply = (a: number, b: number): number => a * b;
\`\`\`
Supported tags include: \`javascript\`, \`typescript\`, \`python\`, \`rust\`, \`html\`, \`css\`, \`markdown\`, \`json\`, \`yaml\`, \`bash\`, \`sql\`.
`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

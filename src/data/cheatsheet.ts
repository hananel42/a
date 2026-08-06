export const markdownDocumentation = `# Complete Markdown & Rich Media Guide

This guide is a comprehensive reference explaining how to write Standard Markdown, GitHub Flavored Markdown (GFM), and custom media elements supported by this editor.

---

## 1. Typography & Headings

Use the hash symbol (\`#\`) followed by a space to create headers. The number of hashes indicates the heading level (from 1 to 6).

\`\`\`markdown
# Heading 1 (Document Title)
## Heading 2 (Major Sections)
### Heading 3 (Sub-sections)
#### Heading 4 (Minor headers)
\`\`\`

---

## 2. Text Emphasis

Format your text to add bold, italic, or struck-through emphasis.

| Style | Syntax | Rendered Output |
| :--- | :--- | :--- |
| **Bold** | \`**text**\` or \`__text__\` | **Bold Text** |
| *Italic* | \`*text*\` or \`_text_\` | *Italic Text* |
| ***Bold & Italic*** | \`***text***\` | ***Bold & Italic*** |
| ~~Strikethrough~~ | \`~~text~~\` | ~~Strikethrough~~ |

---

## 3. Lists & Checklists

### Unordered Lists
Use hyphens (\`-\`), asterisks (\`*\`), or plus signs (\`+\`) followed by a space.
\`\`\`markdown
- Item A
- Item B
  - Sub-item B1
\`\`\`

### Ordered Lists
Use numbers followed by a period and a space.
\`\`\`markdown
1. First task
2. Second task
\`\`\`

### Interactive Checklists (GFM)
Use brackets with a space \`[ ]\` for incomplete items and an \`x\` \`[x]\` for completed items.
\`\`\`markdown
- [x] Finished feature
- [ ] Remaining item
\`\`\`

---

## 4. Hyperlinks & Media Elements

### Native Hyperlinks
\`\`\`markdown
[OpenAI](https://openai.com)
\`\`\`

### Responsive Images
\`\`\`markdown
![Deep Space](https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600)
\`\`\`

---

## 5. Tables (GFM)

Construct tables using pipes (\`|\`) and hyphens (\`-\`). Colon positioning (\`:\`) controls alignment.

\`\`\`markdown
| Product | Type | Price | Status |
| :--- | :---: | ---: | :---: |
| Vite | ESM Bundler | Free | \`Stable\` |
| DeepSeek | Model Endpoint | Tiered | \`Active\` |
\`\`\`

---

## 6. Code Block Studio

Enclose code segments in triple backticks (\` \` \` \`). Optionally declare the language badge on the first line.

\\\`\\\`\\\`typescript
// Calculate area
const getArea = (r: number): number => Math.PI * r * r;
\\\`\\\`\\\`

---

## 7. Rich Media Embeds (HTML Extension)

Write standard HTML elements directly to embed video files, iframe clips, and responsive container cards.

### HTML Video Tag
\`\`\`html
<video controls src="https://assets.mixkit.co/videos/preview/mixkit-starry-night-sky-over-a-lone-tree-43033-large.mp4" width="100%">
</video>
\`\`\`

### YouTube Video Embedded Frame
\`\`\`html
<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="100%" height="360" frameborder="0" allowfullscreen></iframe>
\`\`\`
`;

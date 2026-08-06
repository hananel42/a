export type FormatType =
  | "bold"
  | "italic"
  | "strikethrough"
  | "h1"
  | "h2"
  | "h3"
  | "blockquote"
  | "code"
  | "codeblock"
  | "link"
  | "image"
  | "video"
  | "youtube"
  | "ul"
  | "ol"
  | "task"
  | "hr"
  | "table";

export interface FormatterResult {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

export function applyFormatting(
  type: FormatType,
  currentText: string,
  start: number,
  end: number,
  additionalData?: any,
): FormatterResult {
  const selected = currentText.substring(start, end);
  let insertText = "";
  let newStart = start;
  let newEnd = end;

  switch (type) {
    case "bold":
      insertText = `**${selected || "bold text"}**`;
      newStart = start + 2;
      newEnd = selected ? end + 2 : start + 11;
      break;
    case "italic":
      insertText = `*${selected || "italic text"}*`;
      newStart = start + 1;
      newEnd = selected ? end + 1 : start + 12;
      break;
    case "strikethrough":
      insertText = `~~${selected || "strikethrough text"}~~`;
      newStart = start + 2;
      newEnd = selected ? end + 2 : start + 20;
      break;
    case "h1":
      insertText = `\n# ${selected || "Heading 1"}\n`;
      newStart = start + 3;
      newEnd = selected ? end + 3 : start + 12;
      break;
    case "h2":
      insertText = `\n## ${selected || "Heading 2"}\n`;
      newStart = start + 4;
      newEnd = selected ? end + 4 : start + 13;
      break;
    case "h3":
      insertText = `\n### ${selected || "Heading 3"}\n`;
      newStart = start + 5;
      newEnd = selected ? end + 5 : start + 14;
      break;
    case "blockquote":
      insertText = `\n> ${selected || "Blockquote"}\n`;
      newStart = start + 3;
      newEnd = selected ? end + 3 : start + 13;
      break;
    case "code":
      insertText = `\`${selected || "code"}\``;
      newStart = start + 1;
      newEnd = selected ? end + 1 : start + 5;
      break;
    case "codeblock":
      const lang = additionalData?.language || "typescript";
      insertText = `\n\`\`\`${lang}\n${selected || "// write code here"}\n\`\`\`\n`;
      newStart = start + 4 + lang.length + 1;
      newEnd = selected ? end + 4 + lang.length + 1 : newStart + 18;
      break;
    case "link":
      const url = additionalData?.url || "https://example.com";
      const label = selected || additionalData?.label || "link text";
      insertText = `[${label}](${url})`;
      newStart = start + 1;
      newEnd = start + 1 + label.length;
      break;
    case "image":
      const imageUrl =
        additionalData?.url ||
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600";
      const imageAlt = selected || additionalData?.alt || "nebula exploration";
      insertText = `![${imageAlt}](${imageUrl})`;
      newStart = start + 2;
      newEnd = start + 2 + imageAlt.length;
      break;
    case "video":
      const videoUrl =
        additionalData?.url ||
        "https://assets.mixkit.co/videos/preview/mixkit-starry-night-sky-over-a-lone-tree-43033-large.mp4";
      const videoPoster =
        additionalData?.poster ||
        "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=600";
      insertText = `\n<video controls src="${videoUrl}" poster="${videoPoster}" width="100%">\n  Your browser does not support the video tag.\n</video>\n`;
      newStart = start + insertText.length;
      newEnd = newStart;
      break;
    case "youtube":
      const ytId = additionalData?.videoId || "dQw4w9WgXcQ";
      insertText = `\n<iframe width="100%" height="400" src="https://www.youtube.com/embed/${ytId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1)"></iframe>\n`;
      newStart = start + insertText.length;
      newEnd = newStart;
      break;
    case "ul":
      insertText = `\n- ${selected || "list item"}\n`;
      newStart = start + 3;
      newEnd = selected ? end + 3 : start + 12;
      break;
    case "ol":
      insertText = `\n1. ${selected || "list item"}\n`;
      newStart = start + 4;
      newEnd = selected ? end + 4 : start + 13;
      break;
    case "task":
      insertText = `\n- [ ] ${selected || "task item"}\n`;
      newStart = start + 7;
      newEnd = selected ? end + 7 : start + 16;
      break;
    case "hr":
      insertText = `\n\n---\n\n`;
      newStart = start + 7;
      newEnd = newStart;
      break;
    case "table":
      const rows = additionalData?.rows || 3;
      const cols = additionalData?.cols || 3;
      const hasHeaders = additionalData?.headers !== false;

      let tableText = "\n";

      // Headers
      if (hasHeaders) {
        tableText += "|";
        for (let c = 1; c <= cols; c++) {
          tableText += ` Header ${c} |`;
        }
        tableText += "\n|";
        for (let c = 1; c <= cols; c++) {
          tableText += " :--- |";
        }
        tableText += "\n";
      }

      // Rows
      for (let r = 1; r <= (hasHeaders ? rows - 1 : rows); r++) {
        tableText += "|";
        for (let c = 1; c <= cols; c++) {
          tableText += ` Cell ${r},${c} |`;
        }
        tableText += "\n";
      }
      tableText += "\n";

      insertText = tableText;
      newStart = start + insertText.length;
      newEnd = newStart;
      break;
    default:
      return { text: currentText, selectionStart: start, selectionEnd: end };
  }

  const textBefore = currentText.substring(0, start);
  const textAfter = currentText.substring(end);

  return {
    text: textBefore + insertText + textAfter,
    selectionStart: newStart,
    selectionEnd: newEnd,
  };
}

import React from "react";
import { FormatType } from "../utils/formatter";

export function useEditorShortcuts(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  onChange: (val: string) => void,
  onFormat: (type: FormatType, data?: any) => void,
  toggleSearch: () => void,
) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Check key combos
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      const key = e.key.toLowerCase();

      if (key === "b") {
        e.preventDefault();
        onFormat("bold");
      } else if (key === "i") {
        e.preventDefault();
        onFormat("italic");
      } else if (key === "/") {
        e.preventDefault();
        onFormat("code");
      } else if (key === "f") {
        e.preventDefault();
        toggleSearch();
      }
    }

    if (e.key === "Enter") {
      const { selectionStart, selectionEnd, value } = textarea;

      // Auto list continuation only if no text is selected
      if (selectionStart === selectionEnd) {
        // Find the start of the current line
        const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
        const currentLine = value.slice(lineStart, selectionStart);

        // Match list patterns: "- ", "* ", "+ ", "1. ", "- [ ] ", "- [x] "
        const listMatch = currentLine.match(
          /^(\s*)([-*+]|\d+\.)(\s+(?:\[[ x]]\s+)?)/i,
        );

        if (listMatch) {
          e.preventDefault();
          const [, indent, bullet, space] = listMatch;

          // If the line is empty (just the list token), we should remove it and end the list
          const isLineEmpty =
            currentLine.trim() === bullet ||
            currentLine.trim() === bullet + " [ ]" ||
            currentLine.trim() === bullet + " [x]";
          if (isLineEmpty) {
            const newValue =
              value.slice(0, lineStart) + value.slice(selectionStart);
            onChange(newValue);
            setTimeout(() => {
              textarea.selectionStart = textarea.selectionEnd = lineStart;
            }, 0);
            return;
          }

          // Otherwise continue the list
          let nextBullet = bullet;
          if (/\d+\./.test(bullet)) {
            nextBullet = `${parseInt(bullet, 10) + 1}.`;
          }

          const insertText = `\n${indent}${nextBullet}${space.replace(/\[x]/i, "[ ]")}`;

          const newValue =
            value.slice(0, selectionStart) +
            insertText +
            value.slice(selectionStart);
          onChange(newValue);

          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd =
              selectionStart + insertText.length;
            // Scroll adjustment
            textarea.blur();
            textarea.focus();
          }, 0);
        }
      }
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const { selectionStart, selectionEnd, value } = textarea;

      if (selectionStart !== selectionEnd) {
        // Multi-line indent/outdent
        const selectedText = value.slice(selectionStart, selectionEnd);
        if (e.shiftKey) {
          const outdented = selectedText.replace(/^ {1,2}/gm, "");
          const newValue =
            value.slice(0, selectionStart) +
            outdented +
            value.slice(selectionEnd);
          onChange(newValue);
          setTimeout(() => {
            textarea.setSelectionRange(
              selectionStart,
              selectionStart + outdented.length,
            );
          }, 0);
        } else {
          const indented = selectedText.replace(/^/gm, "  ");
          const newValue =
            value.slice(0, selectionStart) +
            indented +
            value.slice(selectionEnd);
          onChange(newValue);
          setTimeout(() => {
            textarea.setSelectionRange(
              selectionStart,
              selectionStart + indented.length,
            );
          }, 0);
        }
      } else {
        // Single line
        const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
        if (e.shiftKey) {
          const currentLine = value.slice(lineStart, selectionStart);
          if (currentLine.startsWith("  ")) {
            const newValue =
              value.slice(0, lineStart) + value.slice(lineStart + 2);
            onChange(newValue);
            setTimeout(() => {
              textarea.selectionStart = textarea.selectionEnd =
                selectionStart - 2;
            }, 0);
          } else if (currentLine.startsWith(" ")) {
            const newValue =
              value.slice(0, lineStart) + value.slice(lineStart + 1);
            onChange(newValue);
            setTimeout(() => {
              textarea.selectionStart = textarea.selectionEnd =
                selectionStart - 1;
            }, 0);
          }
        } else {
          const newValue =
            value.slice(0, selectionStart) + "  " + value.slice(selectionStart);
          onChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd =
              selectionStart + 2;
          }, 0);
        }
      }
    }
  };

  return { handleKeyDown };
}

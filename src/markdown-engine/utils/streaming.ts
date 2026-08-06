/**
 * Utility functions for handling markdown streaming.
 */

/**
 * Fixes incomplete markdown strings by auto-closing unclosed blocks.
 * This is especially useful during real-time streaming to prevent the UI
 * from breaking or shifting dramatically while waiting for the closing syntax.
 *
 * Supported auto-closures:
 * - Code blocks (``` or ~~~)
 * - Math blocks ($$)
 *
 * @param markdown - The raw, potentially incomplete markdown string.
 * @returns The repaired markdown string with necessary closing tags appended.
 */
export function fixIncompleteMarkdown(markdown: string): string {
  if (!markdown) return markdown;

  let fixedMarkdown = markdown;

  // Fix unclosed code blocks by counting fences and appending a matching closing fence if odd
  const codeFences = fixedMarkdown.match(/^ {0,3}(`{3,}|~{3,})/gm) || [];
  if (codeFences.length % 2 !== 0) {
    const lastFence = codeFences[codeFences.length - 1].trim();
    fixedMarkdown += `\n${lastFence}`;
  }

  // Fix unclosed math blocks by counting block-level $$ signs
  const mathFences = fixedMarkdown.match(/(?:^|\n) {0,3}\$\$/g) || [];
  if (mathFences.length % 2 !== 0) {
    fixedMarkdown += `\n$$`;
  }

  return fixedMarkdown;
}

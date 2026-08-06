/**
 * @file searchWikipedia.ts
 * @description Tool definition & handler for querying Wikipedia summaries and retrieving full article content.
 * Upgraded to use MediaWiki Action Parse API to retrieve actual HTML, which we parse inside the browser
 * sandbox using DOMParser to convert paragraphs, headers, lists, and tables into rich, detailed Markdown.
 */

import { ToolModule, truncateOutput } from "./types";

/**
 * Parses raw Wikipedia HTML and converts it into beautiful, rich Markdown.
 * Preserves structural components like headers, lists, and tables.
 */
function convertWikipediaHtmlToMarkdown(htmlString: string, baseUrl: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    // Wikipedia's main parsed content usually sits inside a container with class .mw-parser-output
    const contentRoot = doc.querySelector(".mw-parser-output") || doc.body;
    return cleanAndFormatNode(contentRoot, baseUrl).trim();
  } catch (err) {
    // Graceful fallback: basic tag strip if DOMParser fails
    return htmlString.replace(/<[^>]+>/g, "").trim();
  }
}

/**
 * Recursively parses DOM nodes and generates equivalent Markdown elements.
 */
function cleanAndFormatNode(node: Node, baseUrl: string): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const el = node as HTMLElement;
  const tagName = el.tagName.toLowerCase();

  // Exclude unwanted elements like edit links, metadata, styling blocks, and empty navigation nodes
  if (
    el.classList.contains("mw-editsection") ||
    el.classList.contains("mw-empty-elt") ||
    el.classList.contains("navbox") ||
    el.classList.contains("metadata") ||
    el.classList.contains("ambox") ||
    tagName === "style" ||
    tagName === "script" ||
    tagName === "noscript"
  ) {
    return "";
  }

  // 1. Convert tables (especially class "wikitable" or ".infobox") to Markdown Tables
  if (tagName === "table") {
    return "\n\n" + formatTableToMarkdown(el, baseUrl) + "\n\n";
  }

  // 2. Headings
  if (/^h[1-6]$/.test(tagName)) {
    const level = parseInt(tagName.substring(1));
    const hashes = "#".repeat(level);
    const content = cleanTextContent(el, baseUrl).trim();
    if (!content) return "";
    return `\n\n${hashes} ${content}\n\n`;
  }

  // 3. Paragraphs
  if (tagName === "p") {
    const content = cleanTextContent(el, baseUrl).trim();
    if (!content) return "";
    return `${content}\n\n`;
  }

  // 4. List Items (handled in context of UL/OL parent or recursively)
  if (tagName === "li") {
    return cleanTextContent(el, baseUrl);
  }

  // 5. Unordered and Ordered Lists
  if (tagName === "ul" || tagName === "ol") {
    const isOrdered = tagName === "ol";
    const items: string[] = [];
    let child = el.firstElementChild;
    let index = 1;

    while (child) {
      if (child.tagName.toLowerCase() === "li") {
        const itemContent = cleanTextContent(child as HTMLElement, baseUrl).trim();
        if (itemContent) {
          const prefix = isOrdered ? `${index}. ` : "- ";
          items.push(`${prefix}${itemContent}`);
          index++;
        }
      } else {
        const nestedContent = cleanAndFormatNode(child, baseUrl).trim();
        if (nestedContent) {
          items.push(nestedContent);
        }
      }
      child = child.nextElementSibling;
    }
    return "\n" + items.join("\n") + "\n\n";
  }

  // 6. Inline Formatting
  if (tagName === "b" || tagName === "strong") {
    const text = cleanTextContent(el, baseUrl).trim();
    return text ? `**${text}**` : "";
  }
  if (tagName === "i" || tagName === "em") {
    const text = cleanTextContent(el, baseUrl).trim();
    return text ? `*${text}*` : "";
  }
  if (tagName === "code") {
    const text = cleanTextContent(el, baseUrl).trim();
    return text ? `\`${text}\`` : "";
  }

  // 7. Line Breaks
  if (tagName === "br") {
    return "\n";
  }

  // 8. Hyperlinks - relative links converted to absolute Wikipedia URLs
  if (tagName === "a") {
    const href = el.getAttribute("href");
    const text = cleanTextContent(el, baseUrl).trim();
    if (!text) return "";
    if (href) {
      if (href.startsWith("#")) {
        return text; // Local hash links kept as plain text
      }
      let absoluteUrl = href;
      if (href.startsWith("/wiki/")) {
        absoluteUrl = `${baseUrl}/wiki/${href.substring(6)}`;
      } else if (href.startsWith("//")) {
        absoluteUrl = `https:${href}`;
      } else if (!href.startsWith("http")) {
        absoluteUrl = `${baseUrl}${href}`;
      }
      return `[${text}](${absoluteUrl})`;
    }
    return text;
  }

  // Default: Process children nodes
  return cleanTextContent(el, baseUrl);
}

/**
 * Aggregates text from all child nodes.
 */
function cleanTextContent(element: HTMLElement, baseUrl: string): string {
  let result = "";
  let child = element.firstChild;
  while (child) {
    result += cleanAndFormatNode(child, baseUrl);
    child = child.nextSibling;
  }
  return result;
}

/**
 * Transforms an HTML <table> node into beautifully structured Markdown tables.
 * Escapes markdown pipes inside cells to protect formatting.
 */
function formatTableToMarkdown(tableEl: HTMLElement, baseUrl: string): string {
  const rows = Array.from(tableEl.querySelectorAll("tr"));
  if (rows.length === 0) return "";

  const markdownRows: string[][] = [];
  let maxCols = 0;

  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll("th, td"));
    if (cells.length === 0) continue;

    // Filter to ensure cells belong directly to this row (handling nested tables)
    const directCells = cells.filter((cell) => cell.parentElement === row);
    if (directCells.length === 0) continue;

    const cellContents = directCells.map((cell) => {
      return cleanTextContent(cell as HTMLElement, baseUrl)
        .replace(/\n+/g, " ") // Collapse nested newlines
        .replace(/\|/g, "\\|") // Escape markdown pipe symbol
        .trim();
    });

    if (cellContents.length > maxCols) {
      maxCols = cellContents.length;
    }
    markdownRows.push(cellContents);
  }

  if (markdownRows.length === 0) return "";

  const formattedRows: string[] = [];

  // Construct header row
  const headerRow = markdownRows[0];
  while (headerRow.length < maxCols) {
    headerRow.push("");
  }
  formattedRows.push(`| ${headerRow.join(" | ")} |`);

  // Construct separators
  const separatorRow = Array(maxCols).fill("---");
  formattedRows.push(`| ${separatorRow.join(" | ")} |`);

  // Construct data rows
  for (let i = 1; i < markdownRows.length; i++) {
    const row = markdownRows[i];
    while (row.length < maxCols) {
      row.push("");
    }
    formattedRows.push(`| ${row.join(" | ")} |`);
  }

  return formattedRows.join("\n");
}

export const searchWikipediaTool: ToolModule = {
  schema: {
    name: "search_wikipedia",
    description:
      "Search Wikipedia or fetch detailed article content for a specific topic, title, or direct Wikipedia URL. Supports language selection (e.g. en, he).",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search topic, keyword, or Wikipedia URL.",
        },
        title: {
          type: "string",
          description:
            'Specific Wikipedia article title or direct URL (e.g., "Artificial intelligence" or "https://he.wikipedia.org/wiki/..."). When provided, retrieves the detailed article text.',
        },
        lang: {
          type: "string",
          description:
            'Language code for Wikipedia (e.g., "en", "he", "es", "fr"). Defaults to "en" or auto-detected from URL.',
        },
        fullArticle: {
          type: "boolean",
          description:
            "Set to true to fetch the detailed article extract instead of concise search snippets.",
        },
      },
    },
  },

  async execute(args) {
    const { query, title: inputTitle, lang: inputLang, fullArticle } = args;

    if (!query && !inputTitle) {
      return 'Error: Please provide either a "query" or a "title" / Wikipedia URL.';
    }

    let targetTitle = (inputTitle || query || "").trim();
    let lang = (inputLang || "en").toLowerCase().trim();

    // Check if targetTitle or query is a direct Wikipedia URL
    const wikiUrlRegex =
      /https?:\/\/([a-z]{2,3})\.(?:m\.)?wikipedia\.org\/wiki\/([^#?]+)/i;
    const urlMatch =
      targetTitle.match(wikiUrlRegex) || (query && query.match(wikiUrlRegex));

    if (urlMatch) {
      lang = urlMatch[1].toLowerCase();
      targetTitle = decodeURIComponent(urlMatch[2].replace(/_/g, " "));
    }

    const isDirectArticleFetch = Boolean(inputTitle || urlMatch || fullArticle);

    try {
      // 1. Direct Article Extraction Flow (retrieving complete parsed DOM representation)
      if (isDirectArticleFetch) {
        let titleToFetch = targetTitle;

        // If user provided a query with fullArticle=true but no exact title/URL, search first to find top match title
        if (!inputTitle && !urlMatch && query) {
          const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
          const sRes = await fetch(searchUrl);
          if (sRes.ok) {
            const sData = await sRes.json();
            const topMatch = sData?.query?.search?.[0];
            if (topMatch?.title) {
              titleToFetch = topMatch.title;
            }
          }
        }

        // Fetch using Wikipedia Action Parse API for full HTML text structure
        const parseUrl = `https://${lang}.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(titleToFetch)}&prop=text&disablelimitreport=1&disableeditsection=1&format=json&origin=*`;
        const aRes = await fetch(parseUrl);

        if (!aRes.ok) {
          return `Error: Failed to fetch Wikipedia article "${titleToFetch}" (Status ${aRes.status}).`;
        }

        const aData = await aRes.json();
        const htmlContent = aData?.parse?.text?.["*"];
        const resolvedTitle = aData?.parse?.title || titleToFetch;

        if (!htmlContent) {
          // Fallback to standard extracts if parse fails
          const fallbackUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts|info&inprop=url&explaintext=true&titles=${encodeURIComponent(titleToFetch)}&format=json&origin=*`;
          const fRes = await fetch(fallbackUrl);
          if (fRes.ok) {
            const fData = await fRes.json();
            const pages = fData?.query?.pages;
            if (pages) {
              const pageKey = Object.keys(pages)[0];
              const page = pages[pageKey];
              if (page && page.extract) {
                return truncateOutput(
                  `=== WIKIPEDIA ARTICLE: "${page.title}" (Plain Text Fallback) ===\n\n${page.extract}`,
                  8000,
                  `Wikipedia Article "${page.title}"`,
                );
              }
            }
          }
          return `No article found or empty content for "${titleToFetch}" on ${lang}.wikipedia.org.`;
        }

        const baseUrl = `https://${lang}.wikipedia.org`;
        const markdown = convertWikipediaHtmlToMarkdown(htmlContent, baseUrl);

        let result = `=== WIKIPEDIA ARTICLE: "${resolvedTitle}" ===\n`;
        result += `Language: ${lang.toUpperCase()}\n`;
        result += `Direct Link: ${baseUrl}/wiki/${encodeURIComponent(resolvedTitle.replace(/\s+/g, "_"))}\n`;
        result += `\n--- Article Content (with tables, lists, and formatting) ---\n\n${markdown}\n`;

        return truncateOutput(
          result,
          16000,
          `Wikipedia Article "${resolvedTitle}"`,
        );
      }

      // 2. Standard Search Snippets Flow
      const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
      const response = await fetch(searchUrl);
      if (!response.ok) {
        return `Error: Failed to search Wikipedia (Status ${response.status}).`;
      }

      const data = await response.json();
      const searchResults = data?.query?.search;

      if (!searchResults || searchResults.length === 0) {
        return `No Wikipedia pages found matching query "${query}" on ${lang}.wikipedia.org.`;
      }

      let summaryText = `--- Wikipedia Search Results for "${query}" (${lang.toUpperCase()}) ---\n\n`;
      const topResults = searchResults.slice(0, 5);

      for (let i = 0; i < topResults.length; i++) {
        const item = topResults[i];
        const cleanSnippet = item.snippet
          .replace(/<[^>]+>/g, "")
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&amp;/g, "&")
          .trim();

        const itemUrl = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, "_"))}`;

        summaryText += `${i + 1}. ${item.title}\n`;
        summaryText += `   Summary: ${cleanSnippet}...\n`;
        summaryText += `   Direct Link: ${itemUrl}\n\n`;
      }

      summaryText += `[Tip: To fetch the complete detailed text of any article above, call search_wikipedia with title="<Article Title>" or pass the Direct Link.]`;

      return truncateOutput(
        summaryText,
        4500,
        `Wikipedia Search for "${query}"`,
      );
    } catch (e: any) {
      return `Error performing Wikipedia operation: ${e.message || e}`;
    }
  },
};

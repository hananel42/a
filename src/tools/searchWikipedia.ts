/**
 * @file searchWikipedia.ts
 * @description Tool definition & handler for querying Wikipedia summaries and retrieving full article content.
 */

import { ToolModule, truncateOutput } from "./types";

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
      // 1. Direct Article Extraction Flow (if title, URL, or fullArticle requested)
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

        const articleUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts|info&inprop=url&explaintext=true&titles=${encodeURIComponent(titleToFetch)}&format=json&origin=*`;
        const aRes = await fetch(articleUrl);
        if (!aRes.ok) {
          return `Error: Failed to fetch Wikipedia article "${titleToFetch}" (Status ${aRes.status}).`;
        }

        const aData = await aRes.json();
        const pages = aData?.query?.pages;
        if (!pages) {
          return `No article found for "${titleToFetch}" in ${lang}.wikipedia.org.`;
        }

        const pageKey = Object.keys(pages)[0];
        const page = pages[pageKey];

        if (!page || page.missing !== undefined || pageKey === "-1") {
          return `Article "${titleToFetch}" was not found on ${lang}.wikipedia.org. Try searching with a broader query.`;
        }

        const fullUrl =
          page.fullurl ||
          `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/\s+/g, "_"))}`;
        const extract =
          page.extract?.trim() ||
          "No detailed text extract available for this article.";

        let result = `=== WIKIPEDIA ARTICLE: "${page.title}" ===\n`;
        result += `Language: ${lang.toUpperCase()}\n`;
        result += `Direct Link: ${fullUrl}\n`;
        result += `\n--- Article Content ---\n\n${extract}\n`;

        return truncateOutput(
          result,
          8000,
          `Wikipedia Article "${page.title}"`,
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

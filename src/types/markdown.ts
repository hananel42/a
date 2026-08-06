/**
 * @file markdown.ts
 * @description
 * Type definitions for Markdown document state, toolbar actions, table configuration,
 * media embeds, search-and-replace state, and editor viewing modes.
 */

export interface MarkdownFile {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type EditorMode = "split" | "edit" | "preview";

export interface ToolbarAction {
  id: string;
  name: string;
  icon: string;
  tooltip: string;
  shortcut?: string;
  handler: (
    text: string,
    selectionStart: number,
    selectionEnd: number,
  ) => {
    text: string;
    selectionStart: number;
    selectionEnd: number;
  };
}

export interface TableConfig {
  rows: number;
  cols: number;
  headers: boolean;
}

export interface MediaEmbedConfig {
  type: "image" | "video" | "youtube" | "html";
  url: string;
  title?: string;
  caption?: string;
  width?: string;
  height?: string;
}

export interface SearchReplaceState {
  search: string;
  replace: string;
  isOpen: boolean;
  matchCase: boolean;
  resultsCount: number;
  currentIndex: number;
}

export type PreviewStyle = "standard" | "serif" | "newspaper" | "nord" | "tech";

export interface MarkdownRendererProps {
  content: string;
  previewStyle?: PreviewStyle;
  className?: string;
  isStreaming?: boolean;
}

export interface ThemeStyledComponentProps {
  theme: PreviewStyle;
}

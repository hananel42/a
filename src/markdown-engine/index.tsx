import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ExternalLink } from "lucide-react";
import "katex/dist/katex.min.css";

import { PreviewStyle, MarkdownRendererProps } from "./types";
import { fixIncompleteMarkdown } from "./utils/streaming";
import {
  getThemeContainerClasses,
  getThemeTextClasses,
  getHeadingClasses,
  getInlineCodeClasses,
  getPlainPreBlockClasses,
  getLinkClasses,
  getListClasses,
} from "./styles";

// Modular Component Imports
import CodeBlock from "./components/CodeBlock";
import CustomImage from "./components/CustomImage";
import CustomVideo from "./components/CustomVideo";
import CustomBlockquote from "./components/CustomBlockquote";
import ChecklistItem from "./components/ChecklistItem";
import {
  CustomTableWrapper,
  CustomThead,
  CustomTbody,
  CustomTr,
  CustomTh,
  CustomTd,
} from "./components/CustomTable";

export default function MarkdownRenderer({
  content,
  previewStyle = "standard",
  className = "",
  isStreaming = false,
}: MarkdownRendererProps) {
  // Normalize plain checklist indicators (e.g. `[]` or `[x]` at the start of lines with or without bullet)
  const processedContent = React.useMemo(() => {
    let currentContent = content || "";
    if (isStreaming) {
      currentContent = fixIncompleteMarkdown(currentContent);
    }
    // Normalize `[]`, `[ ]`, `[x]`, `[X]` at the start of any line (with optional indentation and/or optional standard bullets)
    // Avoids matching markdown link structures such as `[](url)` or `[x](url)` by looking ahead
    return currentContent.replace(
      /^([ \t]*)(?:[*\-+]\s+)?\[([ xX]?)]\s*(?!\()/gm,
      (match, indent, char) => {
        const normalizedChar = char === "x" || char === "X" ? "x" : " ";
        return `${indent}- [${normalizedChar}] `;
      },
    );
  }, [content, isStreaming]);

  // Mappings of HTML element overrides for ReactMarkdown renderer
  const renderOverrides = React.useMemo(
    () => ({
      // 1. Code Block & Inline Code
      code({
        node,
        inline,
        className: componentClassName,
        children,
        ...props
      }: any) {
        const match = /language-(\w+)/.exec(componentClassName || "");
        const rawString = String(children).replace(/\n$/, "");

        // Case A: Specified language (e.g. ```typescript ... ```)
        if (match) {
          return (
            <CodeBlock className={componentClassName} theme={previewStyle}>
              {rawString}
            </CodeBlock>
          );
        }

        // Case B: Unspecified language code block (triple backticks without language, e.g. ``` ... ```)
        const isMultiLineBlock = inline === false || rawString.includes("\n");
        if (isMultiLineBlock) {
          return (
            <pre className={getPlainPreBlockClasses(previewStyle)}>
              <code className="block whitespace-pre font-mono" {...props}>
                {rawString}
              </code>
            </pre>
          );
        }

        // Case C: Single backtick inline code inside a sentence (e.g. `code`)
        return (
          <code className={getInlineCodeClasses(previewStyle)} {...props}>
            {children}
          </code>
        );
      },

      // 2. Headings (H1 to H4)
      h1: ({ children }: any) => (
        <h1 className={getHeadingClasses(previewStyle, 1)}>{children}</h1>
      ),
      h2: ({ children }: any) => (
        <h2 className={getHeadingClasses(previewStyle, 2)}>{children}</h2>
      ),
      h3: ({ children }: any) => (
        <h3 className={getHeadingClasses(previewStyle, 3)}>{children}</h3>
      ),
      h4: ({ children }: any) => (
        <h4 className={getHeadingClasses(previewStyle, 4)}>{children}</h4>
      ),

      // 3. Responsive Tables
      table: ({ children }: any) => (
        <CustomTableWrapper theme={previewStyle}>{children}</CustomTableWrapper>
      ),
      thead: ({ children }: any) => (
        <CustomThead theme={previewStyle}>{children}</CustomThead>
      ),
      tbody: ({ children }: any) => (
        <CustomTbody theme={previewStyle}>{children}</CustomTbody>
      ),
      tr: ({ children }: any) => (
        <CustomTr theme={previewStyle}>{children}</CustomTr>
      ),
      th: ({ children, style }: any) => (
        <CustomTh theme={previewStyle} style={style}>
          {children}
        </CustomTh>
      ),
      td: ({ children, style }: any) => (
        <CustomTd theme={previewStyle} style={style}>
          {children}
        </CustomTd>
      ),

      // 4. Custom Lists & GFM Checklist Items
      ul: ({ children }: any) => {
        const childrenArray = React.Children.toArray(children);
        const isTaskList = childrenArray.some((child: any) => {
          if (!child || !child.props) return false;
          return (
            child.props.checked !== undefined ||
            child.props.className?.includes("checklist-item") ||
            child.props.className?.includes("task-list-item")
          );
        });

        const textClass = {
          standard: "text-slate-700 dark:text-slate-300",
          serif: "text-[#2c2b29] dark:text-[#e3e1db]",
          newspaper: "text-[#121212] dark:text-[#ebdcb9]",
          nord: "text-[#2e3440] dark:text-[#eceff4]",
          tech: "text-[#39ff14] font-mono",
        }[previewStyle];

        if (isTaskList) {
          return (
            <ul
              className={`list-none pl-0 my-4 space-y-1.5 [&_li]:before:content-none [&_li]:before:hidden ${textClass}`}
            >
              {children}
            </ul>
          );
        }

        return (
          <ul className={getListClasses(previewStyle, false)}>{children}</ul>
        );
      },
      ol: ({ children }: any) => (
        <ol className={getListClasses(previewStyle, true)}>{children}</ol>
      ),
      li: ({ checked, children }: any) => {
        if (checked !== undefined) {
          return (
            <ChecklistItem checked={checked} theme={previewStyle}>
              {children}
            </ChecklistItem>
          );
        }
        return (
          <li className="my-1.5 leading-relaxed [&>p]:my-0">{children}</li>
        );
      },

      // 5. Blockquote
      blockquote: ({ children }: any) => (
        <CustomBlockquote theme={previewStyle}>{children}</CustomBlockquote>
      ),

      // 6. Styled Anchors & Outward Links
      a: ({ href, children }: any) => {
        const isExternal = href?.startsWith("http");
        return (
          <a
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className={getLinkClasses(previewStyle)}
          >
            {children}
            {isExternal && (
              <ExternalLink
                size={10}
                className="inline ml-0.5 opacity-70 shrink-0"
              />
            )}
          </a>
        );
      },

      // 7. Custom Fluid Image Zoom
      img: ({ src, alt, title }: any) => (
        <CustomImage src={src} alt={alt} title={title} theme={previewStyle} />
      ),

      // 8. Paragraphs
      p: ({ children }: any) => (
        <p className="my-4 first:mt-0 last:mb-0 leading-relaxed">{children}</p>
      ),

      // 9. Horizontal dividers
      hr: () => {
        const hrColor = {
          standard: "border-slate-200 dark:border-slate-800",
          serif: "border-[#eae6db] dark:border-[#2a2926]",
          newspaper: "border-[#d2c29d] dark:border-[#524935]",
          nord: "border-[#d8dee9] dark:border-[#3b4252]",
          tech: "border-[#102a18]",
        }[previewStyle];
        return <hr className={`my-8 border-t ${hrColor}`} />;
      },

      // 10. Direct video and iframe HTML support
      video: ({ src, controls, poster, width }: any) => (
        <CustomVideo
          src={src}
          controls={controls !== "false"}
          poster={poster}
          width={width}
          theme={previewStyle}
        />
      ),
      iframe: ({ src, width, height, title, style }: any) => {
        const iframeBorder = {
          standard: "border-slate-200 dark:border-slate-800",
          serif: "border-[#eae6db] dark:border-[#2a2926]",
          newspaper: "border-2 border-black dark:border-[#ebdcb9]",
          nord: "border-[#d8dee9] dark:border-[#3b4252]",
          tech: "border-[#102a18]",
        }[previewStyle];

        return (
          <div
            className={`my-6 relative w-full overflow-hidden rounded-xl border shadow-md aspect-video bg-slate-950 ${iframeBorder}`}
          >
            <iframe
              src={src}
              width="100%"
              height="100%"
              title={title || "Embedded Content"}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{
                ...style,
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
            />
          </div>
        );
      },
    }),
    [previewStyle],
  );

  return (
    <div
      dir="auto"
      className={`markdown-body select-text text-base w-full overflow-visible transition-colors duration-300 bg-transparent ${getThemeTextClasses(previewStyle)} ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={renderOverrides as any}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
export type { PreviewStyle, MarkdownRendererProps };

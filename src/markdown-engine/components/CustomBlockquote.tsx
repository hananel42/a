import React from "react";
import { PreviewStyle } from "../types";
import { getBlockquoteClasses } from "../styles";

interface CustomBlockquoteProps {
  children: React.ReactNode;
  theme: PreviewStyle;
}

export default function CustomBlockquote({
  children,
  theme,
}: CustomBlockquoteProps) {
  return (
    <blockquote className={getBlockquoteClasses(theme)}>{children}</blockquote>
  );
}

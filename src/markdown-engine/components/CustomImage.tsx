import React from "react";
import { PreviewStyle } from "../types";

interface CustomImageProps {
  src?: string;
  alt?: string;
  title?: string;
  theme: PreviewStyle;
}

export default function CustomImage({
  src,
  alt,
  title,
  theme,
}: CustomImageProps) {
  if (!src) return null;

  const captionStyle = {
    standard: "text-slate-500 border-t border-slate-100 dark:border-slate-800",
    serif: "text-[#5c5b57] border-t border-[#eae6db] font-serif italic",
    newspaper: "text-black/70 border-t border-[#d2c29d] font-serif italic",
    nord: "text-[#4c566a] border-t border-[#d8dee9]",
    tech: "text-[#39ff14]/70 border-t border-[#102a18] font-mono",
  }[theme];

  return (
    <div className="my-6 flex flex-col items-center justify-center w-full">
      <div className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs bg-white dark:bg-slate-900 max-w-full">
        <img
          src={src}
          alt={alt || "Document image"}
          title={title}
          className="block max-h-96 w-auto object-contain mx-auto"
          referrerPolicy="no-referrer"
        />
      </div>

      {alt && (
        <span
          className={`text-xs font-normal mt-2 text-center px-4 leading-relaxed max-w-xl pt-1 ${captionStyle}`}
        >
          {alt}
        </span>
      )}
    </div>
  );
}

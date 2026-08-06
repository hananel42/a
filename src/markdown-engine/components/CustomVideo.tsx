import React, { useState } from "react";
import { Film, Play } from "lucide-react";
import { PreviewStyle } from "../types";

interface CustomVideoProps {
  src?: string;
  controls?: boolean;
  width?: string;
  poster?: string;
  theme: PreviewStyle;
}

export default function CustomVideo({
  src,
  controls = true,
  poster,
  theme,
}: CustomVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!src) return null;

  const errorBorderColor = {
    standard:
      "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900",
    serif:
      "border-[#eae6db] dark:border-[#2a2926] bg-[#fbf9f3] dark:bg-[#1e1d1a]",
    newspaper:
      "border-[#d2c29d] dark:border-[#524935] bg-[#ebdcb9] dark:bg-[#1e1a14]",
    nord: "border-[#d8dee9] dark:border-[#3b4252] bg-slate-200/50 dark:bg-[#3b4252]/40",
    tech: "border-[#102a18] bg-[#001405]",
  }[theme];

  return (
    <div className="my-6 flex flex-col items-center justify-center w-full">
      {hasError ? (
        <div
          className={`flex flex-col items-center justify-center p-8 border rounded-xl w-full max-w-md text-slate-400 text-sm ${errorBorderColor}`}
        >
          <Film size={24} className="mb-2 text-slate-300 dark:text-slate-700" />
          <span>Video failed to load</span>
          <span className="text-xs text-slate-500 font-mono mt-1 truncate max-w-xs">
            {src}
          </span>
        </div>
      ) : (
        <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-md bg-slate-950">
          <video
            src={src}
            controls={controls}
            poster={poster}
            onError={() => setHasError(true)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="block w-full max-h-120 object-cover mx-auto"
          />
          {!isPlaying && !controls && (
            <button className="absolute inset-0 m-auto w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105">
              <Play size={24} fill="currentColor" className="ml-1" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

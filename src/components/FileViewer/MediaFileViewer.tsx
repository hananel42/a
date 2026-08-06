/**
 * @file MediaFileViewer.tsx
 * @description A high-fidelity media previewer for images, videos, and animated GIFs.
 * Features canvas-style backdrop, zoom controls, image rotation, and details statistics.
 *
 * API Props:
 * - fileName: Name of the file being displayed.
 * - fileUrl: URL of the file (e.g., local blob url, network url, or base64 representation).
 * - fileType: 'image' | 'video' | 'gif'.
 * - fileSize: Optional file size string (e.g. "1.2 MB").
 */

import React, { useState, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  FileImage,
  Play,
  Pause,
  RefreshCw,
} from "lucide-react";

interface MediaFileViewerProps {
  fileName: string;
  fileUrl: string;
  fileType: "image" | "video" | "gif";
  fileSize?: string;
}

export default function MediaFileViewer({
  fileName,
  fileUrl,
  fileType,
  fileSize,
}: MediaFileViewerProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [rotate, setRotate] = useState<number>(0);
  const [naturalSize, setNaturalSize] = useState<{
    w: number;
    h: number;
  } | null>(null);

  // Reset transforms on file swap
  useEffect(() => {
    setZoom(100);
    setRotate(0);
    setNaturalSize(null);
  }, [fileUrl]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25));
  const handleRotate = () => setRotate((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(100);
    setRotate(0);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  };

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full bg-slate-900 text-slate-100 overflow-hidden relative select-none">
      {/* Upper Control Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950/60 z-10">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <FileImage size={14} className="text-emerald-400" />
          <span>{fileName}</span>
          {fileSize && <span className="opacity-60">({fileSize})</span>}
          {naturalSize && (
            <span className="text-slate-500">
              • {naturalSize.w} × {naturalSize.h} px
            </span>
          )}
        </div>

        {/* Zoom & Rotation Actions for Images/GIFs */}
        {(fileType === "image" || fileType === "gif") && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-[10px] font-mono px-1 min-w-[36px] text-center text-slate-400">
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <div className="h-4 w-px bg-slate-800 mx-1" />
            <button
              onClick={handleRotate}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Rotate 90°"
            >
              <RotateCw size={14} />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer text-[10px] font-semibold"
              title="Reset Zoom & Rotation"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Main Preview Container Canvas */}
      <div className="flex-1 flex items-center justify-center p-6 relative bg-radial from-slate-900 to-slate-950 overflow-auto scrollbar-thin">
        {fileType === "video" ? (
          <div className="max-w-4xl w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800/60">
            <video
              src={fileUrl}
              controls
              autoPlay
              loop
              className="w-full h-auto max-h-[70vh]"
            />
          </div>
        ) : (
          <div
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotate}deg)`,
              transition: "transform 0.15s ease-out",
            }}
            className="flex items-center justify-center shadow-2xl max-w-full max-h-full"
          >
            <img
              src={fileUrl}
              alt={fileName}
              onLoad={handleImageLoad}
              referrerPolicy="no-referrer"
              className="max-w-[85vw] max-h-[70vh] object-contain rounded-lg border border-slate-800/80 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjM2E0MDRlIi8+CjxyZWN0IHg9IjQiIHk9IjQiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMzYTQwNGUiLz4KPHJlY3QgeD0iNCIgd2lkdGg9IjQiIGhlaWdodD0iNCIgZmlsbD0iIzE4MjIyYSIvPgo8cmVjdCB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMTgyMjJhIi8+Cjwvc3ZnPg==')] bg-repeat"
            />
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex justify-between select-none">
        <span>File Preview Engine active</span>
        <span>Secure Sandboxed Sandbox Player</span>
      </div>
    </div>
  );
}

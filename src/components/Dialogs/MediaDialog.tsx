import React, { useState } from "react";
import { Image, Video, Youtube, Film } from "lucide-react";
import BaseDialog from "./BaseDialog";

interface MediaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: {
    type: "image" | "video" | "youtube";
    url: string;
    altOrId: string;
    poster?: string;
  }) => void;
}

export function MediaDialog({ isOpen, onClose, onSubmit }: MediaDialogProps) {
  const [activeTab, setActiveTab] = useState<"image" | "video" | "youtube">(
    "image",
  );
  const [url, setUrl] = useState("");
  const [altOrId, setAltOrId] = useState("");
  const [posterUrl, setPosterUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    onSubmit({
      type: activeTab,
      url,
      altOrId:
        altOrId ||
        (activeTab === "image"
          ? "Document Image"
          : activeTab === "youtube"
            ? "dQw4w9WgXcQ"
            : "My Video"),
      poster: activeTab === "video" ? posterUrl : undefined,
    });

    // Clear state
    setUrl("");
    setAltOrId("");
    setPosterUrl("");
    onClose();
  };

  const setPreset = (type: "image" | "video" | "youtube") => {
    setActiveTab(type);
    if (type === "image") {
      setUrl(
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800",
      );
      setAltOrId("Deep Space Exploration Nebula");
    } else if (type === "video") {
      setUrl(
        "https://assets.mixkit.co/videos/preview/mixkit-starry-night-sky-over-a-lone-tree-43033-large.mp4",
      );
      setAltOrId("Starry Night Sky over Lone Tree");
      setPosterUrl(
        "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=600",
      );
    } else {
      setUrl("dQw4w9WgXcQ");
      setAltOrId("Never Gonna Give You Up");
    }
  };

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Embed Media Asset"
      icon={<Video size={18} />}
    >
      {/* Tabs */}
      <div className="flex border-b border-[var(--theme-border,#141d30)] mb-4 pb-1">
        <button
          type="button"
          onClick={() => {
            setActiveTab("image");
            setUrl("");
            setAltOrId("");
          }}
          className={`flex-1 pb-2 text-sm font-semibold border-b-2 text-center transition-all cursor-pointer ${activeTab === "image" ? "border-[var(--theme-accent,#6366f1)] text-[var(--theme-accent,#6366f1)]" : "border-transparent text-[var(--theme-text-muted,#94a3b8)] hover:text-[var(--theme-text,#f1f5f9)]"}`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Image size={14} />
            Image
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("video");
            setUrl("");
            setAltOrId("");
          }}
          className={`flex-1 pb-2 text-sm font-semibold border-b-2 text-center transition-all cursor-pointer ${activeTab === "video" ? "border-[var(--theme-accent,#6366f1)] text-[var(--theme-accent,#6366f1)]" : "border-transparent text-[var(--theme-text-muted,#94a3b8)] hover:text-[var(--theme-text,#f1f5f9)]"}`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Film size={14} />
            Video Tag
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("youtube");
            setUrl("");
            setAltOrId("");
          }}
          className={`flex-1 pb-2 text-sm font-semibold border-b-2 text-center transition-all cursor-pointer ${activeTab === "youtube" ? "border-[var(--theme-accent,#6366f1)] text-[var(--theme-accent,#6366f1)]" : "border-transparent text-[var(--theme-text-muted,#94a3b8)] hover:text-[var(--theme-text,#f1f5f9)]"}`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Youtube size={14} />
            YouTube
          </span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Presets */}
        <div className="flex items-center justify-between text-xs bg-[var(--theme-bg,#070c18)] p-2.5 rounded-lg border border-[var(--theme-border,#141d30)]">
          <span className="text-[var(--theme-text-muted,#94a3b8)] font-medium">Quick Demo Preset:</span>
          <button
            type="button"
            onClick={() => setPreset(activeTab)}
            className="text-[var(--theme-accent,#6366f1)] font-semibold hover:underline cursor-pointer"
          >
            Load Sample{" "}
            {activeTab === "image"
              ? "Image"
              : activeTab === "video"
                ? "Video"
                : "YouTube ID"}
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--theme-text-muted,#94a3b8)] uppercase tracking-wider mb-1.5">
            {activeTab === "youtube"
              ? "YouTube Video ID or Link"
              : "Media Source URL"}
          </label>
          <input
            type="text"
            required
            placeholder={
              activeTab === "image"
                ? "https://images.unsplash.com/..."
                : activeTab === "video"
                  ? "https://example.com/video.mp4"
                  : "e.g. dQw4w9WgXcQ"
            }
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-[var(--theme-border,#141d30)] bg-[var(--theme-bg,#070c18)] text-[var(--theme-text,#f1f5f9)] text-sm focus:outline-none focus:border-[var(--theme-accent,#6366f1)] transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--theme-text-muted,#94a3b8)] uppercase tracking-wider mb-1.5">
            {activeTab === "image"
              ? "Alt Text / Caption"
              : activeTab === "youtube"
                ? "Video Title"
                : "Video Title / Tag"}
          </label>
          <input
            type="text"
            placeholder={
              activeTab === "image"
                ? "Describe the image..."
                : "Enter a helpful name..."
            }
            value={altOrId}
            onChange={(e) => setAltOrId(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-[var(--theme-border,#141d30)] bg-[var(--theme-bg,#070c18)] text-[var(--theme-text,#f1f5f9)] text-sm focus:outline-none focus:border-[var(--theme-accent,#6366f1)] transition-colors"
          />
        </div>

        {activeTab === "video" && (
          <div>
            <label className="block text-xs font-semibold text-[var(--theme-text-muted,#94a3b8)] uppercase tracking-wider mb-1.5">
              Poster Thumbnail Image URL (Optional)
            </label>
            <input
              type="text"
              placeholder="https://images.unsplash.com/..."
              value={posterUrl}
              onChange={(e) => setPosterUrl(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[var(--theme-border,#141d30)] bg-[var(--theme-bg,#070c18)] text-[var(--theme-text,#f1f5f9)] text-sm focus:outline-none focus:border-[var(--theme-accent,#6366f1)] transition-colors"
            />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[var(--theme-border,#141d30)] hover:bg-[var(--theme-card-hover,#1a2438)] text-[var(--theme-text-muted,#94a3b8)] hover:text-[var(--theme-text,#f1f5f9)] text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-xl bg-[var(--theme-accent,#6366f1)] hover:opacity-90 text-white text-sm font-semibold transition-colors shadow-xs cursor-pointer"
          >
            Insert Media
          </button>
        </div>
      </form>
    </BaseDialog>
  );
}

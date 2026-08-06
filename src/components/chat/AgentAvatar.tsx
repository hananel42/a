/**
 * @file AgentAvatar.tsx
 * @description Helper component for rendering agent avatars with clean, high-contrast SVG icons or letter fallbacks.
 */

import React from "react";
import {
  Crown,
  Briefcase,
  Code2,
  Folder,
  Search,
  Brain,
  Settings,
  Terminal,
  Cpu,
  Shield,
  Activity,
} from "lucide-react";

interface AgentAvatarProps {
  avatar?: string;
  name: string;
  className?: string;
  size?: number;
}

export function renderAgentAvatar(
  avatar: string | undefined,
  name: string,
  size = 14,
) {
  const av = (avatar || "").toLowerCase().trim();
  const iconProps = { size, className: "stroke-[2.5px]" };

  if (av === "crown") return <Crown {...iconProps} />;
  if (av === "briefcase") return <Briefcase {...iconProps} />;
  if (av === "code") return <Code2 {...iconProps} />;
  if (av === "folder") return <Folder {...iconProps} />;
  if (av === "search") return <Search {...iconProps} />;
  if (av === "brain") return <Brain {...iconProps} />;
  if (av === "settings") return <Settings {...iconProps} />;
  if (av === "terminal") return <Terminal {...iconProps} />;
  if (av === "cpu") return <Cpu {...iconProps} />;
  if (av === "shield") return <Shield {...iconProps} />;
  if (av === "activity") return <Activity {...iconProps} />;

  const letter = name ? name.trim().charAt(0).toUpperCase() : "?";
  return (
    <span className="text-[11px] font-extrabold font-mono select-none">
      {letter}
    </span>
  );
}

export default function AgentAvatar({
  avatar,
  name,
  className = "",
  size = 14,
}: AgentAvatarProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {renderAgentAvatar(avatar, name, size)}
    </div>
  );
}

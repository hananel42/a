/**
 * @file theme.ts
 * @description Centralized Theme Management System.
 * Defines unified application themes (combining UI dark/light modes with typography & color palettes).
 */

export type AppThemeId =
  | "twilight"
  | "clean-light"
  | "nordic-polar"
  | "editorial-warm"
  | "terminal-matrix"
  | "midnight-emerald"
  | "cyber-cobalt";

export interface AppTheme {
  id: string;
  name: string;
  mode: "dark" | "light";
  description: string;
  markdownStyle: "standard" | "serif" | "newspaper" | "nord" | "tech";
  isCustom?: boolean;
  previewColor: {
    bg: string;
    sidebar: string;
    card: string;
    accent: string;
    text: string;
    border?: string;
    textMuted?: string;
  };
}

export const APP_THEMES: AppTheme[] = [
  {
    id: "twilight",
    name: "Obsidian Charcoal",
    mode: "dark",
    description: "Sleek, modern charcoal dark theme with vibrant indigo accents and easy-on-the-eyes contrast.",
    markdownStyle: "standard",
    previewColor: {
      bg: "#09090b",
      sidebar: "#121215",
      card: "#18181b",
      accent: "#6366f1",
      text: "#f4f4f5",
      border: "#27272a",
      textMuted: "#a1a1aa",
    },
  },
  {
    id: "clean-light",
    name: "Clean Light",
    mode: "light",
    description: "Crisp white canvas with high-contrast text and indigo highlights.",
    markdownStyle: "standard",
    previewColor: {
      bg: "#f8fafc",
      sidebar: "#f1f5f9",
      card: "#ffffff",
      accent: "#4f46e5",
      text: "#0f172a",
      border: "#e2e8f0",
      textMuted: "#64748b",
    },
  },
  {
    id: "editorial-warm",
    name: "Warm Editorial",
    mode: "light",
    description: "Soft warm parchment paper with elegant serif typography.",
    markdownStyle: "serif",
    previewColor: {
      bg: "#fcfbf7",
      sidebar: "#f5f0e6",
      card: "#ffffff",
      accent: "#d97706",
      text: "#2c2b29",
      border: "#e7e2d7",
      textMuted: "#78716c",
    },
  },
  {
    id: "nordic-polar",
    name: "Nordic Frost",
    mode: "dark",
    description: "Calming arctic polar blue palette inspired by Nord.",
    markdownStyle: "nord",
    previewColor: {
      bg: "#2e3440",
      sidebar: "#282c37",
      card: "#3b4252",
      accent: "#88c0d0",
      text: "#eceff4",
      border: "#434c5e",
      textMuted: "#d8dee9",
    },
  },
  {
    id: "terminal-matrix",
    name: "Terminal Phosphor",
    mode: "dark",
    description: "Retro terminal with glowing phosphor green on dark matrix.",
    markdownStyle: "tech",
    previewColor: {
      bg: "#050a06",
      sidebar: "#030704",
      card: "#0a140d",
      accent: "#39ff14",
      text: "#39ff14",
      border: "#0e2413",
      textMuted: "#22c55e",
    },
  },
  {
    id: "midnight-emerald",
    name: "Midnight Emerald",
    mode: "dark",
    description: "Tranquil deep forest emerald green canvas.",
    markdownStyle: "standard",
    previewColor: {
      bg: "#06140e",
      sidebar: "#040e0a",
      card: "#0b2118",
      accent: "#10b981",
      text: "#ecfdf5",
      border: "#113829",
      textMuted: "#6ee7b7",
    },
  },
  {
    id: "cyber-cobalt",
    name: "Cyber Cobalt",
    mode: "dark",
    description: "High-contrast midnight cobalt blue with vibrant cyan accents.",
    markdownStyle: "standard",
    previewColor: {
      bg: "#0b132b",
      sidebar: "#080e21",
      card: "#1c2541",
      accent: "#06b6d4",
      text: "#e0e6ed",
      border: "#23335a",
      textMuted: "#94a3b8",
    },
  },
];

export const DEFAULT_THEME_ID = "twilight";

/** Custom themes helper methods */
export function getCustomThemes(): AppTheme[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("agent_hub_custom_themes");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomTheme(theme: AppTheme): AppTheme[] {
  const custom = getCustomThemes();
  const existingIdx = custom.findIndex((t) => t.id === theme.id);
  let updated: AppTheme[];
  if (existingIdx >= 0) {
    updated = [...custom];
    updated[existingIdx] = { ...theme, isCustom: true };
  } else {
    updated = [...custom, { ...theme, isCustom: true }];
  }
  localStorage.setItem("agent_hub_custom_themes", JSON.stringify(updated));
  return updated;
}

export function deleteCustomTheme(id: string): AppTheme[] {
  const custom = getCustomThemes();
  const updated = custom.filter((t) => t.id !== id);
  localStorage.setItem("agent_hub_custom_themes", JSON.stringify(updated));
  return updated;
}

export function getAllThemes(): AppTheme[] {
  return [...APP_THEMES, ...getCustomThemes()];
}

export function getThemeById(id: string): AppTheme {
  const all = getAllThemes();
  const found = all.find((t) => t.id === id);
  return found || APP_THEMES[0];
}

export function hexToRgba(hex: string, alpha: number): string {
  if (!hex || typeof hex !== "string") return `rgba(16, 185, 129, ${alpha})`;
  let clean = hex.replace("#", "");
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function adjustBrightness(hex: string, percent: number): string {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) return hex || "#18181b";
  let num = parseInt(hex.replace("#", ""), 16);
  if (isNaN(num)) return hex;
  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function applyThemeToDocument(theme: AppTheme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.setAttribute("data-theme", theme.id);

  if (theme.mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // Inject dynamic CSS variables for app-wide reactivity
  const bg = theme.previewColor.bg;
  const sidebar = theme.previewColor.sidebar;
  const card = theme.previewColor.card;
  const accent = theme.previewColor.accent;
  const text = theme.previewColor.text;
  const border =
    theme.previewColor.border ||
    (theme.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)");
  const textMuted =
    theme.previewColor.textMuted ||
    (theme.mode === "dark" ? "#94a3b8" : "#64748b");

  const cardHover =
    theme.mode === "dark"
      ? adjustBrightness(card, 8)
      : adjustBrightness(card, -5);
  const accentHover = adjustBrightness(accent, theme.mode === "dark" ? 10 : -10);
  const accentSubtle = hexToRgba(accent, 0.15);

  root.style.setProperty("--theme-bg", bg);
  root.style.setProperty("--theme-sidebar", sidebar);
  root.style.setProperty("--theme-card", card);
  root.style.setProperty("--theme-card-hover", cardHover);
  root.style.setProperty("--theme-border", border);
  root.style.setProperty("--theme-text", text);
  root.style.setProperty("--theme-text-muted", textMuted);
  root.style.setProperty("--theme-accent", accent);
  root.style.setProperty("--theme-accent-hover", accentHover);
  root.style.setProperty("--theme-accent-subtle", accentSubtle);
}

export function getThemeBgClass(style: string): string {
  switch (style) {
    case "serif":
      return "bg-[#fcfbf7] dark:bg-[#161614]";
    case "newspaper":
      return "bg-[#f5ebd2] dark:bg-[#1e1a14]";
    case "nord":
      return "bg-[#f0f4f8] dark:bg-[#2e3440]";
    case "tech":
      return "bg-[#060a07]";
    case "standard":
    default:
      return "bg-[var(--theme-bg,#09090b)] text-[var(--theme-text,#f4f4f5)]";
  }
}

export function getThemeClasses(style: string): string {
  return "";
}

export function getThemeExportCSS(previewStyle: string): string {
  return `
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #334155;
      background-color: #ffffff;
      margin: 0;
      padding: 2rem;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }
    h1, h2, h3, h4, h5, h6 { color: #0f172a; margin-top: 1.5em; margin-bottom: 0.5em; }
    code { background: #f1f5f9; padding: 0.2em 0.4em; border-radius: 4px; font-family: monospace; }
    pre { background: #0f172a; color: #f8fafc; padding: 1rem; border-radius: 8px; overflow-x: auto; }
    blockquote { border-left: 4px solid #6366f1; padding-left: 1rem; color: #64748b; font-style: italic; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
    th { background: #f8fafc; }
  `;
}

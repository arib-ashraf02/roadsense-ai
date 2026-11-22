/**
 * RoadSense AI — Core Theme Customization System
 * Defines the 4 official premium themes:
 * 1. Midnight Blue (DEFAULT)
 * 2. Cyber Purple
 * 3. Emerald Tech
 * 4. Graphite
 */

export const THEMES = [
  {
    id: "midnight-blue",
    name: "Midnight Blue",
    subtitle: "Deep Navy & Electric Cyan",
    mode: "dark",
    isDefault: true,
    description: "Deep navy background with electric blue and cyan accents, subtle glowing borders, and futuristic AI command aesthetics.",
    colors: {
      primary: "#3B82F6",
      primaryHover: "#2563EB",
      primarySoft: "#1E293B",
      background: "#070B19",
      card: "#0D1527",
      border: "#1A2642",
      foreground: "#F1F5F9",
      muted: "#94A3B8",
      accent: "#00F2FE",
      glow: "rgba(59, 130, 246, 0.35)",
      gridColor: "rgba(59, 130, 246, 0.08)",
      auroraA: "rgba(59, 130, 246, 0.18)",
      auroraB: "rgba(0, 242, 254, 0.12)",
    },
    preview: {
      swatches: ["#3B82F6", "#00F2FE", "#F1F5F9", "#070B19"],
      bgPreview: "#070B19",
      cardPreview: "#0D1527",
      textPreview: "#F1F5F9",
      accentPreview: "#3B82F6",
    },
    chart: {
      low: "#00F2FE",
      medium: "#3B82F6",
      high: "#F59E0B",
      critical: "#EF4444",
      primary: "#3B82F6",
      secondary: "#00F2FE",
    },
  },
  {
    id: "cyber-purple",
    name: "Cyber Purple",
    subtitle: "Cosmic Violet & Lavender",
    mode: "dark",
    description: "Deep purple background with violet and lavender gradients, subtle neon purple highlights, and high-contrast telemetry.",
    colors: {
      primary: "#A855F7",
      primaryHover: "#9333EA",
      primarySoft: "#25143E",
      background: "#0B0718",
      card: "#150E2A",
      border: "#2E1E54",
      foreground: "#FAF5FF",
      muted: "#C084FC",
      accent: "#F43F5E",
      glow: "rgba(168, 85, 247, 0.35)",
      gridColor: "rgba(168, 85, 247, 0.08)",
      auroraA: "rgba(168, 85, 247, 0.2)",
      auroraB: "rgba(244, 63, 94, 0.12)",
    },
    preview: {
      swatches: ["#A855F7", "#F43F5E", "#FAF5FF", "#0B0718"],
      bgPreview: "#0B0718",
      cardPreview: "#150E2A",
      textPreview: "#FAF5FF",
      accentPreview: "#A855F7",
    },
    chart: {
      low: "#34D399",
      medium: "#A855F7",
      high: "#F43F5E",
      critical: "#FF0055",
      primary: "#A855F7",
      secondary: "#F43F5E",
    },
  },
  {
    id: "emerald-tech",
    name: "Emerald Tech",
    subtitle: "Bio-Digital Forest & Turquoise",
    mode: "dark",
    description: "Deep green background with emerald and turquoise accents, modern technology-inspired phosphor glows, and crisp contrast.",
    colors: {
      primary: "#10B981",
      primaryHover: "#059669",
      primarySoft: "#0B2E21",
      background: "#03120C",
      card: "#072117",
      border: "#114532",
      foreground: "#ECFDF5",
      muted: "#6EE7B7",
      accent: "#06B6D4",
      glow: "rgba(16, 185, 129, 0.35)",
      gridColor: "rgba(16, 185, 129, 0.08)",
      auroraA: "rgba(16, 185, 129, 0.18)",
      auroraB: "rgba(6, 182, 212, 0.12)",
    },
    preview: {
      swatches: ["#10B981", "#06B6D4", "#ECFDF5", "#03120C"],
      bgPreview: "#03120C",
      cardPreview: "#072117",
      textPreview: "#ECFDF5",
      accentPreview: "#10B981",
    },
    chart: {
      low: "#06B6D4",
      medium: "#10B981",
      high: "#F59E0B",
      critical: "#EF4444",
      primary: "#10B981",
      secondary: "#06B6D4",
    },
  },
  {
    id: "graphite",
    name: "Graphite",
    subtitle: "Minimal Noir & Titanium Slate",
    mode: "dark",
    description: "Dark graphite background with neutral grey surfaces, subtle blue highlights, and a minimal high-end professional appearance.",
    colors: {
      primary: "#E2E8F0",
      primaryHover: "#FFFFFF",
      primarySoft: "#1E242E",
      background: "#0B0D11",
      card: "#14181F",
      border: "#262D38",
      foreground: "#F3F4F6",
      muted: "#9CA3AF",
      accent: "#38BDF8",
      glow: "rgba(56, 189, 248, 0.25)",
      gridColor: "rgba(226, 232, 240, 0.06)",
      auroraA: "rgba(56, 189, 248, 0.12)",
      auroraB: "rgba(226, 232, 240, 0.08)",
    },
    preview: {
      swatches: ["#E2E8F0", "#38BDF8", "#F3F4F6", "#0B0D11"],
      bgPreview: "#0B0D11",
      cardPreview: "#14181F",
      textPreview: "#F3F4F6",
      accentPreview: "#E2E8F0",
    },
    chart: {
      low: "#9CA3AF",
      medium: "#38BDF8",
      high: "#F59E0B",
      critical: "#EF4444",
      primary: "#E2E8F0",
      secondary: "#38BDF8",
    },
  },
];

export const DEFAULT_THEME_ID = "midnight-blue";
export const THEME_STORAGE_KEY = "roadsense_theme";

export function getThemeConfig(themeId) {
  const found = THEMES.find((t) => t.id === themeId);
  return found || THEMES[0];
}

/**
 * Brand palette, mirrored from voyage-app/tailwind.config.ts so the video
 * looks continuous with the running app.
 */
export const theme = {
  colors: {
    yellow: "#FBCC33",
    yellowLight: "#FDD85D",
    yellowDark: "#E5B800",
    yellowSoft: "#FFF3C2",
    navy: "#1A1F3A",
    navyLight: "#2A2F55",
    navyDark: "#0F1223",
    dark: "#191A1F",
    darkCard: "#222328",
    darkSurface: "#2A2B31",
    white: "#ffffff",
    muted: "rgba(255,255,255,0.65)",
    mutedStrong: "rgba(255,255,255,0.85)",
    mutedFaint: "rgba(255,255,255,0.35)",
  },
  font: {
    sans: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  },
  /** Standard 1920x1080 layout. */
  layout: {
    width: 1920,
    height: 1080,
    fps: 30,
  },
} as const;

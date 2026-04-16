/**
 * Brand palette, mirrored from voyage-app/tailwind.config.ts.
 *
 * The video uses a yellow-dominant palette — the hero brand color becomes
 * the canvas, and everything else mirrors that. Semantic tokens under
 * `semantic` encode the intended role of each color so scenes can stay
 * readable without referencing hex values directly.
 */
export const theme = {
  colors: {
    // Brand palette (raw hex values; use `semantic.*` below when possible)
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
  },
  /**
   * Semantic tokens — name = intended role. Scenes should prefer these
   * over raw palette hex so recoloring the whole video takes one edit here.
   */
  semantic: {
    // Base scene canvas
    bg: "#FBCC33",
    bgSoft: "#FFF3C2",
    bgDeep: "#E5B800",
    // Text on the yellow canvas
    text: "#0F1223",
    textStrong: "rgba(15, 18, 35, 0.9)",
    textMuted: "rgba(15, 18, 35, 0.65)",
    textFaint: "rgba(15, 18, 35, 0.35)",
    // Accents on the yellow canvas (eyebrows, dots, dividers)
    accent: "#0F1223",
    accentSoft: "rgba(15, 18, 35, 0.55)",
    // Mock "app" panels — off-white cards sitting on the yellow canvas
    panelBg: "rgba(255, 253, 244, 0.96)",
    panelBorder: "rgba(15, 18, 35, 0.14)",
    panelShadow: "0 30px 70px rgba(15, 18, 35, 0.18)",
    panelText: "#0F1223",
    panelTextMuted: "rgba(15, 18, 35, 0.6)",
    panelTextFaint: "rgba(15, 18, 35, 0.35)",
    panelAccent: "#E5B800",
    panelInput: "rgba(15, 18, 35, 0.04)",
    panelInputBorder: "rgba(15, 18, 35, 0.18)",
    panelInputFocus: "#E5B800",
    // Elements that should stay navy-dark against yellow (globe, flight arc)
    navyFill: "#1A1F3A",
    navyFillDeep: "#0F1223",
    navyFillLight: "#2A2F55",
    // Continent fill on the navy globe — bright yellow to stand out
    continent: "#FDD85D",
    continentStroke: "rgba(15, 18, 35, 0.35)",
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

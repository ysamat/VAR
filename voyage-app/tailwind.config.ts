import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Expedia-inspired palette
        brand: {
          yellow: "#FBCC33",
          "yellow-light": "#FDD85D",
          "yellow-dark": "#E5B800",
          "yellow-soft": "#FFF3C2",
          // Matches the navy in public/logo.png
          navy: "#1A1F3A",
          "navy-light": "#2A2F55",
          "navy-dark": "#0F1223",
          dark: "#191A1F",
          "dark-card": "#222328",
          "dark-surface": "#2A2B31",
        },
      },
    },
  },
  plugins: [],
};

export default config;

import React from "react";
import { theme } from "../theme";

/**
 * Simplified recreation of the app's review-card surface. Matches the
 * brand-dark-card + brand-yellow accents so on-screen "app" visuals stay
 * consistent with the real product.
 */
export function MockPanel({
  children,
  width = 680,
  style,
}: {
  children: React.ReactNode;
  width?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width,
        borderRadius: 24,
        border: `1px solid rgba(251, 204, 51, 0.22)`,
        background: "rgba(34, 35, 40, 0.94)",
        padding: "36px 40px",
        boxShadow: "0 40px 80px rgba(15, 18, 35, 0.6)",
        backdropFilter: "blur(12px)",
        fontFamily: theme.font.sans,
        color: theme.colors.white,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function MockTextarea({
  text,
  placeholder,
  focused,
}: {
  text: string;
  placeholder?: string;
  focused?: boolean;
}) {
  return (
    <div
      style={{
        minHeight: 88,
        padding: "12px 16px",
        borderRadius: 12,
        border: `1px solid ${focused ? theme.colors.yellow : "rgba(255,255,255,0.15)"}`,
        background: "rgba(25, 26, 31, 0.7)",
        fontSize: 22,
        color: text ? theme.colors.white : theme.colors.mutedFaint,
        lineHeight: 1.4,
        transition: "border-color 0.2s",
      }}
    >
      {text || placeholder}
      {focused && (
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: 22,
            background: theme.colors.yellow,
            marginLeft: 3,
            verticalAlign: "middle",
            animation: "blink 1s steps(2) infinite",
          }}
        />
      )}
    </div>
  );
}

export function MockEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 14,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: theme.colors.yellow,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

import React from "react";
import { theme } from "../theme";

/**
 * Simplified recreation of the app's review-card surface. Rendered as a
 * light off-white card so it reads cleanly on the yellow canvas.
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
        border: `1px solid ${theme.semantic.panelBorder}`,
        background: theme.semantic.panelBg,
        padding: "36px 40px",
        boxShadow: theme.semantic.panelShadow,
        fontFamily: theme.font.sans,
        color: theme.semantic.panelText,
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
        border: `1px solid ${focused ? theme.semantic.panelInputFocus : theme.semantic.panelInputBorder}`,
        background: theme.semantic.panelInput,
        fontSize: 22,
        color: text ? theme.semantic.panelText : theme.semantic.panelTextFaint,
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
            background: theme.semantic.panelAccent,
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
        color: theme.semantic.panelAccent,
        fontWeight: 700,
      }}
    >
      {children}
    </div>
  );
}

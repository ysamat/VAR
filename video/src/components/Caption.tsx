import React from "react";
import { theme } from "../theme";
import { AnimatedText } from "./AnimatedText";

type CaptionProps = {
  children: React.ReactNode;
  startFrame?: number;
  eyebrow?: string;
  accent?: boolean;
};

/**
 * Bottom-band caption used for narration text across scenes. Consistent
 * placement keeps the viewer's eyes anchored as scenes change.
 */
export function Caption({ children, startFrame, eyebrow, accent }: CaptionProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 90,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        paddingLeft: 120,
        paddingRight: 120,
        textAlign: "center",
      }}
    >
      {eyebrow && (
        <AnimatedText
          startFrame={startFrame}
          durationFrames={15}
          style={{
            fontSize: 22,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: theme.colors.yellow,
            fontWeight: 600,
          }}
        >
          {eyebrow}
        </AnimatedText>
      )}
      <AnimatedText
        startFrame={(startFrame ?? 0) + (eyebrow ? 8 : 0)}
        durationFrames={22}
        style={{
          fontSize: 52,
          fontWeight: 500,
          lineHeight: 1.2,
          color: accent ? theme.colors.yellow : theme.colors.white,
          maxWidth: 1400,
        }}
      >
        {children}
      </AnimatedText>
    </div>
  );
}

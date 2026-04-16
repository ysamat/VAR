import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { AnimatedText } from "../components/AnimatedText";

/**
 * Scene 01 — Hook (10s / 300 frames)
 * Opens the emotional arc: you had a trip, now a review email arrives.
 */
export function Scene01_Hook() {
  const frame = useCurrentFrame();

  // Slow background "zoom in" to add life to static text
  const bgScale = interpolate(frame, [0, 300], [1, 1.08], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 30%, ${theme.semantic.bgSoft} 0%, ${theme.semantic.bg} 55%, ${theme.semantic.bgDeep} 100%)`,
        fontFamily: theme.font.sans,
      }}
    >
      <AbsoluteFill
        style={{
          transform: `scale(${bgScale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          padding: 120,
          textAlign: "center",
        }}
      >
        <AnimatedText
          startFrame={15}
          durationFrames={30}
          style={{
            fontSize: 84,
            fontWeight: 600,
            color: theme.semantic.text,
            maxWidth: 1400,
            lineHeight: 1.1,
          }}
        >
          You just got back from a trip.
        </AnimatedText>

        <AnimatedText
          startFrame={105}
          durationFrames={24}
          style={{
            fontSize: 42,
            fontWeight: 400,
            color: theme.semantic.textMuted,
          }}
        >
          A week of memories. Photos. Stories.
        </AnimatedText>

        <AnimatedText
          startFrame={195}
          durationFrames={22}
          style={{
            fontSize: 36,
            fontWeight: 500,
            color: theme.semantic.accent,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            marginTop: 40,
          }}
        >
          Then the email arrives.
        </AnimatedText>

        <AnimatedText
          startFrame={240}
          durationFrames={22}
          bounce
          style={{
            fontSize: 56,
            fontWeight: 500,
            color: theme.semantic.panelText,
            background: theme.semantic.panelBg,
            padding: "20px 40px",
            borderRadius: 14,
            border: `1px solid ${theme.semantic.panelBorder}`,
            boxShadow: theme.semantic.panelShadow,
          }}
        >
          ⭐⭐⭐⭐⭐ Rate your stay.
        </AnimatedText>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

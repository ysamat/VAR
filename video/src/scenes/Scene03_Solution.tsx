import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";
import { Brand } from "../components/Brand";
import { AnimatedText } from "../components/AnimatedText";

/**
 * Scene 03 — Solution reveal (15s / 450 frames)
 * Introduces the brand with a logo pop and the positioning line.
 */
export function Scene03_Solution() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoPop = spring({
    frame: frame - 20,
    fps,
    config: { damping: 12, stiffness: 120 },
  });

  const logoOpacity = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${theme.semantic.bgSoft} 0%, ${theme.semantic.bg} 50%, ${theme.semantic.bgDeep} 100%)`,
        fontFamily: theme.font.sans,
      }}
    >
      {/* Soft radial glow behind the logo for brand feel */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 42%, rgba(255, 253, 244, 0.55) 0%, transparent 55%)`,
        }}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          padding: "80px 120px 140px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${0.85 + logoPop * 0.15})`,
          }}
        >
          <Brand size={580} showText={false} />
        </div>

        <AnimatedText
          startFrame={90}
          durationFrames={22}
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: theme.semantic.accent,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
          }}
        >
          Vacation Augmented Reviews
        </AnimatedText>

        <AnimatedText
          startFrame={200}
          durationFrames={30}
          style={{
            fontSize: 48,
            fontWeight: 500,
            color: theme.semantic.textStrong,
            maxWidth: 1400,
            lineHeight: 1.3,
          }}
        >
          Relive your trip. Review what mattered.
        </AnimatedText>

        <AnimatedText
          startFrame={300}
          durationFrames={28}
          style={{
            fontSize: 32,
            fontWeight: 400,
            color: theme.semantic.textMuted,
            maxWidth: 1200,
            lineHeight: 1.5,
          }}
        >
          A cinematic reviewing experience that turns your thoughts into
          structured insight — for you, for hotels, and for every future
          traveler.
        </AnimatedText>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

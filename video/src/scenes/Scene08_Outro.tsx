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
 * Scene 08 — The loop & outro (20s / 600 frames)
 * Closes with the value prop for all three stakeholders, then the brand.
 */
export function Scene08_Outro() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const beats = [
    {
      eyebrow: "For guests",
      body: "Reviewing that actually means something.",
      start: 10,
    },
    {
      eyebrow: "For hotels",
      body: "Reviews that actually teach them.",
      start: 90,
    },
    {
      eyebrow: "For future travelers",
      body: "Decisions based on signal, not stars.",
      start: 170,
    },
  ];

  const brandPop = spring({
    frame: frame - 290,
    fps,
    config: { damping: 14, stiffness: 110 },
  });
  const brandOpacity = interpolate(frame, [290, 340], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 40%, ${theme.semantic.bgSoft} 0%, ${theme.semantic.bg} 60%, ${theme.semantic.bgDeep} 100%)`,
        fontFamily: theme.font.sans,
      }}
    >
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 50,
          padding: 120,
        }}
      >
        {/* Three value prop beats, staggered */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 38,
            alignItems: "center",
            opacity: interpolate(frame, [260, 320], [1, 0.4], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {beats.map((b) => {
            const local = frame - b.start;
            const op = interpolate(local, [0, 26], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const ty = interpolate(local, [0, 26], [20, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={b.eyebrow}
                style={{
                  opacity: op,
                  transform: `translateY(${ty}px)`,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 36,
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    color: theme.semantic.accent,
                    fontWeight: 700,
                    minWidth: 400,
                    textAlign: "right",
                  }}
                >
                  {b.eyebrow}
                </div>
                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 500,
                    color: theme.semantic.text,
                  }}
                >
                  {b.body}
                </div>
              </div>
            );
          })}
        </div>

        {/* Brand reveal at the end */}
        <div
          style={{
            opacity: brandOpacity,
            transform: `scale(${0.85 + brandPop * 0.15})`,
            marginTop: 80,
          }}
        >
          <Brand size={160} />
        </div>

        <AnimatedText
          startFrame={380}
          durationFrames={28}
          style={{
            fontSize: 34,
            fontWeight: 500,
            color: theme.semantic.textStrong,
            letterSpacing: "0.04em",
          }}
        >
          expedia-var.vercel.app
        </AnimatedText>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

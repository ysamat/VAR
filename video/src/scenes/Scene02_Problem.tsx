import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { AnimatedText } from "../components/AnimatedText";

/**
 * Scene 02 — Problem (20s / 600 frames)
 * Articulates what's broken about the review status quo.
 */
export function Scene02_Problem() {
  const frame = useCurrentFrame();

  const bullets = [
    {
      label: "Generic",
      body: "\"Great stay, clean rooms.\"",
      start: 90,
    },
    {
      label: "Forgettable",
      body: "No specifics. No context.",
      start: 180,
    },
    {
      label: "Unhelpful",
      body: "Hotels can't tell what actually worked.",
      start: 270,
    },
    {
      label: "Polarized",
      body: "Five stars or one. Nothing in between.",
      start: 360,
    },
  ];

  return (
    <AbsoluteFill
      style={{
        background: theme.colors.dark,
        fontFamily: theme.font.sans,
      }}
    >
      <AbsoluteFill
        style={{
          padding: "140px 180px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 32,
        }}
      >
        <AnimatedText
          startFrame={0}
          durationFrames={24}
          style={{
            fontSize: 26,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: theme.colors.yellow,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          The problem
        </AnimatedText>

        <AnimatedText
          startFrame={18}
          durationFrames={28}
          style={{
            fontSize: 72,
            fontWeight: 600,
            color: theme.colors.white,
            marginBottom: 40,
            lineHeight: 1.1,
          }}
        >
          Reviews today are broken.
        </AnimatedText>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {bullets.map((b) => {
            const local = frame - b.start;
            const opacity = interpolate(local, [0, 20], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const translateX = interpolate(local, [0, 20], [-40, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={b.label}
                style={{
                  opacity,
                  transform: `translateX(${translateX}px)`,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 32,
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    background: theme.colors.yellow,
                    alignSelf: "center",
                  }}
                />
                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 700,
                    color: theme.colors.white,
                    minWidth: 280,
                  }}
                >
                  {b.label}.
                </div>
                <div
                  style={{
                    fontSize: 40,
                    fontWeight: 400,
                    color: theme.colors.muted,
                  }}
                >
                  {b.body}
                </div>
              </div>
            );
          })}
        </div>

        <AnimatedText
          startFrame={480}
          durationFrames={28}
          style={{
            fontSize: 48,
            fontWeight: 500,
            color: theme.colors.yellow,
            marginTop: 60,
            fontStyle: "italic",
          }}
        >
          What if reviewing was actually… good?
        </AnimatedText>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

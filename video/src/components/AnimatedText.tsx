import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

type Props = {
  /** Frame (relative to enclosing Sequence) when this text should appear. */
  startFrame?: number;
  /** Frames over which the fade-in plays. */
  durationFrames?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  /** Slide-in offset in px. Positive = slide up. */
  slide?: number;
  /** If true, use a spring easing instead of a linear fade. */
  bounce?: boolean;
};

/**
 * Drop-in animated text — fades and slides in at `startFrame`.
 * Composition-agnostic: relies only on useCurrentFrame, so it respects
 * any <Sequence> wrapping it.
 */
export function AnimatedText({
  startFrame = 0,
  durationFrames = 20,
  children,
  style,
  slide = 24,
  bounce = false,
}: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const local = frame - startFrame;

  const opacity = bounce
    ? spring({
        frame: local,
        fps,
        config: { damping: 200 },
        durationInFrames: durationFrames,
      })
    : interpolate(local, [0, durationFrames], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  const translateY = interpolate(local, [0, durationFrames], [slide, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        fontFamily: theme.font.sans,
        color: theme.semantic.text,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

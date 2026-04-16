import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { theme } from "../theme";
import { AnimatedText } from "../components/AnimatedText";

/**
 * Scene 05 — Cinematic globe flight (20s / 600 frames)
 * Animated stylized globe with a yellow flight arc — simplified enough to
 * render fast but readable as the product's signature visual.
 */
export function Scene05_Globe() {
  const frame = useCurrentFrame();

  // Globe rotates slowly
  const rotation = interpolate(frame, [0, 600], [0, 40]);

  // Arc draws in from 120-300, then plane travels along it 240-540
  const arcProgress = interpolate(frame, [120, 300], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const planeProgress = interpolate(frame, [240, 540], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Arc endpoints roughly corresponding to JFK → LHR on a tilted globe
  const startX = 680;
  const startY = 640;
  const endX = 1140;
  const endY = 430;
  const midX = (startX + endX) / 2;
  const midY = Math.min(startY, endY) - 220;

  // Quadratic bezier path
  const arcPath = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
  const arcLength = 900;

  // Plane position on the bezier at t = planeProgress
  const t = planeProgress;
  const px =
    (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
  const py =
    (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * endY;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 50%, ${theme.colors.navyLight} 0%, ${theme.colors.navyDark} 70%)`,
        fontFamily: theme.font.sans,
      }}
    >
      {/* Star field dots for atmosphere */}
      <StarField />

      {/* Globe */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 900,
            height: 900,
            transform: `rotate(${rotation}deg)`,
          }}
        >
          {/* Globe sphere */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: `radial-gradient(circle at 35% 35%, ${theme.colors.navyLight} 0%, ${theme.colors.navy} 60%, ${theme.colors.navyDark} 100%)`,
              boxShadow: `inset -40px -40px 100px rgba(0,0,0,0.6), 0 0 120px rgba(251, 204, 51, 0.08)`,
              border: "2px solid rgba(251, 204, 51, 0.15)",
            }}
          />
          {/* Lat/long grid */}
          <svg
            viewBox="0 0 900 900"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          >
            {[150, 250, 350, 450].map((r) => (
              <ellipse
                key={`v-${r}`}
                cx={450}
                cy={450}
                rx={r}
                ry={440}
                fill="none"
                stroke="rgba(251, 204, 51, 0.08)"
                strokeWidth={1}
              />
            ))}
            {[0, 90, 180, 270, 360].map((deg) => (
              <line
                key={`h-${deg}`}
                x1={20}
                y1={450 + (deg - 180) * 1.1}
                x2={880}
                y2={450 + (deg - 180) * 1.1}
                stroke="rgba(251, 204, 51, 0.06)"
                strokeWidth={1}
              />
            ))}
          </svg>
        </div>
      </AbsoluteFill>

      {/* Flight arc overlay (does NOT rotate with globe) */}
      <AbsoluteFill>
        <svg
          viewBox="0 0 1920 1080"
          style={{ width: "100%", height: "100%" }}
        >
          <defs>
            <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={theme.colors.yellow} stopOpacity={0.1} />
              <stop offset="50%" stopColor={theme.colors.yellow} stopOpacity={1} />
              <stop offset="100%" stopColor={theme.colors.yellow} stopOpacity={0.4} />
            </linearGradient>
          </defs>

          {/* Origin dot */}
          <circle
            cx={startX}
            cy={startY}
            r={10}
            fill={theme.colors.yellow}
            opacity={interpolate(frame, [80, 110], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}
          />
          <circle
            cx={startX}
            cy={startY}
            r={22}
            fill="none"
            stroke={theme.colors.yellow}
            strokeWidth={2}
            opacity={interpolate(frame, [80, 110], [0, 0.4], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}
          />

          {/* Animated arc */}
          <path
            d={arcPath}
            fill="none"
            stroke="url(#arcGrad)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={arcLength * (1 - arcProgress)}
          />

          {/* Destination dot */}
          <circle
            cx={endX}
            cy={endY}
            r={10}
            fill={theme.colors.yellow}
            opacity={interpolate(frame, [260, 300], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}
          />

          {/* Plane */}
          {planeProgress > 0 && planeProgress < 1 && (
            <g transform={`translate(${px}, ${py})`}>
              <circle r={14} fill={theme.colors.yellow} />
              <circle
                r={28}
                fill="none"
                stroke={theme.colors.yellow}
                strokeWidth={2}
                opacity={0.3}
              />
            </g>
          )}
        </svg>
      </AbsoluteFill>

      {/* Caption */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 180,
        }}
      >
        <AnimatedText
          startFrame={0}
          durationFrames={22}
          style={{
            fontSize: 26,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: theme.colors.yellow,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          Step 02 — Journey
        </AnimatedText>
        <AnimatedText
          startFrame={15}
          durationFrames={28}
          style={{
            fontSize: 84,
            fontWeight: 600,
            color: theme.colors.white,
            lineHeight: 1,
          }}
        >
          Fly there again.
        </AnimatedText>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 140,
          right: 180,
          textAlign: "right",
          maxWidth: 600,
        }}
      >
        <AnimatedText
          startFrame={340}
          durationFrames={24}
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: theme.colors.mutedStrong,
            lineHeight: 1.4,
          }}
        >
          A cinematic replay of your route —
        </AnimatedText>
        <AnimatedText
          startFrame={370}
          durationFrames={24}
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: theme.colors.muted,
            lineHeight: 1.4,
            marginTop: 12,
          }}
        >
          priming memory before each review.
        </AnimatedText>
      </div>
    </AbsoluteFill>
  );
}

function StarField() {
  // Static pseudo-random star positions
  const stars = React.useMemo(
    () =>
      Array.from({ length: 120 }, (_, i) => ({
        x: (i * 97) % 1920,
        y: (i * 53) % 1080,
        r: ((i * 7) % 3) + 1,
        op: ((i * 13) % 70) / 100 + 0.15,
      })),
    []
  );
  return (
    <svg
      viewBox="0 0 1920 1080"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.op} />
      ))}
    </svg>
  );
}

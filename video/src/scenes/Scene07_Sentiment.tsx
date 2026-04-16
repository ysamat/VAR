import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { AnimatedText } from "../components/AnimatedText";
import { MockPanel } from "../components/MockPanel";

/**
 * Scene 07 — Sentiment → Ratings (25s / 750 frames)
 * Pipeline visual: user's raw text flows through sentiment analysis and
 * out as 1-10 scores across the 15 rating categories.
 */
export function Scene07_Sentiment() {
  const frame = useCurrentFrame();

  const reviewText =
    "Bathroom was spotless, rain shower was incredible. Staff were attentive at every turn. A bit noisy from the street at night — I'd skip the front-facing rooms next time.";

  const ratings = [
    { label: "roomcleanliness", value: 9, start: 180 },
    { label: "roomquality", value: 8, start: 220 },
    { label: "service", value: 9, start: 260 },
    { label: "roomcomfort", value: 7, start: 300 },
    { label: "location", value: 7, start: 340 },
    { label: "valueformoney", value: 8, start: 380 },
    { label: "overall", value: 8, start: 440 },
  ];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${theme.colors.navyDark} 0%, ${theme.colors.dark} 100%)`,
        fontFamily: theme.font.sans,
      }}
    >
      <AbsoluteFill
        style={{
          padding: "100px 180px",
          display: "flex",
          flexDirection: "column",
          gap: 40,
        }}
      >
        <div>
          <AnimatedText
            startFrame={0}
            durationFrames={22}
            style={{
              fontSize: 26,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: theme.colors.yellow,
              fontWeight: 600,
              marginBottom: 18,
            }}
          >
            Step 04 — Structure
          </AnimatedText>
          <AnimatedText
            startFrame={12}
            durationFrames={28}
            style={{
              fontSize: 76,
              fontWeight: 600,
              color: theme.colors.white,
              lineHeight: 1.05,
            }}
          >
            Words become numbers.
          </AnimatedText>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 60,
            marginTop: 20,
          }}
        >
          {/* Left: the user's text */}
          <div
            style={{
              flex: 1,
              opacity: interpolate(frame, [40, 80], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <MockPanel width={700}>
              <div
                style={{
                  fontSize: 16,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: theme.colors.yellow,
                  fontWeight: 600,
                  marginBottom: 14,
                }}
              >
                Your review
              </div>
              <div
                style={{
                  fontSize: 24,
                  color: theme.colors.mutedStrong,
                  lineHeight: 1.5,
                }}
              >
                "{reviewText}"
              </div>
            </MockPanel>
          </div>

          {/* Middle: arrow / pipeline */}
          <div
            style={{
              flex: "0 0 280",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              paddingTop: 80,
            }}
          >
            <Pipeline frame={frame} />
          </div>

          {/* Right: extracted ratings */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 16,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: theme.colors.yellow,
                fontWeight: 600,
                marginBottom: 18,
                opacity: interpolate(frame, [140, 180], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Derived ratings · 1-10
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {ratings.map((r) => {
                const local = frame - r.start;
                const op = interpolate(local, [0, 22], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                const tx = interpolate(local, [0, 22], [24, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                const fillPct = interpolate(
                  local,
                  [14, 42],
                  [0, (r.value / 10) * 100],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }
                );
                const isOverall = r.label === "overall";
                return (
                  <div
                    key={r.label}
                    style={{
                      opacity: op,
                      transform: `translateX(${tx}px)`,
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "12px 18px",
                      borderRadius: 10,
                      background: isOverall
                        ? "rgba(251, 204, 51, 0.12)"
                        : "rgba(255, 255, 255, 0.04)",
                      border: isOverall
                        ? "1px solid rgba(251, 204, 51, 0.4)"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 24,
                        color: isOverall
                          ? theme.colors.yellow
                          : theme.colors.mutedStrong,
                        fontWeight: isOverall ? 700 : 500,
                        minWidth: 260,
                        fontFeatureSettings: "'tnum'",
                      }}
                    >
                      {r.label}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: 10,
                        borderRadius: 5,
                        background: "rgba(255,255,255,0.08)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${fillPct}%`,
                          height: "100%",
                          background: theme.colors.yellow,
                          borderRadius: 5,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: theme.colors.white,
                        minWidth: 60,
                        textAlign: "right",
                        fontFeatureSettings: "'tnum'",
                      }}
                    >
                      {r.value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <AnimatedText
          startFrame={580}
          durationFrames={28}
          style={{
            fontSize: 36,
            color: theme.colors.mutedStrong,
            fontStyle: "italic",
            textAlign: "center",
            marginTop: 20,
          }}
        >
          No checkboxes. No forced ratings. Just your thoughts — structured.
        </AnimatedText>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function Pipeline({ frame }: { frame: number }) {
  const flow = interpolate(frame, [80, 160], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      <svg width={280} height={120} viewBox="0 0 280 120">
        <defs>
          <linearGradient id="pipe" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={theme.colors.yellow} stopOpacity={0.1} />
            <stop offset="100%" stopColor={theme.colors.yellow} stopOpacity={1} />
          </linearGradient>
        </defs>
        <line
          x1={10}
          y1={60}
          x2={270}
          y2={60}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={2}
        />
        <line
          x1={10}
          y1={60}
          x2={10 + 260 * flow}
          y2={60}
          stroke="url(#pipe)"
          strokeWidth={3}
          strokeLinecap="round"
        />
        {/* Arrow head */}
        <polygon
          points={`${10 + 260 * flow},60 ${10 + 260 * flow - 12},54 ${10 + 260 * flow - 12},66`}
          fill={theme.colors.yellow}
          opacity={flow}
        />
      </svg>
      <div
        style={{
          fontSize: 18,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: theme.colors.yellow,
          fontWeight: 600,
          opacity: flow,
        }}
      >
        Sentiment analysis
      </div>
      <div
        style={{
          fontSize: 14,
          color: theme.colors.muted,
          opacity: flow,
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        gpt-4o-mini · per-category<br />calibrated 1–10
      </div>
    </>
  );
}

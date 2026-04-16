import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { AnimatedText } from "../components/AnimatedText";
import { MockPanel, MockEyebrow } from "../components/MockPanel";

/**
 * Scene 04 — Trip setup (15s / 450 frames)
 * Shows the setup panel: origin, destination, stops.
 */
export function Scene04_Setup() {
  const frame = useCurrentFrame();

  const panelOpacity = interpolate(frame, [30, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panelTranslate = interpolate(frame, [30, 70], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const stops = [
    { city: "London", subtitle: "The Lanesborough", start: 160 },
    { city: "Paris", subtitle: "Hôtel de Crillon", start: 200 },
    { city: "Rome", subtitle: "Hassler Roma", start: 240 },
  ];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${theme.semantic.bgSoft} 0%, ${theme.semantic.bg} 60%)`,
        fontFamily: theme.font.sans,
      }}
    >
      <AbsoluteFill
        style={{
          padding: "120px 180px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 60,
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
              color: theme.semantic.accent,
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            Step 01 — Setup
          </AnimatedText>
          <AnimatedText
            startFrame={12}
            durationFrames={28}
            style={{
              fontSize: 84,
              fontWeight: 600,
              color: theme.semantic.text,
              lineHeight: 1,
            }}
          >
            Pick your trip.
          </AnimatedText>
        </div>

        <div
          style={{
            display: "flex",
            gap: 80,
            alignItems: "center",
          }}
        >
          <div
            style={{
              opacity: panelOpacity,
              transform: `translateY(${panelTranslate}px)`,
            }}
          >
            <MockPanel width={720}>
              <MockEyebrow>Flight</MockEyebrow>
              <div style={{ marginTop: 16, marginBottom: 32 }}>
                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 600,
                    color: theme.semantic.panelText,
                    lineHeight: 1.2,
                  }}
                >
                  JFK → LHR
                </div>
                <div
                  style={{
                    fontSize: 22,
                    color: theme.semantic.panelTextMuted,
                    marginTop: 8,
                  }}
                >
                  New York → London
                </div>
              </div>

              <MockEyebrow>Stops</MockEyebrow>
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {stops.map((s) => {
                  const local = frame - s.start;
                  const op = interpolate(local, [0, 22], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  });
                  const tx = interpolate(local, [0, 22], [-20, 0], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  });
                  return (
                    <div
                      key={s.city}
                      style={{
                        opacity: op,
                        transform: `translateX(${tx}px)`,
                        display: "flex",
                        alignItems: "center",
                        gap: 20,
                        padding: "14px 20px",
                        borderRadius: 12,
                        background: theme.semantic.panelInput,
                        border: `1px solid ${theme.semantic.panelInputBorder}`,
                      }}
                    >
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          background: theme.semantic.panelAccent,
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontSize: 28,
                            color: theme.semantic.panelText,
                            fontWeight: 600,
                          }}
                        >
                          {s.city}
                        </div>
                        <div
                          style={{
                            fontSize: 18,
                            color: theme.semantic.panelTextMuted,
                          }}
                        >
                          {s.subtitle}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </MockPanel>
          </div>

          <div style={{ flex: 1, maxWidth: 600 }}>
            <AnimatedText
              startFrame={150}
              durationFrames={26}
              style={{
                fontSize: 40,
                color: theme.semantic.textStrong,
                lineHeight: 1.3,
              }}
            >
              Origin. Destination. Stops.
            </AnimatedText>
            <AnimatedText
              startFrame={280}
              durationFrames={26}
              style={{
                fontSize: 32,
                color: theme.semantic.textMuted,
                marginTop: 28,
                lineHeight: 1.4,
              }}
            >
              Build your itinerary — or pick a property and let VAR fill in
              the route.
            </AnimatedText>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

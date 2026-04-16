import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { AnimatedText } from "../components/AnimatedText";
import {
  MockPanel,
  MockEyebrow,
  MockTextarea,
} from "../components/MockPanel";

/**
 * Scene 06 — AI Review (25s / 750 frames)
 * Shows the StopReviewCard being filled in. Typewriter-animates the user's
 * answer, then flashes the real-time typing-analysis nudge.
 */
export function Scene06_AIReview() {
  const frame = useCurrentFrame();

  const gapQuestion =
    "Other guests rarely mention the bathroom — how was yours?";
  const answer =
    "The bathroom was spotless, modern fixtures, rain shower. Marble counters, great water pressure.";

  // Typewriter effect — reveal chars 160-460
  const typed = Math.floor(
    interpolate(frame, [160, 460], [0, answer.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const typedAnswer = answer.slice(0, typed);

  // Nudge appears after user types ~30% then stops being short
  const showNudge = frame > 260 && frame < 330;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${theme.semantic.bg} 0%, ${theme.semantic.bgSoft} 100%)`,
        fontFamily: theme.font.sans,
      }}
    >
      <AbsoluteFill
        style={{
          padding: "100px 180px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 50,
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
              marginBottom: 18,
            }}
          >
            Step 03 — The Review
          </AnimatedText>
          <AnimatedText
            startFrame={12}
            durationFrames={28}
            style={{
              fontSize: 80,
              fontWeight: 600,
              color: theme.semantic.text,
              lineHeight: 1.05,
            }}
          >
            AI asks the right questions.
          </AnimatedText>
        </div>

        <div
          style={{
            display: "flex",
            gap: 80,
            alignItems: "flex-start",
          }}
        >
          {/* Review card mock */}
          <div
            style={{
              opacity: interpolate(frame, [50, 90], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              transform: `translateY(${interpolate(
                frame,
                [50, 90],
                [30, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              )}px)`,
            }}
          >
            <MockPanel width={880}>
              <MockEyebrow>AI-powered review · Stop 2 of 3</MockEyebrow>
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 600,
                  marginTop: 14,
                  color: theme.semantic.panelText,
                }}
              >
                Hôtel de Crillon
              </div>
              <div
                style={{
                  fontSize: 20,
                  color: theme.semantic.panelTextMuted,
                  marginTop: 4,
                  marginBottom: 32,
                }}
              >
                hotel · Paris
              </div>

              <div
                style={{
                  fontSize: 24,
                  fontWeight: 500,
                  color: theme.semantic.panelText,
                  marginBottom: 14,
                  lineHeight: 1.4,
                }}
              >
                1. {gapQuestion}
              </div>

              <MockTextarea
                text={typedAnswer}
                placeholder="Your thoughts..."
                focused={frame > 140 && frame < 480}
              />

              {/* Real-time nudge */}
              <div
                style={{
                  marginTop: 14,
                  height: 34,
                  opacity: showNudge ? 1 : 0,
                  transform: `translateY(${showNudge ? 0 : 8}px)`,
                  transition: "opacity 0.25s, transform 0.25s",
                  fontSize: 20,
                  fontStyle: "italic",
                  color: theme.semantic.panelAccent,
                }}
              >
                Nice — can you describe the fixtures and water pressure?
              </div>
            </MockPanel>
          </div>

          {/* Right-side explainer */}
          <div style={{ flex: 1, maxWidth: 640 }}>
            {[
              {
                eyebrow: "How it works",
                body: "VAR reads every existing review for this property.",
                start: 100,
              },
              {
                eyebrow: "Finds what's missing",
                body: "It surfaces topics nobody's covered — the gaps.",
                start: 200,
              },
              {
                eyebrow: "Asks you",
                body: "A question tuned to this hotel, at this moment in your trip.",
                start: 340,
              },
              {
                eyebrow: "Nudges in real time",
                body: "Too short? Too vague? It tells you while you type.",
                start: 500,
              },
            ].map((b) => {
              const local = frame - b.start;
              const op = interpolate(local, [0, 22], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const tx = interpolate(local, [0, 22], [24, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <div
                  key={b.eyebrow}
                  style={{
                    opacity: op,
                    transform: `translateX(${tx}px)`,
                    marginBottom: 30,
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      letterSpacing: "0.24em",
                      textTransform: "uppercase",
                      color: theme.semantic.accent,
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    {b.eyebrow}
                  </div>
                  <div
                    style={{
                      fontSize: 30,
                      color: theme.semantic.textStrong,
                      lineHeight: 1.35,
                    }}
                  >
                    {b.body}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

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
 * Navy dotted globe on a yellow canvas. Continents are built from ~600
 * small dots whose positions are defined by overlapping ellipse land-masks
 * — same pattern Apple/Stripe use so viewers instantly read "Earth".
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

  // Arc endpoints — JFK (east coast N.America) → LHR (British Isles)
  const startX = 870;
  const startY = 590;
  const endX = 1060;
  const endY = 415;
  const midX = (startX + endX) / 2;
  const midY = Math.min(startY, endY) - 220;

  const arcPath = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
  const arcLength = 900;

  const t = planeProgress;
  const px =
    (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
  const py =
    (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * endY;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 50%, ${theme.semantic.bgSoft} 0%, ${theme.semantic.bg} 55%, ${theme.semantic.bgDeep} 100%)`,
        fontFamily: theme.font.sans,
      }}
    >
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
          {/* Globe sphere (navy) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: `radial-gradient(circle at 35% 35%, ${theme.semantic.navyFillLight} 0%, ${theme.semantic.navyFill} 60%, ${theme.semantic.navyFillDeep} 100%)`,
              boxShadow: `inset -40px -40px 100px rgba(0,0,0,0.55), 0 0 120px rgba(15, 18, 35, 0.25)`,
              border: `2px solid ${theme.semantic.navyFillDeep}`,
            }}
          />

          {/* Dot-matrix continents + grid, clipped to sphere */}
          <svg
            viewBox="0 0 900 900"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          >
            <defs>
              <clipPath id="globeClip">
                <circle cx={450} cy={450} r={448} />
              </clipPath>
            </defs>

            <g clipPath="url(#globeClip)">
              {/* Faint lat/long grid under the dots */}
              {[150, 250, 350, 430].map((r) => (
                <ellipse
                  key={`v-${r}`}
                  cx={450}
                  cy={450}
                  rx={r}
                  ry={420}
                  fill="none"
                  stroke="rgba(255, 243, 194, 0.08)"
                  strokeWidth={1}
                />
              ))}
              {[-300, -200, -100, 0, 100, 200, 300].map((dy) => (
                <line
                  key={`h-${dy}`}
                  x1={20}
                  y1={450 + dy}
                  x2={880}
                  y2={450 + dy}
                  stroke="rgba(255, 243, 194, 0.06)"
                  strokeWidth={1}
                />
              ))}

              {/* Continent dots */}
              <g fill={theme.semantic.continent}>
                {LAND_DOTS.map((d, i) => (
                  <circle key={i} cx={d.x} cy={d.y} r={d.big ? 3.2 : 2.4} />
                ))}
              </g>
            </g>
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
              <stop offset="0%" stopColor={theme.colors.yellow} stopOpacity={0.15} />
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
            opacity={interpolate(frame, [80, 110], [0, 0.45], {
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
                opacity={0.35}
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
            color: theme.semantic.accent,
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
            color: theme.semantic.text,
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
            color: theme.semantic.textStrong,
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
            color: theme.semantic.textMuted,
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

/**
 * Ellipse "land masks" in globe-local coords (900×900, center 450,450).
 * Laid out as an Atlantic-centered orthographic view of Earth. Overlapping
 * ellipses build up each continent's silhouette; a grid-sample step then
 * turns them into the dot field.
 */
const LAND_MASKS: Array<{ cx: number; cy: number; rx: number; ry: number }> = [
  // North America
  { cx: 270, cy: 330, rx: 135, ry: 80 },   // Canada
  { cx: 310, cy: 430, rx: 100, ry: 55 },   // USA
  { cx: 130, cy: 270, rx: 55, ry: 28 },    // Alaska
  { cx: 270, cy: 530, rx: 42, ry: 55 },    // Mexico
  { cx: 315, cy: 600, rx: 32, ry: 26 },    // Central America
  { cx: 375, cy: 480, rx: 10, ry: 36 },    // Florida
  // Greenland
  { cx: 440, cy: 195, rx: 40, ry: 55 },
  // South America
  { cx: 415, cy: 600, rx: 55, ry: 35 },    // Venezuela / Colombia bulge
  { cx: 460, cy: 680, rx: 60, ry: 55 },    // Brazil
  { cx: 445, cy: 760, rx: 24, ry: 35 },    // Argentina / Chile tail
  // Europe
  { cx: 570, cy: 290, rx: 55, ry: 32 },    // main continent
  { cx: 585, cy: 230, rx: 20, ry: 42 },    // Scandinavia
  { cx: 525, cy: 298, rx: 14, ry: 20 },    // UK / Ireland
  { cx: 525, cy: 350, rx: 25, ry: 18 },    // Iberia
  { cx: 580, cy: 340, rx: 10, ry: 28 },    // Italy
  // Africa
  { cx: 605, cy: 420, rx: 80, ry: 45 },    // North Africa (Sahara belt)
  { cx: 610, cy: 510, rx: 55, ry: 60 },    // Central Africa
  { cx: 595, cy: 600, rx: 30, ry: 45 },    // Southern Africa
  { cx: 675, cy: 465, rx: 18, ry: 30 },    // Horn of Africa
  { cx: 650, cy: 540, rx: 12, ry: 22 },    // Madagascar
  // Asia
  { cx: 745, cy: 275, rx: 130, ry: 55 },   // Russia
  { cx: 685, cy: 385, rx: 40, ry: 30 },    // Middle East
  { cx: 735, cy: 470, rx: 22, ry: 48 },    // India subcontinent
  { cx: 810, cy: 355, rx: 45, ry: 50 },    // China / East Asia
  { cx: 805, cy: 445, rx: 25, ry: 30 },    // SE Asia peninsula
  { cx: 825, cy: 495, rx: 32, ry: 12 },    // Indonesia
  { cx: 790, cy: 505, rx: 10, ry: 8 },     // extra island
  // Australia
  { cx: 850, cy: 580, rx: 42, ry: 26 },
  { cx: 870, cy: 620, rx: 6, ry: 6 },      // Tasmania
];

function isLand(x: number, y: number): boolean {
  for (const m of LAND_MASKS) {
    const dx = (x - m.cx) / m.rx;
    const dy = (y - m.cy) / m.ry;
    if (dx * dx + dy * dy <= 1) return true;
  }
  return false;
}

/** Pre-computed continent dot field (module-scope, no per-frame cost). */
const LAND_DOTS: Array<{ x: number; y: number; big: boolean }> = (() => {
  const out: Array<{ x: number; y: number; big: boolean }> = [];
  const step = 11;
  const globeR2 = 430 * 430;
  for (let x = 20; x < 880; x += step) {
    for (let y = 20; y < 880; y += step) {
      const ddx = x - 450;
      const ddy = y - 450;
      if (ddx * ddx + ddy * ddy > globeR2) continue;
      if (!isLand(x, y)) continue;
      // "Big" dots on deeply interior land for a subtle density gradient
      const interior =
        isLand(x + step, y) &&
        isLand(x - step, y) &&
        isLand(x, y + step) &&
        isLand(x, y - step);
      out.push({ x, y, big: interior });
    }
  }
  return out;
})();

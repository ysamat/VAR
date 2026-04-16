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
 * Navy globe with yellow-light continents on a yellow canvas. A navy-dark
 * flight arc threads JFK → LHR across the top of the globe.
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

          {/* Continents + grid inside a clipped SVG so nothing spills past the sphere edge */}
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
              {/* Continents — stylized landmasses on the navy sphere */}
              <g
                fill={theme.semantic.continent}
                stroke={theme.semantic.continentStroke}
                strokeWidth={1.5}
                strokeLinejoin="round"
              >
                {/* North America */}
                <path d="M 160 260 Q 140 300 160 360 Q 180 420 230 450 Q 270 470 300 450 Q 330 420 320 380 Q 340 340 320 300 Q 300 260 260 240 Q 220 230 190 240 Z" />
                {/* Central America sliver */}
                <path d="M 300 470 Q 320 490 340 510 Q 355 530 350 545 Q 340 540 325 525 Q 310 505 300 485 Z" />
                {/* South America */}
                <path d="M 360 560 Q 340 600 345 650 Q 355 710 390 740 Q 420 760 440 740 Q 460 700 450 650 Q 440 610 420 580 Q 400 560 380 555 Z" />
                {/* Greenland */}
                <path d="M 370 170 Q 360 200 380 225 Q 410 230 420 205 Q 420 180 400 165 Z" />
                {/* Europe */}
                <path d="M 460 260 Q 450 285 470 310 Q 495 325 520 315 Q 540 300 535 275 Q 520 255 495 252 Q 475 252 460 260 Z" />
                {/* Africa */}
                <path d="M 490 345 Q 470 390 475 450 Q 490 520 530 565 Q 565 590 595 570 Q 615 530 610 480 Q 620 430 600 380 Q 575 345 540 340 Q 510 338 490 345 Z" />
                {/* Asia (big landmass) */}
                <path d="M 560 235 Q 560 270 580 290 Q 620 300 670 295 Q 720 290 760 305 Q 790 320 790 345 Q 780 375 740 385 Q 700 395 660 390 Q 620 390 590 375 Q 565 360 555 335 Q 545 300 545 275 Q 545 245 560 235 Z" />
                {/* India subcontinent */}
                <path d="M 650 385 Q 660 410 655 445 Q 650 470 635 470 Q 625 450 630 420 Q 635 395 650 385 Z" />
                {/* SE Asia archipelago dots */}
                <path d="M 745 420 Q 755 425 760 440 Q 750 445 740 435 Z" />
                <path d="M 775 445 Q 790 450 790 465 Q 780 470 770 460 Z" />
                {/* Australia */}
                <path d="M 720 580 Q 700 610 720 640 Q 760 660 800 645 Q 820 620 805 590 Q 775 570 745 575 Z" />
              </g>

              {/* Lat/long grid on top, subtle */}
              {[150, 250, 350, 445].map((r) => (
                <ellipse
                  key={`v-${r}`}
                  cx={450}
                  cy={450}
                  rx={r}
                  ry={440}
                  fill="none"
                  stroke="rgba(255, 243, 194, 0.12)"
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
                  stroke="rgba(255, 243, 194, 0.08)"
                  strokeWidth={1}
                />
              ))}
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
              <stop offset="0%" stopColor={theme.semantic.navyFillDeep} stopOpacity={0.15} />
              <stop offset="50%" stopColor={theme.semantic.navyFillDeep} stopOpacity={1} />
              <stop offset="100%" stopColor={theme.semantic.navyFillDeep} stopOpacity={0.4} />
            </linearGradient>
          </defs>

          {/* Origin dot */}
          <circle
            cx={startX}
            cy={startY}
            r={10}
            fill={theme.semantic.navyFillDeep}
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
            stroke={theme.semantic.navyFillDeep}
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
            fill={theme.semantic.navyFillDeep}
            opacity={interpolate(frame, [260, 300], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}
          />

          {/* Plane */}
          {planeProgress > 0 && planeProgress < 1 && (
            <g transform={`translate(${px}, ${py})`}>
              <circle r={14} fill={theme.semantic.navyFillDeep} />
              <circle
                r={28}
                fill="none"
                stroke={theme.semantic.navyFillDeep}
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

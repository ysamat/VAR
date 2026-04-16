import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { theme } from "./theme";
import { Scene01_Hook } from "./scenes/Scene01_Hook";
import { Scene02_Problem } from "./scenes/Scene02_Problem";
import { Scene03_Solution } from "./scenes/Scene03_Solution";
import { Scene04_Setup } from "./scenes/Scene04_Setup";
import { Scene05_Globe } from "./scenes/Scene05_Globe";
import { Scene06_AIReview } from "./scenes/Scene06_AIReview";
import { Scene07_Sentiment } from "./scenes/Scene07_Sentiment";
import { Scene08_Outro } from "./scenes/Scene08_Outro";

/**
 * Scene schedule (30 fps). Times chosen so the whole video is ~150 s /
 * 4500 frames. Adjust by editing `duration`; subsequent scenes shift to
 * accommodate via the running offset below.
 */
const SCENES = [
  { id: "hook", Component: Scene01_Hook, duration: 300 }, // 10s
  { id: "problem", Component: Scene02_Problem, duration: 600 }, // 20s
  { id: "solution", Component: Scene03_Solution, duration: 450 }, // 15s
  { id: "setup", Component: Scene04_Setup, duration: 450 }, // 15s
  { id: "globe", Component: Scene05_Globe, duration: 600 }, // 20s
  { id: "ai-review", Component: Scene06_AIReview, duration: 750 }, // 25s
  { id: "sentiment", Component: Scene07_Sentiment, duration: 750 }, // 25s
  { id: "outro", Component: Scene08_Outro, duration: 600 }, // 20s
] as const;

export const TOTAL_FRAMES = SCENES.reduce((s, sc) => s + sc.duration, 0);

export function VarDemo() {
  let offset = 0;
  return (
    <AbsoluteFill style={{ background: theme.colors.dark }}>
      {SCENES.map((sc) => {
        const from = offset;
        offset += sc.duration;
        return (
          <Sequence
            key={sc.id}
            from={from}
            durationInFrames={sc.duration}
            name={sc.id}
          >
            <sc.Component />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

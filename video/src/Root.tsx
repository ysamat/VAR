import React from "react";
import { Composition, registerRoot } from "remotion";
import { VarDemo, TOTAL_FRAMES } from "./Video";
import { theme } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VarDemo"
        component={VarDemo}
        durationInFrames={TOTAL_FRAMES}
        fps={theme.layout.fps}
        width={theme.layout.width}
        height={theme.layout.height}
      />
    </>
  );
};

registerRoot(RemotionRoot);

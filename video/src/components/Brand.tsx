import React from "react";
import { Img, staticFile } from "remotion";
import { theme } from "../theme";

type Props = {
  size?: number;
  showText?: boolean;
  style?: React.CSSProperties;
};

/** Logo + wordmark used in the title and outro scenes. */
export function Brand({ size = 140, showText = true, style }: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        ...style,
      }}
    >
      <Img
        src={staticFile("logo.png")}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
        }}
      />
      {showText && (
        <div
          style={{
            fontFamily: theme.font.sans,
            fontSize: size * 0.7,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: theme.semantic.text,
          }}
        >
          VAR
        </div>
      )}
    </div>
  );
}

"use client";

/**
 * VAR Logo — inline SVG wordmark. Yellow on transparent, with a subtle
 * Expedia-style arrow inside the "A". Self-contained so there's no missing-
 * image case.
 */
export function VarLogo({
  className = "",
  size = 120,
}: {
  className?: string;
  size?: number;
}) {
  const width = size;
  const height = Math.round(size * 0.46);

  return (
    <svg
      viewBox="0 0 260 120"
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label="VAR"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="var-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDD85D" />
          <stop offset="100%" stopColor="#FBCC33" />
        </linearGradient>
      </defs>

      {/* V */}
      <path
        d="M10 18 L40 102 L66 102 L96 18 L72 18 L53 76 L34 18 Z"
        fill="url(#var-yellow)"
      />

      {/* A with arrow in the counter */}
      <path
        d="M110 102 L140 18 L168 18 L198 102 L173 102 L167 82 L141 82 L135 102 Z
           M147 64 L161 64 L154 38 Z"
        fill="url(#var-yellow)"
        fillRule="evenodd"
      />
      {/* Expedia-style arrow tucked beside the A */}
      <path
        d="M178 46 L198 46 L198 36 L216 55 L198 74 L198 64 L178 64 Z"
        fill="url(#var-yellow)"
        opacity="0.95"
      />

      {/* R */}
      <path
        d="M218 18 L252 18 Q262 18 262 32 L262 52 Q262 62 252 65 L262 102 L236 102 L228 70 L240 70 L240 82 L240 102 L218 102 Z
           M240 36 L240 56 L248 56 L248 36 Z"
        fill="url(#var-yellow)"
        fillRule="evenodd"
      />
    </svg>
  );
}

import React from "react";

/**
 * TillyThinkingLoader
 * Compact, brandable loader with concentric rings + sprout.
 * Pure SVG + CSS animations. Carefully bounded to avoid clipping.
 */
export default function TillyThinkingLoader({
  size = 56,
  label = "Tilly is thinking…",
  theme = "sprout", // "sprout" | "grain" | "soil"
  loop = true,
}) {
  const palettes = {
    sprout: { base: "#1B5E20", leaf: "#43A047", sun: "#FFCA28", soil: "#8D6E63", spark: "#A7FFEB" },
    grain: { base: "#6D4C41", leaf: "#F9A825", sun: "#FFD54F", soil: "#BCAAA4", spark: "#FFF9C4" },
    soil:  { base: "#3E2723", leaf: "#8BC34A", sun: "#FFCC80", soil: "#6D4C41", spark: "#B2DFDB" },
  };
  const palette = palettes[theme] || palettes.sprout;

  const S = size;
  const R = S / 2;
  const loopCount = loop ? "infinite" : "1";

  // Geometry tuned for compact mode (kept within viewBox)
  const rings = [0.62, 0.48, 0.34];       // ring radii as R multipliers
  const orbitR = R * 0.38;                // orbit radius kept inside rings
  const sparkR = Math.max(2, Math.round(R * 0.09)); // spark dot radius

  // Sprout geometry (relative to R, bounded)
  const stemTop = -R * 0.60;
  const leftLeafY = -R * 0.50;
  const rightLeafY = -R * 0.48;

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <style>{`
        @keyframes tilly-spin { to { transform: rotate(360deg); } }
        @keyframes tilly-breathe { 0%,100%{opacity:.10;transform:scale(.96)} 50%{opacity:.22;transform:scale(1.04)} }
        @keyframes tilly-sway { 0%,100%{ transform: rotate(-2deg)} 50%{ transform: rotate(2deg)} }
        @keyframes tilly-orbit { to { transform: rotate(360deg); } }
        .tilly-shadow { filter: drop-shadow(0 1px 6px rgba(0,0,0,.08)); }
      `}</style>

      <div
        className="relative tilly-shadow"
        style={{ width: S, height: S, overflow: "visible" }}
        role="img"
        aria-label={label}
      >
        {/* Soft sun halo (bounded inside viewBox) */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 50% 55%, ${palette.sun}33, transparent 65%)`,
            animation: `tilly-breathe 2.4s ease-in-out ${loopCount}`,
          }}
        />

        <svg
          width={S}
          height={S}
          viewBox={`0 0 ${S} ${S}`}
          style={{ overflow: "visible" }}
        >
          {/* Soil concentric rings (dashed) */}
          {rings.map((mul, i) => (
            <g
              key={i}
              style={{
                transformOrigin: `${R}px ${R}px`,
                animation: `tilly-spin ${7 - i * 1.5}s linear ${loopCount}`,
              }}
            >
              <circle
                cx={R}
                cy={R}
                r={R * mul}
                fill="none"
                stroke={palette.soil}
                strokeWidth={i === 0 ? 2.5 : 2}
                strokeLinecap="round"
                strokeDasharray="3.5 8"
                opacity={0.55 - i * 0.12}
              />
            </g>
          ))}

          {/* Sun core */}
          <circle cx={R} cy={R} r={R * 0.16} fill={palette.sun} opacity="0.18" />

          {/* Sprout (stem + leaves), anchored slightly below center */}
          <g transform={`translate(${R}, ${R + R * 0.08})`}>
            {/* Stem */}
            <path
              d={`M0 0 C ${-R * 0.06} ${-R * 0.30}, ${-R * 0.06} ${-R * 0.48}, 0 ${stemTop}`}
              fill="none"
              stroke={palette.base}
              strokeWidth={Math.max(2, R * 0.08)}
              strokeLinecap="round"
            />
            {/* Left leaf */}
            <g
              style={{
                transformOrigin: `0px ${leftLeafY}px`,
                animation: `tilly-sway 2.2s ease-in-out ${loopCount}`,
              }}
            >
              <path
                d={`M0 ${leftLeafY} C ${-R * 0.36} ${leftLeafY - R * 0.10}, ${-R * 0.46} ${leftLeafY - R * 0.28}, ${-R * 0.22} ${leftLeafY - R * 0.34} C ${-R * 0.02} ${leftLeafY - R * 0.36}, ${R * 0.06} ${leftLeafY - R * 0.24}, 0 ${leftLeafY} Z`}
                fill={palette.leaf}
                opacity="0.95"
              />
            </g>
            {/* Right leaf */}
            <g
              style={{
                transformOrigin: `0px ${rightLeafY}px`,
                animation: `tilly-sway 2.4s ease-in-out ${loopCount}`,
              }}
            >
              <path
                d={`M0 ${rightLeafY} C ${R * 0.36} ${rightLeafY - R * 0.10}, ${R * 0.52} ${rightLeafY - R * 0.24}, ${R * 0.22} ${rightLeafY - R * 0.32} C ${-R * 0.02} ${rightLeafY - R * 0.34}, ${-R * 0.06} ${rightLeafY - R * 0.22}, 0 ${rightLeafY} Z`}
                fill={palette.leaf}
                opacity="0.95"
              />
            </g>
          </g>

          {/* Firefly spark orbit (kept inside) */}
          <g
            style={{
              transformOrigin: `${R}px ${R}px`,
              animation: `tilly-orbit 3.6s linear ${loopCount}`,
            }}
          >
            <circle
              cx={R + orbitR}
              cy={R}
              r={sparkR * 0.7}
              fill={palette.spark}
              opacity="0.9"
            />
            <circle
              cx={R + orbitR - sparkR * 1.4}
              cy={R}
              r={sparkR * 0.4}
              fill={palette.spark}
              opacity="0.45"
            />
          </g>
        </svg>
      </div>

      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
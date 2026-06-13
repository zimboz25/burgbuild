import type { BadgeTier } from "@/lib/types/build";
import { BADGE_TIER_LABELS } from "@/lib/constants/attributes";

const TIER_STYLES: Record<
  BadgeTier,
  { fill: string; stroke: string; glow: string; text: string }
> = {
  bronze: {
    fill: "#8B5A2B",
    stroke: "#CD7F32",
    glow: "rgba(205, 127, 50, 0.5)",
    text: "#f5deb3",
  },
  silver: {
    fill: "#6B7280",
    stroke: "#D1D5DB",
    glow: "rgba(209, 213, 219, 0.45)",
    text: "#f9fafb",
  },
  gold: {
    fill: "#B8860B",
    stroke: "#FFD700",
    glow: "rgba(255, 215, 0, 0.5)",
    text: "#fff8dc",
  },
  hof: {
    fill: "#6D28D9",
    stroke: "#A78BFA",
    glow: "rgba(167, 139, 250, 0.55)",
    text: "#ede9fe",
  },
  legend: {
    fill: "#B91C1C",
    stroke: "#F87171",
    glow: "rgba(248, 113, 113, 0.55)",
    text: "#fef2f2",
  },
};

interface BadgeTierIconProps {
  tier: BadgeTier;
  achieved: boolean;
  isCurrentMax: boolean;
  isNextUpgrade: boolean;
  dimmed?: boolean;
  size?: number;
}

export function BadgeTierIcon({
  tier,
  achieved,
  isCurrentMax,
  isNextUpgrade,
  dimmed = false,
  size = 44,
}: BadgeTierIconProps) {
  const style = TIER_STYLES[tier];
  const opacity = dimmed ? 0.35 : achieved ? 1 : 0.55;
  const scale = isCurrentMax ? 1.08 : 1;

  return (
    <div
      className="flex flex-col items-center"
      style={{
        opacity,
        transform: `scale(${scale})`,
        filter: achieved
          ? `drop-shadow(0 0 6px ${style.glow})`
          : undefined,
      }}
      title={BADGE_TIER_LABELS[tier]}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        className={
          isNextUpgrade && !achieved
            ? "animate-pulse"
            : isCurrentMax
              ? "ring-2 ring-white/80 ring-offset-1 ring-offset-black rounded"
              : ""
        }
      >
        <path
          d="M24 2 L42 12 L42 30 C42 38 24 46 24 46 C24 46 6 38 6 30 L6 12 Z"
          fill={achieved ? style.fill : "#1a1a1a"}
          stroke={style.stroke}
          strokeWidth={achieved ? 2.5 : 1.5}
        />
        <text
          x="24"
          y="28"
          textAnchor="middle"
          fill={achieved ? style.text : style.stroke}
          fontSize="9"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          {tier === "hof" ? "HOF" : tier === "legend" ? "LGD" : tier[0].toUpperCase()}
        </text>
      </svg>
      <span
        className={`mt-0.5 text-[9px] font-bold uppercase tracking-wide ${
          achieved ? "text-white" : "text-white/50"
        }`}
      >
        {BADGE_TIER_LABELS[tier]}
      </span>
    </div>
  );
}

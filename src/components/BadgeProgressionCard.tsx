"use client";

import type { BadgeProgressionResult, BadgeTierSlot } from "@/lib/types/build";
import { ATTRIBUTE_LABELS } from "@/lib/constants/attributes";
import { BadgeTierIcon } from "./BadgeTierIcon";

const CATEGORY_COLORS: Record<string, string> = {
  shooting: "border-green-500/40",
  finishing: "border-sky-500/40",
  playmaking: "border-orange-500/40",
  defense: "border-red-500/40",
  rebounding: "border-purple-500/40",
  physical: "border-amber-600/40",
};

function formatGaps(slot: BadgeTierSlot): string | null {
  if (slot.achieved) return null;

  if (slot.gapsFromCurrent.length > 0) {
    return slot.gapsFromCurrent
      .map(
        (g) =>
          `+${g.deficit} ${ATTRIBUTE_LABELS[g.attribute].replace("Three-Point", "3PT").replace("Mid-Range", "Mid")}`,
      )
      .join(", ");
  }

  if (slot.gapsFromAbsoluteMax.length > 0) {
    return `Need cap: ${slot.gapsFromAbsoluteMax
      .map(
        (g) =>
          `${g.required} ${ATTRIBUTE_LABELS[g.attribute].replace("Three-Point", "3PT").replace("Mid-Range", "Mid")}`,
      )
      .join(", ")}`;
  }

  return null;
}

interface BadgeProgressionCardProps {
  badge: BadgeProgressionResult;
  pinned: boolean;
  onTogglePin: () => void;
}

export function BadgeProgressionCard({
  badge,
  pinned,
  onTogglePin,
}: BadgeProgressionCardProps) {
  if (badge.heightBlocked) {
    return (
      <div
        className={`rounded-lg border bg-black/40 p-4 opacity-60 ${CATEGORY_COLORS[badge.category] ?? "border-border"}`}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-white/70">{badge.badgeName}</h3>
          <input type="checkbox" checked={pinned} onChange={onTogglePin} />
        </div>
        <p className="mt-2 text-xs text-red-400">Height blocked for this badge</p>
      </div>
    );
  }

  if (badge.tiers.length === 0) {
    return (
      <div
        className={`rounded-lg border bg-black/40 p-4 opacity-60 ${CATEGORY_COLORS[badge.category] ?? "border-border"}`}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-white/70">{badge.badgeName}</h3>
          <input type="checkbox" checked={pinned} onChange={onTogglePin} />
        </div>
        <p className="mt-2 text-xs text-muted">
          Not achievable at absolute body max
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border bg-black/40 p-4 ${CATEGORY_COLORS[badge.category] ?? "border-border"}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-white">{badge.badgeName}</h3>
          <p className="text-[10px] uppercase tracking-wide text-white/40">
            {badge.category}
            {badge.maxPotentialTier && (
              <>
                {" "}
                · ceiling{" "}
                <span className="text-accent">{badge.maxPotentialTier}</span>
              </>
            )}
          </p>
        </div>
        <input
          type="checkbox"
          checked={pinned}
          onChange={onTogglePin}
          title="Pin for optimizer priority"
        />
      </div>

      <div className="flex flex-wrap items-start justify-start gap-3">
        {badge.tiers.map((slot) => {
          const upgradeText = formatGaps(slot);
          return (
            <div
              key={slot.tier}
              className="flex w-[72px] flex-col items-center text-center"
            >
              <BadgeTierIcon
                tier={slot.tier}
                achieved={slot.achieved}
                isCurrentMax={slot.isCurrentMax}
                isNextUpgrade={slot.isNextUpgrade}
              />
              <div className="mt-1.5 min-h-[2.5rem] w-full text-[9px] leading-tight text-white/60">
                {slot.achieved ? (
                  <span className="text-emerald-400/90">✓ {slot.requirementLabel}</span>
                ) : (
                  <>
                    <div className="text-white/40">{slot.requirementLabel}</div>
                    {upgradeText && (
                      <div
                        className={`mt-0.5 font-semibold ${
                          slot.isNextUpgrade
                            ? "text-amber-300"
                            : "text-white/70"
                        }`}
                      >
                        {upgradeText}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

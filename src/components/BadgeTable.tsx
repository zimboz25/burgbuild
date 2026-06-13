"use client";

import { useMemo, useState } from "react";
import { useBuildStore } from "@/lib/store/build-store";
import { evaluateBadgeProgressions } from "@/lib/engines/badge-engine";
import { lookupMaxPotentials } from "@/lib/engines/potential-lookup";
import { getEffectiveBodyMaxes } from "@/lib/utils/build-helpers";
import { BadgeProgressionCard } from "./BadgeProgressionCard";
import type { BadgeCategory } from "@/lib/types/build";

export function BadgeTable() {
  const build = useBuildStore((s) => s.build);
  const toggleTarget = useBuildStore((s) => s.toggleTargetBadge);
  const [filter, setFilter] = useState<BadgeCategory | "all">("all");

  const progressions = useMemo(() => {
    const lookup = lookupMaxPotentials(
      build.position,
      build.heightInches,
      build.weightLbs,
      build.wingspanInches,
    ).maxPotentials;
    const absoluteMax = getEffectiveBodyMaxes(build, lookup);
    return evaluateBadgeProgressions(
      build.currentAttributes,
      absoluteMax,
      build.heightInches,
      build.badgePerks,
    );
  }, [build]);

  const filtered =
    filter === "all"
      ? progressions
      : progressions.filter((r) => r.category === filter);

  return (
    <div>
      <p className="mb-4 text-sm text-white/50">
        Tier icons show your current level (glow). Under each icon: requirements
        to unlock that tier, up to the max possible at your absolute body
        ceiling.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            "all",
            "shooting",
            "finishing",
            "playmaking",
            "defense",
            "rebounding",
            "physical",
          ] as const
        ).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`rounded-full px-3 py-1 text-xs capitalize ${
              filter === cat
                ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/50"
                : "bg-black/40 border border-white/10 text-white/60 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((badge) => (
          <BadgeProgressionCard
            key={badge.badgeId}
            badge={badge}
            pinned={build.targetBadgeIds?.includes(badge.badgeId) ?? false}
            onTogglePin={() => toggleTarget(badge.badgeId)}
          />
        ))}
      </div>
    </div>
  );
}

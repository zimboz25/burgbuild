"use client";

import { ATTRIBUTE_LABELS } from "@/lib/constants/attributes";
import { BADGE_TIER_LABELS } from "@/lib/constants/attributes";
import type { VCUpgradeSuggestion } from "@/lib/types/build";
import { BADGES } from "@/lib/engines/badge-engine";

interface UpgradeCardProps {
  suggestion: VCUpgradeSuggestion;
  index: number;
}

export function UpgradeCard({ suggestion, index }: UpgradeCardProps) {
  const badgeName = (id: string) =>
    BADGES.find((b) => b.id === id)?.name ?? id;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs text-muted">#{index + 1}</span>
          <h4 className="font-medium text-accent">
            {ATTRIBUTE_LABELS[suggestion.attribute]} {suggestion.from} →{" "}
            {suggestion.to}
          </h4>
        </div>
        <div className="text-right text-sm">
          <div>{suggestion.vcCost.toLocaleString()} VC</div>
          <div className="text-muted">
            Total: {suggestion.cumulativeVC.toLocaleString()} VC
          </div>
        </div>
      </div>
      {(suggestion.badgesGained.length > 0 ||
        suggestion.badgesUpgraded.length > 0) && (
        <div className="mt-2 text-xs text-muted">
          {suggestion.badgesGained.length > 0 && (
            <p>
              Unlocks:{" "}
              {suggestion.badgesGained.map(badgeName).join(", ")}
            </p>
          )}
          {suggestion.badgesUpgraded.length > 0 && (
            <p>
              Upgrades:{" "}
              {suggestion.badgesUpgraded
                .map(
                  (u) =>
                    `${badgeName(u.badgeId)} → ${BADGE_TIER_LABELS[u.to]}`,
                )
                .join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { ATTRIBUTE_LABELS, BADGE_TIER_LABELS } from "@/lib/constants/attributes";
import type { CapBreakerPlan } from "@/lib/types/build";
import { BADGES } from "@/lib/engines/badge-engine";

interface Props {
  plan: CapBreakerPlan;
  rank: number;
}

export function CapBreakerPlanCard({ plan, rank }: Props) {
  const badgeName = (id: string) =>
    BADGES.find((b) => b.id === id)?.name ?? id;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-medium text-accent">
          Plan {rank}: {plan.label}
        </h4>
        <span className="text-sm text-muted">
          {plan.totalBreakersUsed} cap breaker(s)
        </span>
      </div>
      <ul className="mb-2 space-y-1 text-sm">
        {plan.allocations.map((a) => (
          <li key={a.attribute}>
            {ATTRIBUTE_LABELS[a.attribute]}: {a.from} → {a.to} (
            {a.breakersUsed} CB)
          </li>
        ))}
      </ul>
      {(plan.badgesGained.length > 0 || plan.badgesUpgraded.length > 0) && (
        <div className="text-xs text-muted">
          {plan.badgesGained.length > 0 && (
            <p>Unlocks: {plan.badgesGained.map(badgeName).join(", ")}</p>
          )}
          {plan.badgesUpgraded.length > 0 && (
            <p>
              Upgrades:{" "}
              {plan.badgesUpgraded
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

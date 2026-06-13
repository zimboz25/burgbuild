import type {
  Attributes,
  AttributeKey,
  BadgeCategory,
  BuildProfile,
  CapBreakerPlan,
} from "@/lib/types/build";
import { ATTRIBUTE_KEYS, ATTRIBUTE_CATEGORIES } from "@/lib/constants/attributes";
import { getAllocatedCaps } from "@/lib/utils/build-helpers";
import { evaluateBadges, compareBadgeResults } from "./badge-engine";
import {
  applyCapBreaker,
  MAX_CAP_BREAKERS_PER_ATTRIBUTE,
} from "./cap-breaker";

interface OptimizeInput {
  build: BuildProfile;
  maxPotentials: Attributes;
}

function canUseCapBreakerOn(
  key: AttributeKey,
  category: BadgeCategory | undefined,
  universalRemaining: number,
  specRemaining: number,
): boolean {
  if (universalRemaining > 0) return true;
  if (!category || specRemaining <= 0) return false;
  const attrCategory = ATTRIBUTE_CATEGORIES[key];
  return attrCategory === category || attrCategory === "physical";
}

function simulateAllocation(
  build: BuildProfile,
  maxPotentials: Attributes,
  allocations: { key: AttributeKey; count: number }[],
): CapBreakerPlan | null {
  const allocatedCaps = getAllocatedCaps(build);
  const attrs = { ...build.currentAttributes };
  const applied = { ...(build.capBreakersApplied ?? {}) };
  let universalLeft = build.capBreakers.universal;
  const specLeft = { ...(build.capBreakers.specialization ?? {}) };

  const planAllocations: CapBreakerPlan["allocations"] = [];

  for (const { key, count } of allocations) {
    if (count <= 0) continue;
    const already = applied[key] ?? 0;
    if (already + count > MAX_CAP_BREAKERS_PER_ATTRIBUTE) return null;

    let from = attrs[key];
    let to = from;
    for (let i = 0; i < count; i++) {
      if (to >= maxPotentials[key]) return null;
      const cat = specLeft
        ? (Object.keys(specLeft).find(
            (c) =>
              (specLeft[c as BadgeCategory] ?? 0) > 0 &&
              canUseCapBreakerOn(
                key,
                c as BadgeCategory,
                universalLeft,
                specLeft[c as BadgeCategory] ?? 0,
              ),
          ) as BadgeCategory | undefined)
        : undefined;

      if (universalLeft > 0) {
        universalLeft -= 1;
      } else if (cat && (specLeft[cat] ?? 0) > 0) {
        specLeft[cat] = (specLeft[cat] ?? 0) - 1;
      } else {
        return null;
      }
      to = applyCapBreaker(
        allocatedCaps[key],
        to,
        maxPotentials[key],
        already + i,
        key,
      );
    }

    planAllocations.push({
      attribute: key,
      breakersUsed: count,
      from,
      to,
    });
    attrs[key] = to;
  }

  const before = evaluateBadges(
    build.currentAttributes,
    build.heightInches,
    build.badgePerks,
  );
  const after = evaluateBadges(
    attrs,
    build.heightInches,
    build.badgePerks,
  );
  const { gained, upgraded } = compareBadgeResults(before, after);
  const totalBreakersUsed = planAllocations.reduce(
    (s, a) => s + a.breakersUsed,
    0,
  );

  if (totalBreakersUsed === 0) return null;

  const targetIds = build.targetBadgeIds ?? [];
  const targetHits = [...gained, ...upgraded.map((u) => u.badgeId)].filter(
    (id) => targetIds.includes(id),
  ).length;

  return {
    id: allocations.map((a) => `${a.key}:${a.count}`).join("|"),
    label:
      planAllocations.length === 1
        ? `${planAllocations[0].breakersUsed} CB on ${planAllocations[0].attribute} (${planAllocations[0].from}→${planAllocations[0].to})`
        : `Spread ${totalBreakersUsed} cap breakers`,
    allocations: planAllocations,
    badgesGained: gained,
    badgesUpgraded: upgraded,
    totalBreakersUsed,
    targetHits,
  } as CapBreakerPlan & { targetHits: number };
}

export function optimizeCapBreakers({
  build,
  maxPotentials,
}: OptimizeInput): CapBreakerPlan[] {
  const allocatedCaps = getAllocatedCaps(build);
  const totalBreakers =
    build.capBreakers.universal +
    Object.values(build.capBreakers.specialization ?? {}).reduce(
      (a, b) => a + (b ?? 0),
      0,
    );
  if (totalBreakers <= 0) return [];

  const candidates: CapBreakerPlan[] = [];
  const targetBadgeIds = build.targetBadgeIds ?? [];

  for (const key of ATTRIBUTE_KEYS) {
    if (build.currentAttributes[key] < allocatedCaps[key]) continue;
    for (let count = 1; count <= Math.min(5, totalBreakers); count++) {
      const plan = simulateAllocation(build, maxPotentials, [
        { key, count },
      ]);
      if (plan) candidates.push(plan);
    }
  }

  const topAttrs = ATTRIBUTE_KEYS.filter(
    (k) =>
      build.currentAttributes[k] >= allocatedCaps[k] &&
      build.currentAttributes[k] < maxPotentials[k],
  ).slice(0, 8);

  if (topAttrs.length >= 2 && totalBreakers >= 2) {
    for (let i = 0; i < topAttrs.length; i++) {
      for (let j = i + 1; j < topAttrs.length; j++) {
        const plan = simulateAllocation(build, maxPotentials, [
          { key: topAttrs[i], count: 1 },
          { key: topAttrs[j], count: 1 },
        ]);
        if (plan) candidates.push(plan);
      }
    }
  }

  const scored = candidates
    .map((p) => {
      const ext = p as CapBreakerPlan & { targetHits?: number };
      const impact =
        p.badgesGained.length * 100 +
        p.badgesUpgraded.length * 50 +
        (ext.targetHits ?? 0) * 200;
      return { plan: p, score: impact / p.totalBreakersUsed };
    })
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const results: CapBreakerPlan[] = [];
  for (const { plan } of scored) {
    if (seen.has(plan.id)) continue;
    seen.add(plan.id);
    results.push(plan);
    if (results.length >= 3) break;
  }

  return results.map((p) => {
    const { targetHits: _, ...rest } = p as CapBreakerPlan & {
      targetHits?: number;
    };
    void _;
    if (targetBadgeIds.length > 0 && p.badgesGained.length > 0) {
      rest.label += ` — unlocks ${p.badgesGained.length} badge(s)`;
    }
    return rest;
  });
}

import type {
  Attributes,
  AttributeKey,
  BuildProfile,
  VCUpgradeSuggestion,
} from "@/lib/types/build";
import { ATTRIBUTE_KEYS } from "@/lib/constants/attributes";
import { getAllocatedCaps } from "@/lib/utils/build-helpers";
import { evaluateBadges, compareBadgeResults } from "./badge-engine";
import { getVcCostForUpgrade } from "./vc-cost";

interface OptimizeInput {
  build: BuildProfile;
  maxPotentials: Attributes;
}

function scoreUpgrade(
  badgesGained: string[],
  badgesUpgraded: { badgeId: string }[],
  vcCost: number,
  targetBadgeIds: string[],
): number {
  if (vcCost <= 0) return 0;
  let score =
    badgesGained.length * 100 + badgesUpgraded.length * 50;
  for (const id of [...badgesGained, ...badgesUpgraded.map((u) => u.badgeId)]) {
    if (targetBadgeIds.includes(id)) score += 200;
  }
  return score / vcCost;
}

export function optimizeVCUpgrades({
  build,
  maxPotentials,
}: OptimizeInput): VCUpgradeSuggestion[] {
  const budget = build.availableVC;
  if (budget <= 0) return [];

  const targetBadgeIds = build.targetBadgeIds ?? [];
  const allocatedCaps = getAllocatedCaps(build);
  const suggestions: VCUpgradeSuggestion[] = [];
  let remaining = budget;
  let attrs = { ...build.currentAttributes };
  let cumulativeVC = 0;

  const maxSteps = 50;
  for (let step = 0; step < maxSteps && remaining > 0; step++) {
    let best: {
      key: AttributeKey;
      cost: number;
      score: number;
      gained: string[];
      upgraded: ReturnType<typeof compareBadgeResults>["upgraded"];
    } | null = null;

    const beforeBadges = evaluateBadges(
      attrs,
      build.heightInches,
      build.badgePerks,
    );

    for (const key of ATTRIBUTE_KEYS) {
      const vcCeiling = Math.min(allocatedCaps[key], maxPotentials[key]);
      if (attrs[key] >= vcCeiling) continue;
      const cost = getVcCostForUpgrade(attrs[key], attrs[key] + 1);
      if (cost > remaining) continue;

      const trial = { ...attrs, [key]: attrs[key] + 1 };
      const afterBadges = evaluateBadges(
        trial,
        build.heightInches,
        build.badgePerks,
      );
      const { gained, upgraded } = compareBadgeResults(
        beforeBadges,
        afterBadges,
      );
      const score = scoreUpgrade(gained, upgraded, cost, targetBadgeIds);

      if (!best || score > best.score) {
        best = { key, cost, score, gained, upgraded };
      }
    }

    if (!best || best.score <= 0) break;

    attrs[best.key] += 1;
    remaining -= best.cost;
    cumulativeVC += best.cost;
    suggestions.push({
      attribute: best.key,
      from: attrs[best.key] - 1,
      to: attrs[best.key],
      vcCost: best.cost,
      cumulativeVC,
      badgesGained: best.gained,
      badgesUpgraded: best.upgraded,
    });
  }

  return suggestions;
}

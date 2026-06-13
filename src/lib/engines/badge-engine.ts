import badgesData from "@/data/badges.json";
import type {
  Attributes,
  AttributeKey,
  BadgeDefinition,
  BadgeEligibilityResult,
  BadgeProgressionResult,
  BadgeStatGap,
  BadgeTier,
  BadgeTierSlot,
  HeightGate,
  StatRequirementGroup,
} from "@/lib/types/build";
import {
  ATTRIBUTE_LABELS,
  BADGE_TIER_ORDER,
} from "@/lib/constants/attributes";

export const BADGES = badgesData as BadgeDefinition[];

function passesHeightGate(gate: HeightGate, heightInches: number): boolean {
  if (gate.type === "all") return true;
  if (gate.type === "range") {
    return (
      heightInches >= gate.minInches && heightInches <= gate.maxInches
    );
  }
  if (gate.type === "under") return heightInches <= gate.inches;
  return heightInches >= gate.inches;
}

function groupSatisfied(
  group: StatRequirementGroup,
  attributes: Attributes,
): { met: boolean; missing: BadgeEligibilityResult["missingStats"] } {
  const missing: BadgeEligibilityResult["missingStats"] = [];

  if (group.logic === "and") {
    for (const req of group.requirements) {
      const current = attributes[req.attribute];
      if (current < req.value) {
        missing.push({
          attribute: req.attribute,
          required: req.value,
          current,
          deficit: req.value - current,
        });
      }
    }
    return { met: missing.length === 0, missing };
  }

  const anyMet = group.requirements.some(
    (req) => attributes[req.attribute] >= req.value,
  );
  if (anyMet) return { met: true, missing: [] };

  const best = group.requirements.reduce((a, b) =>
    attributes[a.attribute] - a.value > attributes[b.attribute] - b.value
      ? a
      : b,
  );
  const current = attributes[best.attribute];
  missing.push({
    attribute: best.attribute,
    required: best.value,
    current,
    deficit: best.value - current,
  });
  return { met: false, missing };
}

function tierSatisfied(
  badge: BadgeDefinition,
  tier: BadgeTier,
  attributes: Attributes,
  heightInches: number,
): { met: boolean; missing: BadgeEligibilityResult["missingStats"] } {
  if (!passesHeightGate(badge.heightGate, heightInches)) {
    return { met: false, missing: [] };
  }
  const tierDef = badge.tiers.find((t) => t.tier === tier);
  if (!tierDef) return { met: false, missing: [] };

  const allMissing: BadgeEligibilityResult["missingStats"] = [];
  for (const group of tierDef.statGroups) {
    const { met, missing } = groupSatisfied(group, attributes);
    if (!met) {
      allMissing.push(...missing);
      return { met: false, missing: allMissing };
    }
  }
  return { met: true, missing: [] };
}

export function getMaxEligibleTier(
  badge: BadgeDefinition,
  attributes: Attributes,
  heightInches: number,
  perkBonus = 0,
): BadgeTier | null {
  if (!passesHeightGate(badge.heightGate, heightInches)) return null;

  let maxTier: BadgeTier | null = null;
  for (const tier of BADGE_TIER_ORDER) {
    const { met } = tierSatisfied(badge, tier, attributes, heightInches);
    if (met) maxTier = tier;
  }

  if (!maxTier || perkBonus === 0) return maxTier;

  const idx = BADGE_TIER_ORDER.indexOf(maxTier);
  const boosted = Math.min(
    BADGE_TIER_ORDER.length - 1,
    idx + perkBonus,
  );
  return BADGE_TIER_ORDER[boosted];
}

export function evaluateBadges(
  attributes: Attributes,
  heightInches: number,
  badgePerks?: Partial<Record<string, 1 | 2>>,
): BadgeEligibilityResult[] {
  return BADGES.map((badge) => {
    const heightBlocked = !passesHeightGate(badge.heightGate, heightInches);
    const perkBonus = badgePerks?.[badge.category] ?? 0;
    const maxEligibleTier = heightBlocked
      ? null
      : getMaxEligibleTier(badge, attributes, heightInches, perkBonus);

    let nextTier: BadgeTier | null = null;
    let missingStats: BadgeEligibilityResult["missingStats"] = [];

    if (!heightBlocked) {
      const currentIdx = maxEligibleTier
        ? BADGE_TIER_ORDER.indexOf(maxEligibleTier)
        : -1;
      nextTier =
        currentIdx < BADGE_TIER_ORDER.length - 1
          ? BADGE_TIER_ORDER[currentIdx + 1]
          : null;

      if (nextTier) {
        const { missing } = tierSatisfied(
          badge,
          nextTier,
          attributes,
          heightInches,
        );
        missingStats = missing;
      }
    }

    return {
      badgeId: badge.id,
      badgeName: badge.name,
      category: badge.category,
      maxEligibleTier,
      nextTier,
      missingStats,
      heightBlocked,
    };
  });
}

function formatRequirementLabel(group: StatRequirementGroup): string {
  const parts = group.requirements.map(
    (r) => `${r.value} ${shortAttrLabel(r.attribute)}`,
  );
  return group.logic === "or" ? parts.join(" OR ") : parts.join(" + ");
}

function shortAttrLabel(key: AttributeKey): string {
  return ATTRIBUTE_LABELS[key]
    .replace("Three-Point", "3PT")
    .replace("Mid-Range", "Mid")
    .replace("Driving Layup", "Layup")
    .replace("Ball Handle", "BH")
    .replace("Pass Accuracy", "Pass")
    .replace("Perimeter Defense", "Per D")
    .replace("Interior Defense", "Int D")
    .replace("Offensive Rebound", "OREB")
    .replace("Defensive Rebound", "DREB")
    .replace("Speed with Ball", "Spd/Ball");
}

function tierRequirementLabel(badge: BadgeDefinition, tier: BadgeTier): string {
  const tierDef = badge.tiers.find((t) => t.tier === tier);
  if (!tierDef) return "";
  return tierDef.statGroups.map(formatRequirementLabel).join(" · ");
}

function gapsForOrGroup(
  group: StatRequirementGroup,
  attributes: Attributes,
): BadgeStatGap[] {
  const branches = group.requirements.map((req) => ({
    attribute: req.attribute,
    required: req.value,
    current: attributes[req.attribute],
    deficit: Math.max(0, req.value - attributes[req.attribute]),
  }));
  if (branches.some((b) => b.deficit === 0)) return [];
  return [branches.sort((a, b) => a.deficit - b.deficit)[0]];
}

function gapsForTier(
  badge: BadgeDefinition,
  tier: BadgeTier,
  attributes: Attributes,
  heightInches: number,
): BadgeStatGap[] {
  if (!passesHeightGate(badge.heightGate, heightInches)) return [];
  const tierDef = badge.tiers.find((t) => t.tier === tier);
  if (!tierDef) return [];

  const gaps: BadgeStatGap[] = [];
  for (const group of tierDef.statGroups) {
    if (group.logic === "and") {
      for (const req of group.requirements) {
        const current = attributes[req.attribute];
        if (current < req.value) {
          gaps.push({
            attribute: req.attribute,
            required: req.value,
            current,
            deficit: req.value - current,
          });
        }
      }
    } else {
      gaps.push(...gapsForOrGroup(group, attributes));
    }
  }
  return gaps;
}

function tierAchieved(
  badge: BadgeDefinition,
  tier: BadgeTier,
  attributes: Attributes,
  heightInches: number,
): boolean {
  return tierSatisfied(badge, tier, attributes, heightInches).met;
}

export function evaluateBadgeProgressions(
  currentAttributes: Attributes,
  absoluteMaxAttributes: Attributes,
  heightInches: number,
  badgePerks?: Partial<Record<string, 1 | 2>>,
): BadgeProgressionResult[] {
  return BADGES.map((badge) => {
    const heightBlocked = !passesHeightGate(badge.heightGate, heightInches);
    const perkBonus = badgePerks?.[badge.category] ?? 0;

    const maxEligibleTier = heightBlocked
      ? null
      : getMaxEligibleTier(
          badge,
          currentAttributes,
          heightInches,
          perkBonus,
        );

    const maxPotentialTier = heightBlocked
      ? null
      : getMaxEligibleTier(
          badge,
          absoluteMaxAttributes,
          heightInches,
          perkBonus,
        );

    const maxPotentialIdx = maxPotentialTier
      ? BADGE_TIER_ORDER.indexOf(maxPotentialTier)
      : -1;

    const currentIdx = maxEligibleTier
      ? BADGE_TIER_ORDER.indexOf(maxEligibleTier)
      : -1;

    const nextTier =
      currentIdx < maxPotentialIdx ? BADGE_TIER_ORDER[currentIdx + 1] : null;

    const tiers: BadgeTierSlot[] = [];

    for (let i = 0; i <= maxPotentialIdx; i++) {
      const tier = BADGE_TIER_ORDER[i];
      const achieved = tierAchieved(
        badge,
        tier,
        currentAttributes,
        heightInches,
      );
      const achievableAtAbsoluteMax = tierAchieved(
        badge,
        tier,
        absoluteMaxAttributes,
        heightInches,
      );

      tiers.push({
        tier,
        achieved,
        achievableAtAbsoluteMax,
        isCurrentMax: maxEligibleTier === tier,
        isNextUpgrade: nextTier === tier,
        requirementLabel: tierRequirementLabel(badge, tier),
        gapsFromCurrent: achieved
          ? []
          : gapsForTier(badge, tier, currentAttributes, heightInches),
        gapsFromAbsoluteMax: achievableAtAbsoluteMax
          ? []
          : gapsForTier(badge, tier, absoluteMaxAttributes, heightInches),
      });
    }

    return {
      badgeId: badge.id,
      badgeName: badge.name,
      category: badge.category,
      heightBlocked,
      maxEligibleTier,
      maxPotentialTier,
      tiers,
    };
  });
}

export function compareBadgeResults(
  before: BadgeEligibilityResult[],
  after: BadgeEligibilityResult[],
): {
  gained: string[];
  upgraded: { badgeId: string; from: BadgeTier | null; to: BadgeTier }[];
} {
  const gained: string[] = [];
  const upgraded: {
    badgeId: string;
    from: BadgeTier | null;
    to: BadgeTier;
  }[] = [];

  for (const a of after) {
    const b = before.find((x) => x.badgeId === a.badgeId);
    if (!b) continue;
    if (!b.maxEligibleTier && a.maxEligibleTier) {
      gained.push(a.badgeId);
    } else if (
      b.maxEligibleTier &&
      a.maxEligibleTier &&
      BADGE_TIER_ORDER.indexOf(a.maxEligibleTier) >
        BADGE_TIER_ORDER.indexOf(b.maxEligibleTier)
    ) {
      upgraded.push({
        badgeId: a.badgeId,
        from: b.maxEligibleTier,
        to: a.maxEligibleTier,
      });
    } else if (!b.maxEligibleTier && a.maxEligibleTier) {
      gained.push(a.badgeId);
    }
  }
  return { gained, upgraded };
}

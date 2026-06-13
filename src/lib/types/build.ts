export type Position = "PG" | "SG" | "SF" | "PF" | "C";

export type BadgeCategory =
  | "shooting"
  | "finishing"
  | "playmaking"
  | "defense"
  | "rebounding"
  | "physical";

export type BadgeTier = "bronze" | "silver" | "gold" | "hof" | "legend";

export type AttributeKey =
  | "closeShot"
  | "drivingLayup"
  | "drivingDunk"
  | "standingDunk"
  | "postControl"
  | "midRange"
  | "threePoint"
  | "freeThrow"
  | "passAccuracy"
  | "ballHandle"
  | "speedWithBall"
  | "interiorDefense"
  | "perimeterDefense"
  | "steal"
  | "block"
  | "offensiveRebound"
  | "defensiveRebound"
  | "speed"
  | "agility"
  | "strength"
  | "vertical"
  | "stamina";

export type Attributes = Record<AttributeKey, number>;

export type HeightGate =
  | { type: "all" }
  | { type: "range"; minInches: number; maxInches: number }
  | { type: "under"; inches: number }
  | { type: "atLeast"; inches: number };

export interface StatRequirement {
  attribute: AttributeKey;
  value: number;
}

export interface StatRequirementGroup {
  logic: "and" | "or";
  requirements: StatRequirement[];
}

export interface BadgeTierRequirement {
  tier: BadgeTier;
  statGroups: StatRequirementGroup[];
}

export interface BadgeDefinition {
  id: string;
  name: string;
  category: BadgeCategory;
  heightGate: HeightGate;
  tiers: BadgeTierRequirement[];
}

export interface BodyConstraints {
  position: Position;
  heightMinInches: number;
  heightMaxInches: number;
  weightMinLbs: number;
  weightMaxLbs: number;
  defaultWeightLbs: number;
  wingspanOffsetMin: number;
  wingspanOffsetMax: number;
}

export interface PotentialAnchor {
  heightInches: number;
  weightLbs: number;
  wingspanInches: number;
  maxPotentials: Attributes;
}

export type PotentialConfidence = "exact" | "interpolated" | "low-confidence";

export interface PotentialLookupResult {
  maxPotentials: Attributes;
  confidence: PotentialConfidence;
}

export interface BuildProfile {
  name: string;
  position: Position;
  heightInches: number;
  weightLbs: number;
  wingspanInches: number;
  currentAttributes: Attributes;
  /** Max allocated per stat at build creation (VC upgrade ceiling). */
  allocatedCaps?: Attributes;
  /** Manual correction when lookup body ceiling differs from in-game. */
  bodyMaxOverrides?: Partial<Attributes>;
  baseCaps?: Partial<Attributes>;
  availableVC: number;
  capBreakers: {
    universal: number;
    specialization?: Partial<Record<BadgeCategory, number>>;
  };
  capBreakersApplied?: Partial<Record<AttributeKey, number>>;
  badgePerks?: Partial<Record<BadgeCategory, 1 | 2>>;
  targetBadgeIds?: string[];
}

export interface BadgeStatGap {
  attribute: AttributeKey;
  required: number;
  current: number;
  deficit: number;
}

export interface BadgeTierSlot {
  tier: BadgeTier;
  achieved: boolean;
  achievableAtAbsoluteMax: boolean;
  isCurrentMax: boolean;
  isNextUpgrade: boolean;
  /** Formatted requirement line(s) for this tier threshold */
  requirementLabel: string;
  /** Gaps from current stats to unlock this tier (empty if already achieved) */
  gapsFromCurrent: BadgeStatGap[];
  /** Gaps from absolute-max stats if still not reachable at ceiling */
  gapsFromAbsoluteMax: BadgeStatGap[];
}

export interface BadgeProgressionResult {
  badgeId: string;
  badgeName: string;
  category: BadgeCategory;
  heightBlocked: boolean;
  maxEligibleTier: BadgeTier | null;
  maxPotentialTier: BadgeTier | null;
  tiers: BadgeTierSlot[];
}

export interface BadgeEligibilityResult {
  badgeId: string;
  badgeName: string;
  category: BadgeCategory;
  maxEligibleTier: BadgeTier | null;
  nextTier: BadgeTier | null;
  missingStats: BadgeStatGap[];
  heightBlocked: boolean;
}

export interface VCUpgradeSuggestion {
  attribute: AttributeKey;
  from: number;
  to: number;
  vcCost: number;
  cumulativeVC: number;
  badgesGained: string[];
  badgesUpgraded: { badgeId: string; from: BadgeTier | null; to: BadgeTier }[];
}

export interface CapBreakerAllocation {
  attribute: AttributeKey;
  breakersUsed: number;
  from: number;
  to: number;
}

export interface CapBreakerPlan {
  id: string;
  label: string;
  allocations: CapBreakerAllocation[];
  badgesGained: string[];
  badgesUpgraded: { badgeId: string; from: BadgeTier | null; to: BadgeTier }[];
  totalBreakersUsed: number;
}

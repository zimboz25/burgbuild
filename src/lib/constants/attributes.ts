import type { AttributeKey, BadgeCategory } from "@/lib/types/build";

export const ATTRIBUTE_KEYS: AttributeKey[] = [
  "closeShot",
  "drivingLayup",
  "drivingDunk",
  "standingDunk",
  "postControl",
  "midRange",
  "threePoint",
  "freeThrow",
  "passAccuracy",
  "ballHandle",
  "speedWithBall",
  "interiorDefense",
  "perimeterDefense",
  "steal",
  "block",
  "offensiveRebound",
  "defensiveRebound",
  "speed",
  "agility",
  "strength",
  "vertical",
  "stamina",
];

export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  closeShot: "Close Shot",
  drivingLayup: "Driving Layup",
  drivingDunk: "Driving Dunk",
  standingDunk: "Standing Dunk",
  postControl: "Post Control",
  midRange: "Mid-Range",
  threePoint: "Three-Point",
  freeThrow: "Free Throw",
  passAccuracy: "Pass Accuracy",
  ballHandle: "Ball Handle",
  speedWithBall: "Speed w/ Ball",
  interiorDefense: "Interior Defense",
  perimeterDefense: "Perimeter Defense",
  steal: "Steal",
  block: "Block",
  offensiveRebound: "Offensive Rebound",
  defensiveRebound: "Defensive Rebound",
  speed: "Speed",
  agility: "Agility",
  strength: "Strength",
  vertical: "Vertical",
  stamina: "Stamina",
};

export const ATTRIBUTE_GROUPS: { label: string; keys: AttributeKey[] }[] = [
  {
    label: "Finishing",
    keys: [
      "closeShot",
      "drivingLayup",
      "drivingDunk",
      "standingDunk",
      "postControl",
    ],
  },
  {
    label: "Shooting",
    keys: ["midRange", "threePoint", "freeThrow"],
  },
  {
    label: "Playmaking",
    keys: ["passAccuracy", "ballHandle", "speedWithBall"],
  },
  {
    label: "Defense",
    keys: ["interiorDefense", "perimeterDefense", "steal", "block"],
  },
  {
    label: "Rebounding",
    keys: ["offensiveRebound", "defensiveRebound"],
  },
  {
    label: "Physical",
    keys: ["speed", "agility", "strength", "vertical", "stamina"],
  },
];

export const ATTRIBUTE_CATEGORIES: Record<AttributeKey, BadgeCategory> = {
  closeShot: "finishing",
  drivingLayup: "finishing",
  drivingDunk: "finishing",
  standingDunk: "finishing",
  postControl: "finishing",
  midRange: "shooting",
  threePoint: "shooting",
  freeThrow: "shooting",
  passAccuracy: "playmaking",
  ballHandle: "playmaking",
  speedWithBall: "playmaking",
  interiorDefense: "defense",
  perimeterDefense: "defense",
  steal: "defense",
  block: "defense",
  offensiveRebound: "rebounding",
  defensiveRebound: "rebounding",
  speed: "physical",
  agility: "physical",
  strength: "physical",
  vertical: "physical",
  stamina: "physical",
};

export const BADGE_TIER_ORDER: import("@/lib/types/build").BadgeTier[] = [
  "bronze",
  "silver",
  "gold",
  "hof",
  "legend",
];

export const BADGE_TIER_LABELS: Record<
  import("@/lib/types/build").BadgeTier,
  string
> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  hof: "HOF",
  legend: "Legend",
};

export function createDefaultAttributes(value = 25): Record<AttributeKey, number> {
  return Object.fromEntries(
    ATTRIBUTE_KEYS.map((k) => [k, value]),
  ) as Record<AttributeKey, number>;
}

export function inchesToFeetInches(inches: number): string {
  const ft = Math.floor(inches / 12);
  const inch = inches % 12;
  return `${ft}'${inch}"`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

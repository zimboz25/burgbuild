import type { Attributes, Position, PotentialAnchor } from "@/lib/types/build";
import type { AttributeKey } from "@/lib/types/build";
import { ATTRIBUTE_KEYS } from "@/lib/constants/attributes";

/** Height-normalized curve: 0 at min height, 1 at max height for position */
function heightFactor(
  heightInches: number,
  minH: number,
  maxH: number,
): number {
  return (heightInches - minH) / Math.max(1, maxH - minH);
}

function wingspanFactor(wingspanInches: number, heightInches: number): number {
  const offset = wingspanInches - heightInches;
  return offset / 6;
}

function weightFactor(weightLbs: number, defaultWeight: number): number {
  return (weightLbs - defaultWeight) / 40;
}

const POSITION_RANGES: Record<
  Position,
  { minH: number; maxH: number; defaultWeight: number }
> = {
  PG: { minH: 67, maxH: 77, defaultWeight: 180 },
  SG: { minH: 72, maxH: 80, defaultWeight: 190 },
  SF: { minH: 75, maxH: 82, defaultWeight: 210 },
  PF: { minH: 78, maxH: 84, defaultWeight: 230 },
  C: { minH: 80, maxH: 88, defaultWeight: 250 },
};

/** Attribute sensitivity: +1 means taller helps, -1 means taller hurts */
const HEIGHT_SENSITIVITY: Partial<Record<AttributeKey, number>> = {
  threePoint: -0.35,
  midRange: -0.15,
  ballHandle: -0.25,
  speedWithBall: -0.2,
  speed: -0.3,
  agility: -0.25,
  perimeterDefense: -0.1,
  steal: -0.05,
  drivingDunk: 0.35,
  standingDunk: 0.45,
  block: 0.4,
  interiorDefense: 0.25,
  offensiveRebound: 0.3,
  defensiveRebound: 0.35,
  postControl: 0.3,
  strength: 0.2,
  closeShot: 0.1,
  vertical: 0.05,
};

const WINGSPAN_SENSITIVITY: Partial<Record<AttributeKey, number>> = {
  perimeterDefense: 0.15,
  steal: 0.1,
  block: 0.12,
  threePoint: -0.08,
  midRange: -0.05,
};

const WEIGHT_SENSITIVITY: Partial<Record<AttributeKey, number>> = {
  strength: 0.2,
  speed: -0.12,
  agility: -0.1,
  vertical: -0.08,
};

const BASE_MAX: Record<AttributeKey, number> = {
  closeShot: 92,
  drivingLayup: 94,
  drivingDunk: 88,
  standingDunk: 85,
  postControl: 90,
  midRange: 94,
  threePoint: 92,
  freeThrow: 99,
  passAccuracy: 95,
  ballHandle: 96,
  speedWithBall: 92,
  interiorDefense: 93,
  perimeterDefense: 95,
  steal: 96,
  block: 94,
  offensiveRebound: 95,
  defensiveRebound: 97,
  speed: 95,
  agility: 94,
  strength: 96,
  vertical: 95,
  stamina: 99,
};

export function generateMaxPotentials(
  position: Position,
  heightInches: number,
  weightLbs: number,
  wingspanInches: number,
): Attributes {
  const range = POSITION_RANGES[position];
  const hf = heightFactor(heightInches, range.minH, range.maxH);
  const wf = weightFactor(weightLbs, range.defaultWeight);
  const wsf = wingspanFactor(wingspanInches, heightInches);

  const result = {} as Attributes;
  for (const key of ATTRIBUTE_KEYS) {
    const hSens = HEIGHT_SENSITIVITY[key] ?? 0;
    const wsSens = WINGSPAN_SENSITIVITY[key] ?? 0;
    const wSens = WEIGHT_SENSITIVITY[key] ?? 0;
    const delta = hSens * (hf - 0.5) * 24 + wsSens * wsf * 8 + wSens * wf * 6;
    result[key] = Math.round(
      Math.min(99, Math.max(60, BASE_MAX[key] + delta)),
    );
  }
  return result;
}

export function generateAnchorsForPosition(
  position: Position,
  heights: number[],
  weights: number[],
  wingspans: (height: number) => number[],
): PotentialAnchor[] {
  const anchors: PotentialAnchor[] = [];
  for (const heightInches of heights) {
    for (const weightLbs of weights) {
      for (const ws of wingspans(heightInches)) {
        anchors.push({
          heightInches,
          weightLbs,
          wingspanInches: ws,
          maxPotentials: generateMaxPotentials(
            position,
            heightInches,
            weightLbs,
            ws,
          ),
        });
      }
    }
  }
  return anchors;
}

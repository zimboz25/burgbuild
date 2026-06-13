import bodyConstraints from "@/data/body-constraints.json";
import pgAnchors from "@/data/potential-anchors/PG.json";
import sgAnchors from "@/data/potential-anchors/SG.json";
import sfAnchors from "@/data/potential-anchors/SF.json";
import pfAnchors from "@/data/potential-anchors/PF.json";
import cAnchors from "@/data/potential-anchors/C.json";
import type {
  Attributes,
  Position,
  PotentialAnchor,
  PotentialConfidence,
  PotentialLookupResult,
} from "@/lib/types/build";
import { ATTRIBUTE_KEYS } from "@/lib/constants/attributes";
import { clamp } from "@/lib/constants/attributes";
import { generateMaxPotentials } from "@/lib/data/potential-seed";

const ANCHORS_BY_POSITION: Record<Position, PotentialAnchor[]> = {
  PG: pgAnchors as PotentialAnchor[],
  SG: sgAnchors as PotentialAnchor[],
  SF: sfAnchors as PotentialAnchor[],
  PF: pfAnchors as PotentialAnchor[],
  C: cAnchors as PotentialAnchor[],
};

export function getBodyConstraints(position: Position) {
  return bodyConstraints.positions.find((p) => p.position === position)!;
}

export function validateBodyType(
  position: Position,
  heightInches: number,
  weightLbs: number,
  wingspanInches: number,
): { valid: boolean; errors: string[] } {
  const c = getBodyConstraints(position);
  const errors: string[] = [];
  if (heightInches < c.heightMinInches || heightInches > c.heightMaxInches) {
    errors.push(
      `Height must be between ${c.heightMinInches}" and ${c.heightMaxInches}" for ${position}`,
    );
  }
  if (weightLbs < c.weightMinLbs || weightLbs > c.weightMaxLbs) {
    errors.push(`Weight must be between ${c.weightMinLbs} and ${c.weightMaxLbs} lbs`);
  }
  const wsMin = heightInches + bodyConstraints.wingspanOffsetMin;
  const wsMax = heightInches + bodyConstraints.wingspanOffsetMax;
  if (wingspanInches < wsMin || wingspanInches > wsMax) {
    errors.push(`Wingspan must be within ±6" of height (${wsMin}"–${wsMax}")`);
  }
  return { valid: errors.length === 0, errors };
}

function exactMatch(
  anchors: PotentialAnchor[],
  heightInches: number,
  weightLbs: number,
  wingspanInches: number,
): PotentialAnchor | undefined {
  return anchors.find(
    (a) =>
      a.heightInches === heightInches &&
      a.weightLbs === weightLbs &&
      a.wingspanInches === wingspanInches,
  );
}

function interpolateValue(
  valueA: number,
  valueB: number,
  t: number,
): number {
  return Math.round(valueA + (valueB - valueA) * t);
}

function lerpAttributes(a: Attributes, b: Attributes, t: number): Attributes {
  const result = {} as Attributes;
  for (const key of ATTRIBUTE_KEYS) {
    result[key] = interpolateValue(a[key], b[key], t);
  }
  return result;
}

function findBracket(
  anchors: PotentialAnchor[],
  getter: (a: PotentialAnchor) => number,
  target: number,
): { low?: PotentialAnchor; high?: PotentialAnchor; t: number } {
  const sorted = [...anchors].sort((x, y) => getter(x) - getter(y));
  const values = [...new Set(sorted.map(getter))];
  if (values.length === 0) return { t: 0 };
  if (target <= values[0]) {
    const low = sorted.find((a) => getter(a) === values[0]);
    return { low, high: low, t: 0 };
  }
  if (target >= values[values.length - 1]) {
    const high = sorted.find((a) => getter(a) === values[values.length - 1]);
    return { low: high, high, t: 0 };
  }
  let lowVal = values[0];
  let highVal = values[values.length - 1];
  for (let i = 0; i < values.length - 1; i++) {
    if (target >= values[i] && target <= values[i + 1]) {
      lowVal = values[i];
      highVal = values[i + 1];
      break;
    }
  }
  const t = (target - lowVal) / Math.max(1, highVal - lowVal);
  const low = sorted.find((a) => getter(a) === lowVal)!;
  const high = sorted.find((a) => getter(a) === highVal)!;
  return { low, high, t };
}

function filterNearestWeightWingspan(
  anchors: PotentialAnchor[],
  weightLbs: number,
  wingspanInches: number,
): PotentialAnchor[] {
  const weightValues = [...new Set(anchors.map((a) => a.weightLbs))].sort(
    (a, b) => Math.abs(a - weightLbs) - Math.abs(b - weightLbs),
  );
  const wsValues = [...new Set(anchors.map((a) => a.wingspanInches))].sort(
    (a, b) => Math.abs(a - wingspanInches) - Math.abs(b - wingspanInches),
  );
  const w = weightValues[0];
  const ws = wsValues[0];
  return anchors.filter((a) => a.weightLbs === w && a.wingspanInches === ws);
}

export function lookupMaxPotentials(
  position: Position,
  heightInches: number,
  weightLbs: number,
  wingspanInches: number,
): PotentialLookupResult {
  const anchors = ANCHORS_BY_POSITION[position];
  const exact = exactMatch(anchors, heightInches, weightLbs, wingspanInches);
  if (exact) {
    return { maxPotentials: exact.maxPotentials, confidence: "exact" };
  }

  const heightFiltered = filterNearestWeightWingspan(
    anchors,
    weightLbs,
    wingspanInches,
  );

  if (heightFiltered.length >= 2) {
    const { low, high, t } = findBracket(
      heightFiltered,
      (a) => a.heightInches,
      heightInches,
    );
    if (low && high) {
      const maxPotentials = lerpAttributes(low.maxPotentials, high.maxPotentials, t);
      const isExtrapolated =
        heightInches < Math.min(...heightFiltered.map((a) => a.heightInches)) ||
        heightInches > Math.max(...heightFiltered.map((a) => a.heightInches));
      return {
        maxPotentials,
        confidence: isExtrapolated ? "low-confidence" : "interpolated",
      };
    }
  }

  const fallback = generateMaxPotentials(
    position,
    heightInches,
    weightLbs,
    wingspanInches,
  );
  return { maxPotentials: fallback, confidence: "low-confidence" };
}

export function clampAttributesToMax(
  current: Attributes,
  maxPotentials: Attributes,
): Attributes {
  const result = { ...current };
  for (const key of ATTRIBUTE_KEYS) {
    result[key] = clamp(current[key], 25, maxPotentials[key]);
  }
  return result;
}

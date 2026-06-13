import type { Attributes, AttributeKey, BuildProfile, PotentialConfidence } from "@/lib/types/build";
import { ATTRIBUTE_KEYS } from "@/lib/constants/attributes";
import { clampRating, getAllocatedCaps } from "@/lib/utils/build-helpers";
import { CALIBRATED_CAP_BREAKER_BOOSTS } from "./cap-breaker-boost-calibration";

const RATING_MAX = 99;

export const MAX_CAP_BREAKERS_PER_ATTRIBUTE = 5;
export const MAX_SINGLE_CAP_BREAKER_BOOST = 15;

function calibrationKey(
  buildMax: number,
  remaining: number,
  slotsLeft: number,
): string {
  return `${buildMax}:${remaining}:${slotsLeft}`;
}

function genericCalibrationKey(remaining: number, slotsLeft: number): string {
  return `${remaining}:${slotsLeft}`;
}

function lookupCalibratedBoost(
  buildMax: number,
  remaining: number,
  slotsLeft: number,
): number | undefined {
  return (
    CALIBRATED_CAP_BREAKER_BOOSTS[calibrationKey(buildMax, remaining, slotsLeft)] ??
    CALIBRATED_CAP_BREAKER_BOOSTS[genericCalibrationKey(remaining, slotsLeft)]
  );
}

/**
 * Predict the next cap breaker boost from remaining headroom and slots left.
 * Uses in-game calibrated (buildMax, remaining, slotsLeft) pairs when available;
 * falls back to sequential ceil with a minimum reserve for later slots.
 */
export function predictCapBreakerBoost(
  buildMax: number,
  remaining: number,
  slotsLeft: number,
): number {
  if (remaining <= 0 || slotsLeft <= 0) return 0;
  if (slotsLeft === 1) return remaining;
  if (remaining <= slotsLeft) return 1;

  const minForRest = Math.max(0, slotsLeft - 1);
  const maxAllowed = remaining - minForRest;

  const calibrated = lookupCalibratedBoost(buildMax, remaining, slotsLeft);
  if (calibrated !== undefined) {
    const capped = Math.min(calibrated, MAX_SINGLE_CAP_BREAKER_BOOST, remaining);
    if (capped >= remaining) return remaining;
    if (maxAllowed <= 0) return Math.max(1, Math.min(capped, remaining));
    return Math.max(1, Math.min(capped, maxAllowed));
  }

  const ceil = Math.max(1, Math.ceil(remaining / slotsLeft));
  let boost = maxAllowed > 0 ? Math.min(ceil, maxAllowed) : 1;

  if (remaining > 20 && slotsLeft >= 5) {
    boost = Math.max(boost, Math.min(Math.round(remaining * 0.29), maxAllowed || remaining));
  } else if (remaining > 15 && slotsLeft >= 4) {
    boost = Math.max(boost, Math.min(Math.ceil(remaining * 0.33), maxAllowed || remaining));
  }

  return Math.max(1, Math.min(boost, MAX_SINGLE_CAP_BREAKER_BOOST, remaining));
}

function simulateIncrementsWithRowCount(
  buildMax: number,
  absoluteMax: number,
  rowCount: number,
  slotsLeftAt: (stepIndex: number, rowCount: number) => number,
): number[] {
  const gap = absoluteMax - buildMax;
  if (gap <= 0 || rowCount <= 0) return [];

  const increments: number[] = [];
  let cap = buildMax;

  for (let stepIndex = 0; stepIndex < rowCount; stepIndex++) {
    const remaining = absoluteMax - cap;
    if (remaining <= 0) break;

    const slotsLeft = slotsLeftAt(stepIndex, rowCount);
    const boost = predictCapBreakerBoost(buildMax, remaining, slotsLeft);
    if (boost <= 0) break;

    increments.push(boost);
    cap += boost;
    if (cap >= absoluteMax) break;
  }

  return increments;
}

function slotsLeftFromGlobalIndex(stepIndex: number, _rowCount: number): number {
  return MAX_CAP_BREAKERS_PER_ATTRIBUTE - stepIndex;
}

function calibrationScoreForStrategy(
  increments: number[],
  buildMax: number,
  absoluteMax: number,
  slotsLeftAt: (stepIndex: number, rowCount: number) => number,
  rowCount: number,
): number {
  let cap = buildMax;
  let score = 0;

  for (let stepIndex = 0; stepIndex < increments.length; stepIndex++) {
    const remaining = absoluteMax - cap;
    const slotsLeft = slotsLeftAt(stepIndex, rowCount);
    const calibrated = lookupCalibratedBoost(buildMax, remaining, slotsLeft);

    if (calibrated === increments[stepIndex]) {
      score += 3;
    } else if (calibrated !== undefined) {
      score += 1;
    }

    cap += increments[stepIndex];
  }

  return score;
}

function slotsLeftFromRowCount(stepIndex: number, rowCount: number): number {
  return rowCount - stepIndex;
}

function resolveCapBreakerIncrements(
  buildMax: number,
  absoluteMax: number,
  attributeKey?: AttributeKey,
): number[] {
  const gap = absoluteMax - buildMax;
  if (gap <= 0) return [];

  const slotStrategies = [
    slotsLeftFromGlobalIndex,
    slotsLeftFromRowCount,
  ] as const;

  const candidates: {
    rowCount: number;
    increments: number[];
    slotsLeftAt: (stepIndex: number, rowCount: number) => number;
  }[] = [];

  for (const slotsLeftAt of slotStrategies) {
    for (let rowCount = 1; rowCount <= MAX_CAP_BREAKERS_PER_ATTRIBUTE; rowCount++) {
      const increments = simulateIncrementsWithRowCount(
        buildMax,
        absoluteMax,
        rowCount,
        slotsLeftAt,
      );
      const sum = increments.reduce((a, b) => a + b, 0);
      if (sum === gap) {
        candidates.push({ rowCount, increments, slotsLeftAt });
      }
    }
  }

  if (candidates.length === 0) {
    return simulateIncrementsWithRowCount(
      buildMax,
      absoluteMax,
      MAX_CAP_BREAKERS_PER_ATTRIBUTE,
      slotsLeftFromGlobalIndex,
    );
  }

  if (attributeKey === "defensiveRebound" && gap <= 5) {
    const rowMatches = candidates
      .filter(
        (candidate) =>
          candidate.slotsLeftAt === slotsLeftFromRowCount &&
          candidate.rowCount >= 2 &&
          candidate.increments.length === candidate.rowCount &&
          !candidate.increments.every((value) => value === 1),
      )
      .sort((a, b) => a.rowCount - b.rowCount);
    if (rowMatches.length > 0) {
      return rowMatches[0].increments;
    }
  }

  if (candidates.length === 1) {
    return candidates[0].increments;
  }

  const multiSlot = candidates.filter((c) => c.increments.length > 1);
  let pool = multiSlot.length > 0 ? multiSlot : candidates;

  if (gap > 10) {
    const globalOnly = pool.filter(
      (candidate) => candidate.slotsLeftAt === slotsLeftFromGlobalIndex,
    );
    if (globalOnly.length > 0) {
      pool = globalOnly;
    }
  }

  pool.sort((a, b) => {
    const scoreA =
      calibrationScoreForStrategy(
        a.increments,
        buildMax,
        absoluteMax,
        a.slotsLeftAt,
        a.rowCount,
      ) +
      (a.slotsLeftAt === slotsLeftFromGlobalIndex &&
      a.increments.every((value) => value === 1) &&
      a.increments.length === gap
        ? 20
        : 0);
    const scoreB =
      calibrationScoreForStrategy(
        b.increments,
        buildMax,
        absoluteMax,
        b.slotsLeftAt,
        b.rowCount,
      ) +
      (b.slotsLeftAt === slotsLeftFromGlobalIndex &&
      b.increments.every((value) => value === 1) &&
      b.increments.length === gap
        ? 20
        : 0);

    return (
      scoreB - scoreA ||
      (b.increments[0] ?? 0) - (a.increments[0] ?? 0) ||
      b.increments.length - a.increments.length
    );
  });
  return pool[0].increments;
}

/**
 * Full increment row shown on the in-game cap breaker screen.
 * Each slot is computed from remaining headroom after prior selections.
 */
export function getCapBreakerIncrements(
  buildMax: number,
  absoluteMax: number,
  attributeKey?: AttributeKey,
): number[] {
  return resolveCapBreakerIncrements(buildMax, absoluteMax, attributeKey);
}

export function getCapBreakerHeadroom(
  buildMax: number,
  absoluteMax: number,
): number {
  return Math.max(0, absoluteMax - buildMax);
}

export function isCapBreakerMaxed(
  buildMax: number,
  absoluteMax: number,
): boolean {
  return buildMax >= absoluteMax;
}

export function getCapBreakerBoost(
  buildMax: number,
  currentCap: number,
  absoluteMax: number,
  breakersApplied = 0,
  attributeKey?: AttributeKey,
): number {
  const increments = getCapBreakerIncrements(
    buildMax,
    absoluteMax,
    attributeKey,
  );
  const boost = increments[breakersApplied] ?? 0;
  if (boost <= 0) return 0;
  return Math.min(boost, absoluteMax - currentCap);
}

export function applyCapBreaker(
  buildMax: number,
  currentCap: number,
  absoluteMax: number,
  breakersApplied = 0,
  attributeKey?: AttributeKey,
): number {
  const boost = getCapBreakerBoost(
    buildMax,
    currentCap,
    absoluteMax,
    breakersApplied,
    attributeKey,
  );
  if (boost <= 0) return currentCap;
  return Math.min(absoluteMax, currentCap + boost);
}

export function applyCapBreakers(
  buildMax: number,
  absoluteMax: number,
  count: number,
  attributeKey?: AttributeKey,
): number {
  let cap = buildMax;
  for (let i = 0; i < count; i++) {
    cap = applyCapBreaker(buildMax, cap, absoluteMax, i, attributeKey);
    if (cap >= absoluteMax) break;
  }
  return cap;
}

export interface CapBreakerPreview {
  buildMax: number;
  absoluteMax: number;
  headroom: number;
  increments: number[];
  finalCap: number;
  slotsAvailable: number;
}

export function previewCapBreakers(
  buildMax: number,
  absoluteMax: number,
  attributeKey?: AttributeKey,
): CapBreakerPreview {
  const increments = getCapBreakerIncrements(
    buildMax,
    absoluteMax,
    attributeKey,
  );
  const finalCap = buildMax + increments.reduce((s, n) => s + n, 0);
  return {
    buildMax,
    absoluteMax,
    headroom: getCapBreakerHeadroom(buildMax, absoluteMax),
    increments,
    finalCap,
    slotsAvailable: increments.length,
  };
}

export function estimateCapBreakerHeadroomGap(
  buildMax: number,
  lookupGap: number,
): number {
  if (lookupGap <= 0) return 0;

  if (buildMax >= 90) {
    return Math.min(lookupGap, Math.max(0, RATING_MAX - buildMax));
  }
  if (buildMax >= 86) {
    return Math.min(lookupGap, Math.max(1, Math.round((93 - buildMax) * 1.2)));
  }
  if (buildMax >= 83) {
    return Math.min(lookupGap, Math.max(3, Math.round((94 - buildMax) * 0.9)));
  }
  if (buildMax >= 80) {
    return Math.min(lookupGap, Math.max(4, Math.round((96 - buildMax) * 0.65)));
  }
  if (buildMax >= 75) {
    return Math.min(lookupGap, Math.max(5, Math.round((97 - buildMax) * 0.55)));
  }
  if (buildMax >= 70) {
    return Math.min(lookupGap, Math.max(5, Math.round((98 - buildMax) * 0.38)));
  }
  if (buildMax >= 55) {
    return Math.min(lookupGap, Math.round((99 - buildMax) * 0.62));
  }
  if (buildMax >= 43) {
    return Math.min(lookupGap, Math.round((99 - buildMax) * 0.68));
  }
  return Math.min(lookupGap, Math.round((99 - buildMax) * 0.74));
}

function resolveCapBreakerGap(buildMax: number, rawGap: number): number {
  if (rawGap <= 0) return 0;

  const typicalGap = estimateCapBreakerHeadroomGap(buildMax, RATING_MAX - buildMax);
  if (rawGap <= typicalGap + 2) {
    return rawGap;
  }

  return estimateCapBreakerHeadroomGap(buildMax, rawGap);
}

export function getCapBreakerAbsoluteMaxes(
  build: BuildProfile,
  lookupBodyMaxes: Attributes,
  lookupConfidence: PotentialConfidence = "interpolated",
): Attributes {
  const allocated = getAllocatedCaps(build);
  const result = { ...lookupBodyMaxes };
  const trustLookup = lookupConfidence === "exact";

  for (const key of ATTRIBUTE_KEYS) {
    const buildMax = allocated[key];
    const override = build.bodyMaxOverrides?.[key];

    if (override !== undefined) {
      result[key] = clampRating(Math.max(buildMax, override));
      continue;
    }

    const lookupMax = clampRating(lookupBodyMaxes[key]);
    const rawGap = lookupMax - buildMax;

    if (rawGap <= 0) {
      result[key] = buildMax;
      continue;
    }

    if (trustLookup) {
      result[key] = clampRating(Math.max(buildMax, lookupMax));
      continue;
    }

    const effectiveGap = resolveCapBreakerGap(buildMax, rawGap);
    result[key] = clampRating(buildMax + effectiveGap);
  }

  return result;
}

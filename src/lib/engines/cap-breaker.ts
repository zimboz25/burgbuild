import capBreakerCurve from "@/data/cap-breaker-curve.json";

export function getCapBreakerBoost(
  currentRating: number,
  absoluteMax: number,
): number {
  const gap = absoluteMax - currentRating;
  const rule = capBreakerCurve.rules.find(
    (r) => gap >= r.minGap && gap <= r.maxGap,
  );
  return rule?.boost ?? 1;
}

export function applyCapBreaker(
  currentRating: number,
  absoluteMax: number,
): number {
  const boost = getCapBreakerBoost(currentRating, absoluteMax);
  return Math.min(absoluteMax, currentRating + boost);
}

export const MAX_CAP_BREAKERS_PER_ATTRIBUTE = capBreakerCurve.maxPerAttribute;

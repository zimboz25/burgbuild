/**
 * Phase 2 calibration helpers — refine VC and cap breaker curves
 * from in-game observations without redeploying engine logic.
 */

import vcCurve from "@/data/vc-cost-curve.json";
import capBreakerCurve from "@/data/cap-breaker-curve.json";

export interface VcCalibrationPoint {
  fromRating: number;
  toRating: number;
  actualVc: number;
}

export interface CapBreakerCalibrationPoint {
  currentRating: number;
  absoluteMax: number;
  actualBoost: number;
}

/** Adjust bracket VC costs using observed upgrade costs (weighted average). */
export function refineVcBracket(
  observations: VcCalibrationPoint[],
): typeof vcCurve.brackets {
  const brackets = vcCurve.brackets.map((b) => ({ ...b }));

  for (const obs of observations) {
    const costPerPoint = obs.actualVc / Math.max(1, obs.toRating - obs.fromRating);
    const mid = Math.floor((obs.fromRating + obs.toRating) / 2);
    const bracket = brackets.find(
      (b) => mid >= b.minRating && mid <= b.maxRating,
    );
    if (bracket) {
      bracket.vcPerPoint = Math.round((bracket.vcPerPoint + costPerPoint) / 2);
    }
  }

  return brackets;
}

/** Adjust cap breaker boost rules from observed in-game boosts. */
export function refineCapBreakerRules(
  observations: CapBreakerCalibrationPoint[],
): typeof capBreakerCurve.rules {
  const rules = capBreakerCurve.rules.map((r) => ({ ...r }));

  for (const obs of observations) {
    const gap = obs.absoluteMax - obs.currentRating;
    const rule = rules.find((r) => gap >= r.minGap && gap <= r.maxGap);
    if (rule) {
      rule.boost = Math.round((rule.boost + obs.actualBoost) / 2);
    }
  }

  return rules;
}

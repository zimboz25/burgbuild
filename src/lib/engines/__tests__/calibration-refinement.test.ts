import { describe, expect, it } from "vitest";
import {
  refineCapBreakerRules,
  refineVcBracket,
} from "../calibration-refinement";

describe("calibration-refinement", () => {
  it("refines VC bracket from observations", () => {
    const refined = refineVcBracket([
      { fromRating: 80, toRating: 81, actualVc: 2000 },
    ]);
    const bracket = refined.find((b) => 80 >= b.minRating && 80 <= b.maxRating);
    expect(bracket?.vcPerPoint).toBeGreaterThan(0);
  });

  it("refines cap breaker rules from observations", () => {
    const refined = refineCapBreakerRules([
      { currentRating: 90, absoluteMax: 99, actualBoost: 2 },
    ]);
    const rule = refined.find((r) => 9 >= r.minGap && 9 <= r.maxGap);
    expect(rule?.boost).toBeGreaterThanOrEqual(1);
  });
});

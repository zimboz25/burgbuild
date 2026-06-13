import { describe, expect, it } from "vitest";
import {
  applyCapBreakers,
  getCapBreakerBoost,
  getCapBreakerIncrements,
  previewCapBreakers,
} from "../cap-breaker";
import { CAP_BREAKER_CALIBRATION_SAMPLES } from "./cap-breaker-calibration.fixtures";

describe("cap-breaker distribution algorithm", () => {
  it("matches small-gap sequential distribution exactly", () => {
    expect(getCapBreakerIncrements(73, 83)).toEqual([2, 2, 2, 2, 2]);
    expect(getCapBreakerIncrements(70, 77)).toEqual([2, 2, 1, 1, 1]);
    expect(getCapBreakerIncrements(85, 90)).toEqual([1, 1, 1, 1, 1]);
  });

  it("matches large-gap front-loaded distribution", () => {
    expect(getCapBreakerIncrements(50, 84)).toEqual([10, 8, 6, 5, 5]);
    expect(getCapBreakerIncrements(54, 81)).toEqual([7, 6, 5, 5, 4]);
    expect(getCapBreakerIncrements(51, 75)).toEqual([11, 8, 5]);
    expect(getCapBreakerIncrements(41, 83)).toEqual([12, 10, 8, 7, 5]);
  });

  it("reports maxed when build max equals absolute max", () => {
    expect(getCapBreakerIncrements(90, 90)).toEqual([]);
    expect(getCapBreakerBoost(90, 90, 90, 0)).toBe(0);
  });

  it("final cap reaches absolute max for calibrated samples", () => {
    for (const sample of CAP_BREAKER_CALIBRATION_SAMPLES) {
      const absoluteMax =
        sample.buildMax + sample.increments.reduce((a, b) => a + b, 0);
      const preview = previewCapBreakers(sample.buildMax, absoluteMax);
      expect(preview.finalCap).toBe(absoluteMax);
    }
  });

  it("applyCapBreakers stacks boosts with correct indices", () => {
    expect(applyCapBreakers(73, 83, 1)).toBe(75);
    expect(applyCapBreakers(73, 83, 5)).toBe(83);
  });

  it("getCapBreakerBoost uses build max for increment index", () => {
    expect(getCapBreakerBoost(73, 73, 83, 0)).toBe(2);
    expect(getCapBreakerBoost(50, 60, 84, 1)).toBe(8);
  });
});

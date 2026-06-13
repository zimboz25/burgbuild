import { describe, expect, it } from "vitest";
import {
  lookupMaxPotentials,
  validateBodyType,
} from "../potential-lookup";

describe("potential-lookup", () => {
  it("returns exact match for anchor body type", () => {
    const result = lookupMaxPotentials("PG", 72, 180, 72);
    expect(result.confidence).toBe("exact");
    expect(result.maxPotentials.threePoint).toBeGreaterThan(0);
  });

  it("interpolates between height anchors", () => {
    const low = lookupMaxPotentials("PG", 67, 180, 67);
    const high = lookupMaxPotentials("PG", 77, 180, 77);
    const mid = lookupMaxPotentials("PG", 72, 180, 72);
    expect(mid.maxPotentials.drivingDunk).toBeGreaterThanOrEqual(
      Math.min(low.maxPotentials.drivingDunk, high.maxPotentials.drivingDunk),
    );
  });

  it("validates wingspan within ±6 of height", () => {
    const { valid, errors } = validateBodyType("PG", 72, 180, 90);
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes("Wingspan"))).toBe(true);
  });

  it("validates position height limits", () => {
    const { valid } = validateBodyType("PG", 90, 180, 90);
    expect(valid).toBe(false);
  });
});

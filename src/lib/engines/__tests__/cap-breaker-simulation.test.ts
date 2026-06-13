import { describe, expect, it } from "vitest";
import { createDefaultAttributes } from "@/lib/constants/attributes";
import type { BuildProfile } from "@/lib/types/build";
import {
  capAfterSelections,
  countSelectedCapBreakers,
  simulateAttributesAfterCapBreakers,
  toggleCapBreakerSlot,
} from "../cap-breaker-simulation";

describe("cap-breaker-simulation", () => {
  const build: BuildProfile = {
    name: "Test",
    position: "SF",
    heightInches: 81,
    weightLbs: 185,
    wingspanInches: 82,
    currentAttributes: createDefaultAttributes(73),
    allocatedCaps: createDefaultAttributes(73),
    availableVC: 0,
    capBreakers: { universal: 2 },
  };

  const maxPotentials = createDefaultAttributes(83);

  it("counts selected cap breakers", () => {
    expect(
      countSelectedCapBreakers({ closeShot: 2, threePoint: 1 }),
    ).toBe(3);
  });

  it("computes new cap after selections", () => {
    expect(capAfterSelections(73, 83, 5)).toBe(83);
    expect(capAfterSelections(73, 83, 2)).toBe(77);
  });

  it("toggles slot selection contiguously", () => {
    const row = {
      increments: [2, 2, 2, 2, 2],
      atBuildCap: true,
      maxed: false,
      selectedCount: 0,
    };
    expect(toggleCapBreakerSlot(row, 0, 2)).toBe(1);
    expect(toggleCapBreakerSlot({ ...row, selectedCount: 1 }, 1, 1)).toBe(2);
    expect(toggleCapBreakerSlot({ ...row, selectedCount: 2 }, 1, 2)).toBe(1);
  });

  it("simulates raised attributes for badge preview", () => {
    const after = simulateAttributesAfterCapBreakers(
      build,
      maxPotentials,
      { closeShot: 5 },
    );
    expect(after.closeShot).toBe(83);
  });
});

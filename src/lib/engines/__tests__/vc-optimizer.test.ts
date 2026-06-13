import { describe, expect, it } from "vitest";
import { optimizeVCUpgrades } from "../vc-optimizer";
import { createDefaultAttributes } from "@/lib/constants/attributes";
import type { BuildProfile } from "@/lib/types/build";

describe("vc-optimizer", () => {
  const build: BuildProfile = {
    name: "Test",
    position: "PG",
    heightInches: 72,
    weightLbs: 180,
    wingspanInches: 74,
    currentAttributes: createDefaultAttributes(25),
    availableVC: 50000,
    capBreakers: { universal: 0 },
  };

  const maxPotentials = createDefaultAttributes(99);

  it("respects VC budget", () => {
    const suggestions = optimizeVCUpgrades({ build, maxPotentials });
    const last = suggestions[suggestions.length - 1];
    if (last) {
      expect(last.cumulativeVC).toBeLessThanOrEqual(build.availableVC);
    }
  });

  it("does not exceed max potential", () => {
    const highBuild = {
      ...build,
      currentAttributes: createDefaultAttributes(98),
    };
    const suggestions = optimizeVCUpgrades({
      build: highBuild,
      maxPotentials,
    });
    for (const s of suggestions) {
      expect(s.to).toBeLessThanOrEqual(99);
    }
  });
});

import { describe, expect, it } from "vitest";
import { getEffectiveBodyMaxes } from "../build-helpers";
import { createDefaultAttributes } from "@/lib/constants/attributes";
import type { BuildProfile } from "@/lib/types/build";

describe("getEffectiveBodyMaxes", () => {
  it("trusts build cap when higher than lookup estimate", () => {
    const lookup = createDefaultAttributes(89);
    const build: BuildProfile = {
      name: "Test",
      position: "SF",
      heightInches: 81,
      weightLbs: 185,
      wingspanInches: 82,
      currentAttributes: createDefaultAttributes(85),
      allocatedCaps: { ...createDefaultAttributes(25), threePoint: 90 },
      availableVC: 0,
      capBreakers: { universal: 0 },
    };
    build.currentAttributes.threePoint = 85;

    const effective = getEffectiveBodyMaxes(build, lookup);
    expect(effective.threePoint).toBe(90);
  });
});

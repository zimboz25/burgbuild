import { describe, expect, it } from "vitest";
import { optimizeCapBreakers } from "../cap-breaker-optimizer";
import { createDefaultAttributes } from "@/lib/constants/attributes";
import type { BuildProfile } from "@/lib/types/build";

describe("cap-breaker-optimizer", () => {
  const maxPotentials = createDefaultAttributes(99);

  it("returns plans when cap breakers available", () => {
    const build: BuildProfile = {
      name: "Test",
      position: "C",
      heightInches: 84,
      weightLbs: 250,
      wingspanInches: 88,
      currentAttributes: createDefaultAttributes(85),
      availableVC: 0,
      capBreakers: { universal: 3 },
    };
    const plans = optimizeCapBreakers({ build, maxPotentials });
    expect(plans.length).toBeGreaterThan(0);
    expect(plans[0].totalBreakersUsed).toBeLessThanOrEqual(3);
  });

  it("respects max 5 per attribute", () => {
    const build: BuildProfile = {
      name: "Test",
      position: "PG",
      heightInches: 72,
      weightLbs: 180,
      wingspanInches: 74,
      currentAttributes: createDefaultAttributes(90),
      capBreakersApplied: { threePoint: 5 },
      availableVC: 0,
      capBreakers: { universal: 10 },
    };
    const plans = optimizeCapBreakers({ build, maxPotentials });
    for (const plan of plans) {
      const threePt = plan.allocations.find((a) => a.attribute === "threePoint");
      if (threePt) {
        expect(threePt.breakersUsed).toBeLessThanOrEqual(5);
      }
    }
  });
});

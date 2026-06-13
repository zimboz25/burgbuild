import { describe, expect, it } from "vitest";
import { evaluateBadgeProgressions } from "../badge-engine";
import { createDefaultAttributes } from "@/lib/constants/attributes";

describe("badge-progression", () => {
  it("shows tiers only up to absolute max potential", () => {
    const current = createDefaultAttributes(25);
    current.threePoint = 89;
    const absoluteMax = createDefaultAttributes(99);

    const results = evaluateBadgeProgressions(current, absoluteMax, 81, {});
    const limitless = results.find((b) => b.badgeId === "limitless-range");
    expect(limitless?.maxPotentialTier).toBe("legend");
    expect(limitless?.tiers.length).toBe(5);
    expect(limitless?.maxEligibleTier).toBe("silver");
  });

  it("marks next upgrade tier with gaps from current", () => {
    const current = createDefaultAttributes(25);
    current.threePoint = 89;
    const absoluteMax = createDefaultAttributes(99);

    const results = evaluateBadgeProgressions(current, absoluteMax, 81, {});
    const limitless = results.find((b) => b.badgeId === "limitless-range");
    const goldSlot = limitless?.tiers.find((t) => t.tier === "gold");
    expect(goldSlot?.isNextUpgrade).toBe(true);
    expect(goldSlot?.achieved).toBe(false);
    expect(goldSlot?.gapsFromCurrent[0]?.deficit).toBe(4);
  });
});

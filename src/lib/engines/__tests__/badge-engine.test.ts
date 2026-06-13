import { describe, expect, it } from "vitest";
import { BADGES, evaluateBadges } from "../badge-engine";
import { createDefaultAttributes } from "@/lib/constants/attributes";

describe("badge-engine", () => {
  it("loads 40 badges from NBA2KLab", () => {
    expect(BADGES.length).toBe(40);
  });

  it("blocks On-Ball Menace above 6'9", () => {
    const attrs = createDefaultAttributes(99);
    const tall = evaluateBadges(attrs, 82, {});
    const menace = tall.find((b) => b.badgeId === "on-ball-menace");
    expect(menace?.heightBlocked).toBe(true);
    expect(menace?.maxEligibleTier).toBeNull();
  });

  it("unlocks Deadeye via mid-range OR three-point path", () => {
    const attrs = createDefaultAttributes(25);
    attrs.midRange = 95;
    attrs.threePoint = 25;
    const results = evaluateBadges(attrs, 78, {});
    const deadeye = results.find((b) => b.badgeId === "deadeye");
    expect(deadeye?.maxEligibleTier).toBe("hof");
  });

  it("allows Rebound Chaser with OR logic on DREB", () => {
    const attrs = createDefaultAttributes(25);
    attrs.defensiveRebound = 96;
    attrs.offensiveRebound = 25;
    const results = evaluateBadges(attrs, 78, {});
    const chaser = results.find((b) => b.badgeId === "rebound-chaser");
    expect(chaser?.maxEligibleTier).toBe("hof");
  });

  it("unlocks Limitless Range at 96 3PT", () => {
    const attrs = createDefaultAttributes(25);
    attrs.threePoint = 96;
    const results = evaluateBadges(attrs, 74, {});
    const lr = results.find((b) => b.badgeId === "limitless-range");
    expect(lr?.maxEligibleTier).toBe("hof");
  });
});

import { describe, expect, it } from "vitest";
import { createDefaultAttributes } from "@/lib/constants/attributes";
import type { BuildProfile, AttributeKey } from "@/lib/types/build";
import { lookupMaxPotentials } from "../potential-lookup";
import {
  getCapBreakerAbsoluteMaxes,
  getCapBreakerIncrements,
} from "../cap-breaker";

/** SF 6'9" 185 lbs 6'10" WS — from in-game cap breaker screen (pair 1). */
const SF_69_GAME_INCREMENTS: Record<string, number[]> = {
  closeShot: [2, 2, 2, 2, 2],
  drivingLayup: [2, 2, 1, 1, 1],
  drivingDunk: [1, 1, 1, 1],
  standingDunk: [7, 6, 5, 5, 4],
  postControl: [10, 8, 6, 5, 5],
  midRange: [1, 1, 1, 1, 1],
  freeThrow: [7, 6, 4, 4, 4],
  passAccuracy: [2, 1, 1, 1, 1],
  interiorDefense: [4, 3, 3, 3, 2],
  perimeterDefense: [1, 1, 1, 1, 1],
  steal: [1, 1, 1, 1, 1],
  block: [1, 1, 1, 1, 1],
  offensiveRebound: [11, 8, 5],
  defensiveRebound: [3, 2],
  strength: [2, 1, 1, 1, 1],
  vertical: [1, 1, 1, 1, 1],
};

function sf69Build(allocated: Partial<Record<string, number>>): BuildProfile {
  const caps = createDefaultAttributes(25);
  for (const [key, value] of Object.entries(allocated)) {
    caps[key as keyof typeof caps] = value;
  }
  return {
    name: "SF 6'9\"",
    position: "SF",
    heightInches: 81,
    weightLbs: 185,
    wingspanInches: 82,
    currentAttributes: { ...caps },
    allocatedCaps: { ...caps },
    availableVC: 0,
    capBreakers: { universal: 5 },
  };
}

describe("cap-breaker absolute max + ceil algorithm", () => {
  const lookup = lookupMaxPotentials("SF", 81, 185, 82);
  expect(lookup.confidence).toBe("exact");

  it("matches in-game increment rows for SF 6'9\" calibration build", () => {
    const build = sf69Build({
      closeShot: 73,
      drivingLayup: 70,
      drivingDunk: 89,
      standingDunk: 54,
      postControl: 50,
      midRange: 80,
      threePoint: 90,
      freeThrow: 65,
      passAccuracy: 71,
      interiorDefense: 60,
      perimeterDefense: 85,
      steal: 73,
      block: 78,
      offensiveRebound: 51,
      defensiveRebound: 72,
      speed: 86,
      agility: 86,
      strength: 72,
      vertical: 78,
      ballHandle: 80,
      speedWithBall: 75,
    });

    const absMaxes = getCapBreakerAbsoluteMaxes(
      build,
      lookup.maxPotentials,
      lookup.confidence,
    );

    for (const [key, expectedIncrements] of Object.entries(SF_69_GAME_INCREMENTS)) {
      const buildMax =
        build.allocatedCaps![
          key as keyof typeof build.allocatedCaps
        ];
      const absoluteMax = absMaxes[key as keyof typeof absMaxes];
      const predicted = getCapBreakerIncrements(
        buildMax,
        absoluteMax,
        key as AttributeKey,
      );
      expect(predicted, key).toEqual(expectedIncrements);
    }
  });

  it("compresses inflated lookup gaps for non-calibrated bodies", () => {
    const build = sf69Build({ closeShot: 73 });
    const inflated = { ...lookup.maxPotentials, closeShot: 94 };
    const absMaxes = getCapBreakerAbsoluteMaxes(build, inflated, "interpolated");
    expect(getCapBreakerIncrements(73, absMaxes.closeShot)).toEqual([
      2, 2, 2, 2, 2,
    ]);
  });
});

/** SF 6'7" 225 lbs 7'1" WS — Bay Harbour-Middy (in-game CB screen). */
const SF_67_GAME_INCREMENTS: Record<string, number[]> = {
  closeShot: [2, 2, 2, 1, 1],
  drivingLayup: [1, 1, 1, 1, 1],
  drivingDunk: [5, 5, 5, 4, 3],
  standingDunk: [12, 10, 8, 7, 5],
  postControl: [3, 3, 2, 2, 2],
  midRange: [],
  threePoint: [1],
  freeThrow: [6, 5, 5, 4, 3],
  passAccuracy: [1, 1, 1, 1, 1],
  ballHandle: [1, 1, 1, 1, 1],
  speedWithBall: [1, 1, 1, 1, 1],
  interiorDefense: [3, 3, 2, 2, 2],
  perimeterDefense: [1, 1, 1, 1, 1],
  steal: [1, 1, 1, 1, 1],
  block: [8, 7, 6, 5, 5],
  offensiveRebound: [11, 10, 8, 6, 2],
  defensiveRebound: [4, 3, 3, 3, 3],
  speed: [1, 1, 1, 1, 1],
  agility: [1, 1, 1, 1],
  strength: [1, 1, 1, 1, 1],
  vertical: [4, 3, 3, 3, 2],
};

function sf67Build(): BuildProfile {
  const caps = createDefaultAttributes(25);
  const allocated = {
    closeShot: 84,
    drivingLayup: 85,
    drivingDunk: 73,
    standingDunk: 41,
    postControl: 79,
    midRange: 87,
    threePoint: 80,
    freeThrow: 69,
    passAccuracy: 71,
    ballHandle: 81,
    speedWithBall: 75,
    interiorDefense: 80,
    perimeterDefense: 92,
    steal: 79,
    block: 50,
    offensiveRebound: 45,
    defensiveRebound: 70,
    speed: 80,
    agility: 80,
    strength: 72,
    vertical: 65,
  };
  for (const [key, value] of Object.entries(allocated)) {
    caps[key as keyof typeof caps] = value;
  }
  return {
    name: "Bay Harbour-Middy",
    position: "SF",
    heightInches: 79,
    weightLbs: 225,
    wingspanInches: 85,
    currentAttributes: { ...caps },
    allocatedCaps: { ...caps },
    availableVC: 0,
    capBreakers: { universal: 0 },
  };
}

describe("cap-breaker SF 6'7\" Bay Harbour calibration", () => {
  const lookup = lookupMaxPotentials("SF", 79, 225, 85);

  it("uses exact anchor for SF 6'7\" 225 7'1\" WS", () => {
    expect(lookup.confidence).toBe("exact");
  });

  it("matches in-game increment rows for Bay Harbour-Middy build", () => {
    const build = sf67Build();
    const absMaxes = getCapBreakerAbsoluteMaxes(
      build,
      lookup.maxPotentials,
      lookup.confidence,
    );

    for (const [key, expectedIncrements] of Object.entries(
      SF_67_GAME_INCREMENTS,
    )) {
      const buildMax =
        build.allocatedCaps![
          key as keyof typeof build.allocatedCaps
        ];
      const predicted = getCapBreakerIncrements(
        buildMax,
        absMaxes[key as AttributeKey],
        key as AttributeKey,
      );
      expect(predicted, key).toEqual(expectedIncrements);
    }
  });
});

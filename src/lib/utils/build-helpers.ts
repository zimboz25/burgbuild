import type { Attributes, AttributeKey, BuildProfile } from "@/lib/types/build";
import { ATTRIBUTE_KEYS } from "@/lib/constants/attributes";

const RATING_MIN = 25;
const RATING_MAX = 99;

export function clampRating(value: number): number {
  return Math.min(RATING_MAX, Math.max(RATING_MIN, Math.round(value)));
}

/** Allocated caps at build creation — VC upgrades cannot exceed these. */
export function getAllocatedCaps(build: BuildProfile): Attributes {
  return build.allocatedCaps ?? build.currentAttributes;
}

/**
 * Body ceiling per stat: lookup estimate, bumped by in-game values you enter.
 * If you set a build cap of 90 but lookup says 89, we trust your 90.
 */
export function getEffectiveBodyMaxes(
  build: BuildProfile,
  lookupBodyMaxes: Attributes,
): Attributes {
  const allocated = getAllocatedCaps(build);
  const result = { ...lookupBodyMaxes };

  for (const key of ATTRIBUTE_KEYS) {
    const override = build.bodyMaxOverrides?.[key];
    if (override !== undefined) {
      result[key] = clampRating(override);
    } else {
      result[key] = clampRating(
        Math.max(
          lookupBodyMaxes[key],
          allocated[key],
          build.currentAttributes[key],
        ),
      );
    }
  }

  return result;
}

export function barScaleMax(
  lookupBodyMax: number,
  buildCap: number,
  current: number,
): number {
  return Math.max(lookupBodyMax, buildCap, current, RATING_MIN + 1);
}

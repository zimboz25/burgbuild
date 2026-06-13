import type { AttributeKey, Attributes, BuildProfile } from "@/lib/types/build";
import { ATTRIBUTE_KEYS } from "@/lib/constants/attributes";
import { getAllocatedCaps } from "@/lib/utils/build-helpers";
import {
  applyCapBreaker,
  getCapBreakerIncrements,
  isCapBreakerMaxed,
  MAX_CAP_BREAKERS_PER_ATTRIBUTE,
  previewCapBreakers,
} from "./cap-breaker";

export type CapBreakerSelections = Partial<Record<AttributeKey, number>>;

export interface CapBreakerAttributeRow {
  key: AttributeKey;
  buildMax: number;
  absoluteMax: number;
  current: number;
  increments: number[];
  /** Slots with a valid increment (not body-maxed). */
  slotsAvailable: number;
  atBuildCap: boolean;
  maxed: boolean;
  selectedCount: number;
  newCap: number;
}

export function getTotalCapBreakersAvailable(build: BuildProfile): number {
  const spec = Object.values(build.capBreakers.specialization ?? {}).reduce(
    (sum, n) => sum + (n ?? 0),
    0,
  );
  return build.capBreakers.universal + spec;
}

export function countSelectedCapBreakers(
  selections: CapBreakerSelections,
): number {
  return Object.values(selections).reduce((sum, n) => sum + (n ?? 0), 0);
}

export function capAfterSelections(
  buildMax: number,
  absoluteMax: number,
  selectedCount: number,
  attributeKey?: AttributeKey,
): number {
  if (selectedCount <= 0) return buildMax;
  let cap = buildMax;
  for (let i = 0; i < selectedCount; i++) {
    cap = applyCapBreaker(buildMax, cap, absoluteMax, i, attributeKey);
    if (cap >= absoluteMax) break;
  }
  return cap;
}

/** Stats after applying selected cap breakers (assumes attributes are at build cap). */
export function simulateAttributesAfterCapBreakers(
  build: BuildProfile,
  maxPotentials: Attributes,
  selections: CapBreakerSelections,
): Attributes {
  const allocated = getAllocatedCaps(build);
  const result = { ...build.currentAttributes };

  for (const key of ATTRIBUTE_KEYS) {
    const count = selections[key] ?? 0;
    if (count <= 0) continue;
    if (result[key] < allocated[key]) continue;

    let rating = result[key];
    const buildMax = allocated[key];
    for (let i = 0; i < count; i++) {
      rating = applyCapBreaker(buildMax, rating, maxPotentials[key], i, key);
    }
    result[key] = rating;
  }

  return result;
}

export function buildCapBreakerRows(
  build: BuildProfile,
  maxPotentials: Attributes,
  selections: CapBreakerSelections,
): CapBreakerAttributeRow[] {
  const allocated = getAllocatedCaps(build);

  return ATTRIBUTE_KEYS.filter((key) => key !== "stamina").map((key) => {
    const buildMax = allocated[key];
    const absoluteMax = maxPotentials[key];
    const current = build.currentAttributes[key];
    const preview = previewCapBreakers(buildMax, absoluteMax, key);
    const selectedCount = selections[key] ?? 0;

    return {
      key,
      buildMax,
      absoluteMax,
      current,
      increments: preview.increments,
      slotsAvailable: preview.slotsAvailable,
      atBuildCap: current >= buildMax,
      maxed: isCapBreakerMaxed(buildMax, absoluteMax),
      selectedCount,
      newCap: capAfterSelections(buildMax, absoluteMax, selectedCount, key),
    };
  });
}

/** Toggle slot selection (0-based). Returns updated count for attribute. */
export function toggleCapBreakerSlot(
  row: Pick<
    CapBreakerAttributeRow,
    "increments" | "atBuildCap" | "maxed" | "selectedCount"
  >,
  slotIndex: number,
  remainingBudget: number,
): number {
  if (row.maxed || !row.atBuildCap) return row.selectedCount;
  if (slotIndex < 0 || slotIndex >= MAX_CAP_BREAKERS_PER_ATTRIBUTE) {
    return row.selectedCount;
  }
  if (slotIndex >= row.increments.length) return row.selectedCount;

  const targetCount = slotIndex + 1;

  if (row.selectedCount >= targetCount) {
    return Math.max(0, targetCount - 1);
  }

  const added = targetCount - row.selectedCount;
  if (added > remainingBudget) return row.selectedCount;

  return targetCount;
}

export function getIncrementAtSlot(
  buildMax: number,
  absoluteMax: number,
  slotIndex: number,
  attributeKey?: AttributeKey,
): number | null {
  const increments = getCapBreakerIncrements(
    buildMax,
    absoluteMax,
    attributeKey,
  );
  return increments[slotIndex] ?? null;
}

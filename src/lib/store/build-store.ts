"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import bodyConstraints from "@/data/body-constraints.json";
import type { AttributeKey, BuildProfile, Position } from "@/lib/types/build";
import { createDefaultAttributes } from "@/lib/constants/attributes";
import { clampRating } from "@/lib/utils/build-helpers";

function getConstraints(position: Position) {
  return bodyConstraints.positions.find((p) => p.position === position)!;
}

function defaultBuildForPosition(position: Position): BuildProfile {
  const c = getConstraints(position);
  const midHeight = Math.round((c.heightMinInches + c.heightMaxInches) / 2);
  const defaults = createDefaultAttributes(25);
  return {
    name: "My Build",
    position,
    heightInches: midHeight,
    weightLbs: c.defaultWeightLbs,
    wingspanInches: midHeight + 2,
    currentAttributes: { ...defaults },
    allocatedCaps: { ...defaults },
    availableVC: 0,
    capBreakers: { universal: 0 },
    targetBadgeIds: [],
  };
}

interface BuildStore {
  build: BuildProfile;
  setBuild: (build: Partial<BuildProfile>) => void;
  setPosition: (position: Position) => void;
  setCurrentAttribute: (key: AttributeKey, value: number) => void;
  setAllocatedCap: (key: AttributeKey, value: number) => void;
  toggleTargetBadge: (badgeId: string) => void;
  resetBuild: () => void;
}

export const useBuildStore = create<BuildStore>()(
  persist(
    (set) => ({
      build: defaultBuildForPosition("PG"),
      setBuild: (partial) =>
        set((state) => ({ build: { ...state.build, ...partial } })),
      setPosition: (position) =>
        set(() => ({ build: defaultBuildForPosition(position) })),
      setCurrentAttribute: (key, value) =>
        set((state) => {
          const capped = clampRating(value);
          const allocated =
            state.build.allocatedCaps ?? state.build.currentAttributes;
          return {
            build: {
              ...state.build,
              currentAttributes: {
                ...state.build.currentAttributes,
                [key]: Math.min(capped, allocated[key]),
              },
            },
          };
        }),
      setAllocatedCap: (key, value) =>
        set((state) => {
          const capped = clampRating(value);
          const current = state.build.currentAttributes[key];
          const nextCap = Math.max(capped, current);
          return {
            build: {
              ...state.build,
              allocatedCaps: {
                ...(state.build.allocatedCaps ?? state.build.currentAttributes),
                [key]: nextCap,
              },
            },
          };
        }),
      toggleTargetBadge: (badgeId) =>
        set((state) => {
          const current = state.build.targetBadgeIds ?? [];
          const next = current.includes(badgeId)
            ? current.filter((id) => id !== badgeId)
            : [...current, badgeId];
          return { build: { ...state.build, targetBadgeIds: next } };
        }),
      resetBuild: () =>
        set((state) => ({
          build: defaultBuildForPosition(state.build.position),
        })),
    }),
    {
      name: "nba-2k26-build",
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as { build: BuildProfile };
        if (version === 0 && state?.build && !state.build.allocatedCaps) {
          state.build.allocatedCaps = { ...state.build.currentAttributes };
        }
        return state as { build: BuildProfile };
      },
    },
  ),
);

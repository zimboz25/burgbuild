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

export function defaultBuildForPosition(position: Position): BuildProfile {
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

export type CloudSaveStatus = "idle" | "saving" | "saved" | "error";

interface BuildStore {
  build: BuildProfile;
  cloudBuildId: string | null;
  cloudSaveStatus: CloudSaveStatus;
  setBuild: (build: Partial<BuildProfile>) => void;
  setPosition: (position: Position) => void;
  setCurrentAttribute: (key: AttributeKey, value: number) => void;
  setAllocatedCap: (key: AttributeKey, value: number) => void;
  toggleTargetBadge: (badgeId: string) => void;
  resetBuild: () => void;
  loadBuild: (profile: BuildProfile, cloudBuildId?: string | null) => void;
  setCloudBuildId: (id: string | null) => void;
  setCloudSaveStatus: (status: CloudSaveStatus) => void;
  startNewBuild: (position?: Position) => void;
}

export const useBuildStore = create<BuildStore>()(
  persist(
    (set) => ({
      build: defaultBuildForPosition("PG"),
      cloudBuildId: null,
      cloudSaveStatus: "idle",
      setBuild: (partial) =>
        set((state) => ({
          build: { ...state.build, ...partial },
          cloudSaveStatus:
            state.cloudSaveStatus === "saved" ? "idle" : state.cloudSaveStatus,
        })),
      setPosition: (position) =>
        set(() => ({
          build: defaultBuildForPosition(position),
          cloudBuildId: null,
          cloudSaveStatus: "idle",
        })),
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
            cloudSaveStatus:
              state.cloudSaveStatus === "saved" ? "idle" : state.cloudSaveStatus,
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
            cloudSaveStatus:
              state.cloudSaveStatus === "saved" ? "idle" : state.cloudSaveStatus,
          };
        }),
      toggleTargetBadge: (badgeId) =>
        set((state) => {
          const current = state.build.targetBadgeIds ?? [];
          const next = current.includes(badgeId)
            ? current.filter((id) => id !== badgeId)
            : [...current, badgeId];
          return {
            build: { ...state.build, targetBadgeIds: next },
            cloudSaveStatus:
              state.cloudSaveStatus === "saved" ? "idle" : state.cloudSaveStatus,
          };
        }),
      resetBuild: () =>
        set((state) => ({
          build: defaultBuildForPosition(state.build.position),
          cloudBuildId: null,
          cloudSaveStatus: "idle",
        })),
      loadBuild: (profile, cloudBuildId = null) =>
        set({
          build: profile,
          cloudBuildId,
          cloudSaveStatus: "idle",
        }),
      setCloudBuildId: (cloudBuildId) => set({ cloudBuildId }),
      setCloudSaveStatus: (cloudSaveStatus) => set({ cloudSaveStatus }),
      startNewBuild: (position = "PG") =>
        set({
          build: defaultBuildForPosition(position),
          cloudBuildId: null,
          cloudSaveStatus: "idle",
        }),
    }),
    {
      name: "nba-2k26-build",
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as {
          build: BuildProfile;
          cloudBuildId?: string | null;
        };
        if (version === 0 && state?.build && !state.build.allocatedCaps) {
          state.build.allocatedCaps = { ...state.build.currentAttributes };
        }
        if (version < 2) {
          return {
            ...state,
            cloudBuildId: state.cloudBuildId ?? null,
            cloudSaveStatus: "idle" as const,
          };
        }
        return state as BuildStore;
      },
      partialize: (state) => ({
        build: state.build,
        cloudBuildId: state.cloudBuildId,
      }),
    },
  ),
);

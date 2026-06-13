"use client";

import { useMemo } from "react";
import { useBuildStore } from "@/lib/store/build-store";
import { lookupMaxPotentials } from "@/lib/engines/potential-lookup";
import { ATTRIBUTE_GROUPS, ATTRIBUTE_LABELS } from "@/lib/constants/attributes";
import type { AttributeKey } from "@/lib/types/build";
import { StatInput } from "./StatInput";

function statColor(current: number, cap: number): string {
  const gap = cap - current;
  if (gap <= 0) return "text-emerald-400";
  if (gap <= 5) return "text-amber-400";
  return "text-muted";
}

export function AttributeGrid() {
  const build = useBuildStore((s) => s.build);
  const setCurrentAttribute = useBuildStore((s) => s.setCurrentAttribute);
  const setAllocatedCap = useBuildStore((s) => s.setAllocatedCap);

  const { maxPotentials, confidence } = useMemo(
    () =>
      lookupMaxPotentials(
        build.position,
        build.heightInches,
        build.weightLbs,
        build.wingspanInches,
      ),
    [build.position, build.heightInches, build.weightLbs, build.wingspanInches],
  );

  const allocatedCaps = build.allocatedCaps ?? build.currentAttributes;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card/50 p-4 text-sm text-muted">
        <p className="mb-2">
          <strong className="text-foreground">Current</strong> — your in-game
          ratings right now (what shows on the attributes screen).
        </p>
        <p className="mb-2">
          <strong className="text-foreground">Build Cap</strong> — the max you
          allocated to each stat when you created the build. VC upgrades stop
          here.
        </p>
        <p>
          <strong className="text-foreground">Body Max</strong> — the absolute
          ceiling for your height, weight, and wingspan (auto-calculated). Cap
          breakers can push past Build Cap up to this limit.
        </p>
      </div>

      {confidence !== "exact" && (
        <p className="text-sm text-amber-400/90">
          Body Max values are {confidence} from anchor data — verify in-game for
          exact ceilings.
        </p>
      )}

      <div className="hidden gap-2 px-2 text-xs font-medium uppercase tracking-wide text-muted sm:grid sm:grid-cols-[1fr_4.5rem_4.5rem_4.5rem]">
        <span>Stat</span>
        <span className="text-center">Current</span>
        <span className="text-center">Build Cap</span>
        <span className="text-center">Body Max</span>
      </div>

      {ATTRIBUTE_GROUPS.map((group) => (
        <div key={group.label}>
          <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-accent">
            {group.label}
          </h3>
          <div className="grid gap-2">
            {group.keys.map((key) => (
              <AttributeRow
                key={key}
                attributeKey={key}
                current={build.currentAttributes[key]}
                allocated={allocatedCaps[key]}
                bodyMax={maxPotentials[key]}
                onCurrent={(v) => setCurrentAttribute(key, v)}
                onAllocated={(v) => setAllocatedCap(key, v)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AttributeRow({
  attributeKey,
  current,
  allocated,
  bodyMax,
  onCurrent,
  onAllocated,
}: {
  attributeKey: AttributeKey;
  current: number;
  allocated: number;
  bodyMax: number;
  onCurrent: (v: number) => void;
  onAllocated: (v: number) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded-lg border border-border bg-card p-2 sm:grid-cols-[1fr_4.5rem_4.5rem_4.5rem]">
      <label className="min-w-0 truncate text-sm">
        {ATTRIBUTE_LABELS[attributeKey]}
      </label>
      <StatInput value={current} max={99} onCommit={onCurrent} />
      <StatInput value={allocated} max={99} onCommit={onAllocated} />
      <span
        className={`w-14 text-center text-sm font-medium ${statColor(allocated, bodyMax)}`}
        title="Absolute max for your body type"
      >
        {bodyMax}
      </span>
    </div>
  );
}

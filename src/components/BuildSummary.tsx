"use client";

import { useMemo } from "react";
import { useBuildStore } from "@/lib/store/build-store";
import { lookupMaxPotentials } from "@/lib/engines/potential-lookup";
import { inchesToFeetInches } from "@/lib/constants/attributes";

export function BuildSummary() {
  const build = useBuildStore((s) => s.build);
  const { maxPotentials } = useMemo(
    () =>
      lookupMaxPotentials(
        build.position,
        build.heightInches,
        build.weightLbs,
        build.wingspanInches,
      ),
    [build],
  );

  const allocatedCaps = build.allocatedCaps ?? build.currentAttributes;

  const ovr = Math.round(
    Object.values(build.currentAttributes).reduce((a, b) => a + b, 0) /
      Object.values(build.currentAttributes).length,
  );

  const potentialMax = Math.round(
    Object.values(allocatedCaps).reduce((a, b) => a + b, 0) /
      Object.values(allocatedCaps).length,
  );

  const bodyCeiling = Math.round(
    Object.values(maxPotentials).reduce((a, b) => a + b, 0) /
      Object.values(maxPotentials).length,
  );

  const totalCB =
    build.capBreakers.universal +
    Object.values(build.capBreakers.specialization ?? {}).reduce(
      (a, b) => a + (b ?? 0),
      0,
    );

  return (
    <header className="relative border-b border-red-900/40 bg-gradient-to-r from-[#1a0a0a] via-[#120808] to-[#1a0a0a] px-4 py-4">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400">
            MC Attribute Upgrades
          </p>
          <h1 className="text-lg font-bold text-white">{build.name}</h1>
          <p className="text-xs text-white/50">
            Earn VC to upgrade toward your build caps
          </p>
          {totalCB > 0 && (
            <p className="mt-1 text-xs font-semibold text-emerald-400">
              {totalCB} Cap Breaker{totalCB !== 1 ? "s" : ""} Available
            </p>
          )}
        </div>

        <div className="flex flex-col items-center">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-emerald-400/60 bg-black/40 shadow-[0_0_24px_rgba(52,211,153,0.35)]">
            <span className="text-4xl font-bold text-white">{ovr}</span>
            <span className="absolute bottom-2 text-[10px] font-semibold text-emerald-400">
              {potentialMax} MAX
            </span>
          </div>
          <p className="mt-1 text-[10px] text-white/40">
            Body ceiling ~{bodyCeiling}
          </p>
        </div>

        <div className="text-right text-sm">
          <p className="font-semibold text-white">
            HT: {inchesToFeetInches(build.heightInches)} | WT: {build.weightLbs}{" "}
            lbs | WS: {inchesToFeetInches(build.wingspanInches)}
          </p>
          <p className="text-white/70">{build.position}</p>
          <p className="mt-1 text-emerald-400">
            {build.availableVC.toLocaleString()} VC
          </p>
        </div>
      </div>
    </header>
  );
}

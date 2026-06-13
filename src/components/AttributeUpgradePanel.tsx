"use client";

import { useMemo, useState } from "react";
import { useBuildStore } from "@/lib/store/build-store";
import { lookupMaxPotentials } from "@/lib/engines/potential-lookup";
import { BAR_GROUPS, CATEGORY_COLORS } from "@/lib/constants/category-styles";
import { AttributeBar } from "./AttributeBar";
import type { AttributeKey } from "@/lib/types/build";

export function AttributeUpgradePanel() {
  const build = useBuildStore((s) => s.build);
  const setCurrentAttribute = useBuildStore((s) => s.setCurrentAttribute);
  const setAllocatedCap = useBuildStore((s) => s.setAllocatedCap);
  const [selected, setSelected] = useState<AttributeKey | null>(null);

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
    <div className="relative">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/60">
        <p>
          Click bar to set <strong className="text-white">Max</strong> (build
          cap). Shift+click for <strong className="text-white">current</strong>.
          Click numbers to type values.
        </p>
        {confidence !== "exact" && (
          <span className="text-amber-400">Body ceilings {confidence}</span>
        )}
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-0">
          {BAR_GROUPS.map((group, gi) => {
            const colors = CATEGORY_COLORS[group.label];
            return (
              <div key={group.label} className="flex">
                {gi > 0 && (
                  <div className="mx-1 w-px shrink-0 bg-white/10" />
                )}
                <div className="flex gap-1 px-2">
                  {group.keys.map((key) => (
                    <AttributeBar
                      key={key}
                      attributeKey={key}
                      color={colors.fill}
                      colorBright={colors.fillBright}
                      current={build.currentAttributes[key]}
                      buildCap={allocatedCaps[key]}
                      lookupBodyMax={maxPotentials[key]}
                      selected={selected === key}
                      onSelect={() => setSelected(key)}
                      onCurrentChange={(v) => setCurrentAttribute(key, v)}
                      onBuildCapChange={(v) => setAllocatedCap(key, v)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-4 text-[10px] uppercase tracking-wider text-white/40">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-[#00AEEF]" />
          Solid = current
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{
              background:
                "repeating-linear-gradient(-45deg,#39B54A,#39B54A 2px,#5fd66e 2px,#5fd66e 4px)",
            }}
          />
          Striped = VC room to Max
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-black/50" />
          Dark = cap breaker room to body ceiling
        </span>
      </div>
    </div>
  );
}

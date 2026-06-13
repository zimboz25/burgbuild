"use client";

import { useBuildStore } from "@/lib/store/build-store";
import type { BadgeCategory } from "@/lib/types/build";

const SPEC_CATEGORIES: BadgeCategory[] = [
  "finishing",
  "shooting",
  "playmaking",
  "defense",
  "rebounding",
];

export function ResourcesPanel() {
  const build = useBuildStore((s) => s.build);
  const setBuild = useBuildStore((s) => s.setBuild);

  const inputClass =
    "w-full rounded border border-white/10 bg-black/50 px-3 py-2 text-sm text-white";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          Available VC
        </label>
        <input
          type="number"
          min={0}
          step={1000}
          value={build.availableVC}
          onChange={(e) =>
            setBuild({ availableVC: Math.max(0, Number(e.target.value)) })
          }
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          Universal Cap Breakers
        </label>
        <input
          type="number"
          min={0}
          max={28}
          value={build.capBreakers.universal}
          onChange={(e) =>
            setBuild({
              capBreakers: {
                ...build.capBreakers,
                universal: Math.max(0, Number(e.target.value)),
              },
            })
          }
          className={inputClass}
        />
      </div>
      {SPEC_CATEGORIES.map((cat) => (
        <div key={cat}>
          <label className="mb-1 block text-xs uppercase capitalize tracking-wide text-white/50">
            {cat} Spec CB
          </label>
          <input
            type="number"
            min={0}
            max={5}
            value={build.capBreakers.specialization?.[cat] ?? 0}
            onChange={(e) =>
              setBuild({
                capBreakers: {
                  ...build.capBreakers,
                  specialization: {
                    ...build.capBreakers.specialization,
                    [cat]: Math.max(0, Number(e.target.value)),
                  },
                },
              })
            }
            className={inputClass}
          />
        </div>
      ))}
    </div>
  );
}

"use client";

import bodyConstraints from "@/data/body-constraints.json";
import { useBuildStore } from "@/lib/store/build-store";
import { getBodyConstraints } from "@/lib/engines/potential-lookup";
import { inchesToFeetInches, clamp } from "@/lib/constants/attributes";
import type { Position } from "@/lib/types/build";

const POSITIONS: Position[] = ["PG", "SG", "SF", "PF", "C"];

export function BodyTypePicker() {
  const build = useBuildStore((s) => s.build);
  const setBuild = useBuildStore((s) => s.setBuild);
  const setPosition = useBuildStore((s) => s.setPosition);

  const constraints = getBodyConstraints(build.position);
  const wsMin = build.heightInches + bodyConstraints.wingspanOffsetMin;
  const wsMax = build.heightInches + bodyConstraints.wingspanOffsetMax;

  const inputClass =
    "w-full rounded border border-white/10 bg-black/50 px-3 py-2 text-sm text-white";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          Build Name
        </label>
        <input
          value={build.name}
          onChange={(e) => setBuild({ name: e.target.value })}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          Position
        </label>
        <select
          value={build.position}
          onChange={(e) => setPosition(e.target.value as Position)}
          className={inputClass}
        >
          {POSITIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          Height ({inchesToFeetInches(build.heightInches)})
        </label>
        <input
          type="range"
          min={constraints.heightMinInches}
          max={constraints.heightMaxInches}
          value={build.heightInches}
          onChange={(e) => {
            const h = Number(e.target.value);
            setBuild({
              heightInches: h,
              wingspanInches: clamp(build.wingspanInches, h - 6, h + 6),
            });
          }}
          className="w-full accent-red-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          Weight ({build.weightLbs} lbs)
        </label>
        <input
          type="range"
          min={constraints.weightMinLbs}
          max={constraints.weightMaxLbs}
          value={build.weightLbs}
          onChange={(e) => setBuild({ weightLbs: Number(e.target.value) })}
          className="w-full accent-red-500"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          Wingspan ({inchesToFeetInches(build.wingspanInches)}) ±6&quot;
        </label>
        <input
          type="range"
          min={wsMin}
          max={wsMax}
          value={build.wingspanInches}
          onChange={(e) =>
            setBuild({ wingspanInches: Number(e.target.value) })
          }
          className="w-full accent-red-500"
        />
      </div>
    </div>
  );
}

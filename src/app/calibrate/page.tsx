"use client";

import { useState } from "react";
import {
  ATTRIBUTE_GROUPS,
  ATTRIBUTE_LABELS,
  createDefaultAttributes,
} from "@/lib/constants/attributes";
import type { AttributeKey, Position, PotentialAnchor } from "@/lib/types/build";

const POSITIONS: Position[] = ["PG", "SG", "SF", "PF", "C"];

export default function CalibratePage() {
  const [position, setPosition] = useState<Position>("PG");
  const [heightInches, setHeightInches] = useState(72);
  const [weightLbs, setWeightLbs] = useState(180);
  const [wingspanInches, setWingspanInches] = useState(74);
  const [maxPotentials, setMaxPotentials] = useState(createDefaultAttributes(90));
  const [exported, setExported] = useState("");

  const updateMax = (key: AttributeKey, value: number) => {
    setMaxPotentials((prev) => ({ ...prev, [key]: value }));
  };

  const exportAnchor = () => {
    const anchor: PotentialAnchor = {
      heightInches,
      weightLbs,
      wingspanInches,
      maxPotentials,
    };
    const json = JSON.stringify(anchor, null, 2);
    setExported(json);
    navigator.clipboard.writeText(json).catch(() => {});
  };

  return (
    <main className="mx-auto max-w-4xl flex-1 px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold text-accent">
        Anchor Calibration
      </h1>
      <p className="mb-8 text-sm text-muted">
        Paste max potentials from the in-game MyPLAYER Builder to create anchor
        data. Copy the JSON and add it to{" "}
        <code className="text-foreground">src/data/potential-anchors/{position}.json</code>
        .
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted">Position</label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as Position)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2"
          >
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Height (inches)</label>
          <input
            type="number"
            value={heightInches}
            onChange={(e) => setHeightInches(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-card px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Weight (lbs)</label>
          <input
            type="number"
            value={weightLbs}
            onChange={(e) => setWeightLbs(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-card px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Wingspan (inches)</label>
          <input
            type="number"
            value={wingspanInches}
            onChange={(e) => setWingspanInches(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-card px-3 py-2"
          />
        </div>
      </div>

      {ATTRIBUTE_GROUPS.map((group) => (
        <div key={group.label} className="mb-6">
          <h3 className="mb-2 text-sm font-medium text-accent">{group.label}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.keys.map((key) => (
              <div key={key} className="flex items-center gap-2">
                <label className="flex-1 text-sm">{ATTRIBUTE_LABELS[key]}</label>
                <input
                  type="number"
                  min={60}
                  max={99}
                  value={maxPotentials[key]}
                  onChange={(e) => updateMax(key, Number(e.target.value))}
                  className="w-16 rounded border border-border bg-card px-2 py-1 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={exportAnchor}
        className="rounded-lg bg-accent px-6 py-3 font-medium text-background hover:opacity-90"
      >
        Export Anchor JSON (copied to clipboard)
      </button>

      {exported && (
        <pre className="mt-6 overflow-x-auto rounded-lg border border-border bg-card p-4 text-xs">
          {exported}
        </pre>
      )}
    </main>
  );
}

"use client";

import Link from "next/link";
import { BuildSummary } from "@/components/BuildSummary";
import { BodyTypePicker } from "@/components/BodyTypePicker";
import { AttributeUpgradePanel } from "@/components/AttributeUpgradePanel";
import { ResourcesPanel } from "@/components/ResourcesPanel";

export default function BuildPage() {
  return (
    <div className="bg-2k-panel min-h-screen">
      <BuildSummary />
      <main className="mx-auto max-w-[1400px] px-4 py-6">
        <section className="mb-8 rounded-lg border border-red-900/30 bg-black/30 p-4 backdrop-blur">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-red-400/80">
            Body Type
          </h2>
          <BodyTypePicker />
        </section>

        <section className="mb-8 rounded-lg border border-red-900/30 bg-black/40 p-4 backdrop-blur">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-red-400/80">
              Attribute Upgrades
            </h2>
            <span className="text-[10px] uppercase text-white/40">
              Detailed View
            </span>
          </div>
          <AttributeUpgradePanel />
        </section>

        <section className="mb-8 rounded-lg border border-red-900/30 bg-black/30 p-4 backdrop-blur">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-red-400/80">
            Resources
          </h2>
          <ResourcesPanel />
        </section>

        <div className="flex justify-end pb-8">
          <Link
            href="/results"
            className="rounded border border-emerald-500/50 bg-emerald-600/20 px-8 py-3 text-sm font-bold uppercase tracking-wider text-emerald-400 hover:bg-emerald-600/30"
          >
            Analyze Build →
          </Link>
        </div>
      </main>
    </div>
  );
}

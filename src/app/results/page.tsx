"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BuildSummary } from "@/components/BuildSummary";
import { BadgeTable } from "@/components/BadgeTable";
import { UpgradeCard } from "@/components/UpgradeCard";
import { CapBreakerPlanCard } from "@/components/CapBreakerPlanCard";
import { useBuildStore } from "@/lib/store/build-store";
import { lookupMaxPotentials } from "@/lib/engines/potential-lookup";
import { getEffectiveBodyMaxes } from "@/lib/utils/build-helpers";
import { optimizeVCUpgrades } from "@/lib/engines/vc-optimizer";
import { optimizeCapBreakers } from "@/lib/engines/cap-breaker-optimizer";

type Tab = "badges" | "vc" | "capbreakers";

export default function ResultsPage() {
  const build = useBuildStore((s) => s.build);
  const [tab, setTab] = useState<Tab>("badges");

  const maxPotentials = useMemo(() => {
    const lookup = lookupMaxPotentials(
      build.position,
      build.heightInches,
      build.weightLbs,
      build.wingspanInches,
    ).maxPotentials;
    return getEffectiveBodyMaxes(build, lookup);
  }, [build]);

  const vcSuggestions = useMemo(
    () => optimizeVCUpgrades({ build, maxPotentials }),
    [build, maxPotentials],
  );

  const cbPlans = useMemo(
    () => optimizeCapBreakers({ build, maxPotentials }),
    [build, maxPotentials],
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "badges", label: "Badges" },
    { id: "vc", label: "VC Upgrades" },
    { id: "capbreakers", label: "Cap Breakers" },
  ];

  return (
    <div className="bg-2k-panel min-h-screen">
      <BuildSummary />
      <main className="mx-auto max-w-[1400px] flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-lg px-4 py-2 text-sm ${
                  tab === t.id
                    ? "bg-accent text-background"
                    : "border border-border bg-card"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Link
            href="/build"
            className="text-sm text-muted hover:text-foreground"
          >
            ← Edit Build
          </Link>
        </div>

        {tab === "badges" && <BadgeTable />}

        {tab === "vc" && (
          <div>
            <p className="mb-4 text-sm text-muted">
              Ranked upgrades by badge impact per VC. Suggestions only raise
              stats from your <strong>Current</strong> toward your{" "}
              <strong>Build Cap</strong> (not Body Max). Costs are estimated.
            </p>
            {vcSuggestions.length === 0 ? (
              <p className="text-muted">
                No VC upgrades suggested — add VC budget or lower attributes to
                unlock badges.
              </p>
            ) : (
              <div className="space-y-3">
                {vcSuggestions.map((s, i) => (
                  <UpgradeCard key={`${s.attribute}-${i}`} suggestion={s} index={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "capbreakers" && (
          <div>
            <p className="mb-4 text-sm text-muted">
              Recommended cap breaker allocations. Your stat must be at{" "}
              <strong>Build Cap</strong> (and below <strong>Body Max</strong>)
              before cap breakers apply in-game.
            </p>
            {cbPlans.length === 0 ? (
              <p className="text-muted">
                No cap breaker plans — add cap breakers or ensure attributes are
                below max potential.
              </p>
            ) : (
              <div className="space-y-4">
                {cbPlans.map((plan, i) => (
                  <CapBreakerPlanCard key={plan.id} plan={plan} rank={i + 1} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

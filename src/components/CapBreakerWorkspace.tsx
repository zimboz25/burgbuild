"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ATTRIBUTE_LABELS,
  BADGE_TIER_LABELS,
} from "@/lib/constants/attributes";
import { BAR_GROUPS, CATEGORY_COLORS } from "@/lib/constants/category-styles";
import { BADGES, compareBadgeResults, evaluateBadges } from "@/lib/engines/badge-engine";
import {
  buildCapBreakerRows,
  countSelectedCapBreakers,
  getTotalCapBreakersAvailable,
  simulateAttributesAfterCapBreakers,
  toggleCapBreakerSlot,
  type CapBreakerAttributeRow,
  type CapBreakerSelections,
} from "@/lib/engines/cap-breaker-simulation";
import { MAX_CAP_BREAKERS_PER_ATTRIBUTE } from "@/lib/engines/cap-breaker";
import type { Attributes, BuildProfile } from "@/lib/types/build";

interface Props {
  build: BuildProfile;
  capBreakerMaxes: Attributes;
}

function CapBreakerRow({
  row,
  remainingBudget,
  onToggleSlot,
}: {
  row: CapBreakerAttributeRow;
  remainingBudget: number;
  onToggleSlot: (slotIndex: number) => void;
}) {
  const canSelect = row.atBuildCap && !row.maxed;

  return (
    <div className="grid grid-cols-[minmax(7rem,1fr)_2.5rem_repeat(5,minmax(2rem,1fr))_2.5rem] items-center gap-1 border-b border-white/5 py-1.5 text-xs">
      <span className="truncate pr-1 text-white/90">{ATTRIBUTE_LABELS[row.key]}</span>
      <span
        className={`text-center font-medium tabular-nums ${
          canSelect ? "text-white" : "text-white/40"
        }`}
        title={
          canSelect
            ? "Build max (original cap)"
            : "Reach build cap with VC before cap breakers apply"
        }
      >
        {row.buildMax}
        {!row.atBuildCap && !row.maxed ? (
          <span className="ml-0.5 text-[10px] text-white/30">🔒</span>
        ) : null}
      </span>
      {Array.from({ length: MAX_CAP_BREAKERS_PER_ATTRIBUTE }, (_, slotIndex) => {
        const increment = row.increments[slotIndex];
        const isSelected = row.selectedCount > slotIndex;
        const isNext =
          canSelect &&
          row.selectedCount === slotIndex &&
          increment !== undefined &&
          remainingBudget > 0;
        const isLocked = increment === undefined;

        return (
          <button
            key={slotIndex}
            type="button"
            disabled={!canSelect || isLocked}
            onClick={() => onToggleSlot(slotIndex)}
            className={`relative min-h-8 skew-x-[-12deg] border px-0.5 transition ${
              isLocked
                ? "cursor-not-allowed border-white/10 bg-white/5 text-white/20"
                : isSelected
                  ? "border-white bg-white/15 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.4)]"
                  : isNext
                    ? "border-accent/60 bg-accent/10 text-accent hover:bg-accent/20"
                    : canSelect
                      ? "border-white/25 bg-black/40 text-white/70 hover:border-white/50 hover:bg-white/10"
                      : "cursor-not-allowed border-white/10 bg-white/5 text-white/25"
            }`}
            title={
              isLocked
                ? "No cap breaker room (at absolute max)"
                : increment !== undefined
                  ? `+${increment} — click to ${isSelected ? "deselect" : "select"}`
                  : undefined
            }
          >
            <span className="block skew-x-[12deg] text-center text-[11px] font-semibold tabular-nums">
              {isLocked ? "🔒" : `+${increment}`}
            </span>
          </button>
        );
      })}
      <span className="text-center text-[11px] font-medium tabular-nums text-white/80">
        {row.maxed ? (
          <span className="text-emerald-400">Max</span>
        ) : row.selectedCount > 0 ? (
          row.newCap
        ) : (
          "—"
        )}
      </span>
    </div>
  );
}

function AttributeColumn({
  label,
  keys,
  rowsByKey,
  remainingBudget,
  onToggleSlot,
}: {
  label: string;
  keys: typeof BAR_GROUPS[number]["keys"];
  rowsByKey: Map<CapBreakerAttributeRow["key"], CapBreakerAttributeRow>;
  remainingBudget: number;
  onToggleSlot: (key: CapBreakerAttributeRow["key"], slotIndex: number) => void;
}) {
  const color = CATEGORY_COLORS[label]?.fill ?? "#888";

  return (
    <div>
      <div
        className="mb-2 border-b pb-1 text-[11px] font-bold uppercase tracking-wider"
        style={{ borderColor: `${color}66`, color }}
      >
        {label}
      </div>
      <div className="mb-1 grid grid-cols-[minmax(7rem,1fr)_2.5rem_repeat(5,minmax(2rem,1fr))_2.5rem] gap-1 px-0 text-[10px] uppercase tracking-wide text-white/35">
        <span>Attribute</span>
        <span className="text-center">Cap</span>
        {Array.from({ length: MAX_CAP_BREAKERS_PER_ATTRIBUTE }, (_, i) => (
          <span key={i} className="text-center">
            CB{i + 1}
          </span>
        ))}
        <span className="text-center">New</span>
      </div>
      {keys.map((key) => {
        const row = rowsByKey.get(key);
        if (!row) return null;
        return (
          <CapBreakerRow
            key={key}
            row={row}
            remainingBudget={remainingBudget}
            onToggleSlot={(slotIndex) => onToggleSlot(key, slotIndex)}
          />
        );
      })}
    </div>
  );
}

export function CapBreakerWorkspace({ build, capBreakerMaxes }: Props) {
  const [selections, setSelections] = useState<CapBreakerSelections>({});

  const rows = useMemo(
    () => buildCapBreakerRows(build, capBreakerMaxes, selections),
    [build, capBreakerMaxes, selections],
  );

  const rowsByKey = useMemo(
    () => new Map(rows.map((row) => [row.key, row])),
    [rows],
  );

  const totalAvailable = getTotalCapBreakersAvailable(build);
  const totalSelected = countSelectedCapBreakers(selections);
  const remaining = totalAvailable - totalSelected;

  const badgeImpact = useMemo(() => {
    const before = evaluateBadges(
      build.currentAttributes,
      build.heightInches,
      build.badgePerks,
    );
    const afterAttrs = simulateAttributesAfterCapBreakers(
      build,
      capBreakerMaxes,
      selections,
    );
    const after = evaluateBadges(
      afterAttrs,
      build.heightInches,
      build.badgePerks,
    );
    return compareBadgeResults(before, after);
  }, [build, capBreakerMaxes, selections]);

  const badgeName = (id: string) => BADGES.find((b) => b.id === id)?.name ?? id;

  const handleToggle = (key: CapBreakerAttributeRow["key"], slotIndex: number) => {
    const row = rowsByKey.get(key);
    if (!row) return;
    const nextCount = toggleCapBreakerSlot(row, slotIndex, remaining);
    setSelections((prev) => {
      const next = { ...prev };
      if (nextCount <= 0) {
        delete next[key];
      } else {
        next[key] = nextCount;
      }
      return next;
    });
  };

  const leftGroups = BAR_GROUPS.slice(0, 3);
  const rightGroups = BAR_GROUPS.slice(3);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card/80 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-accent">Cap Breaker Planner</p>
          <p className="text-xs text-muted">
            Click CB slots to plan upgrades. Stats must be at{" "}
            <strong className="text-foreground">Build Cap</strong> before
            breakers apply in-game.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted">
            Remaining:{" "}
            <strong className="text-foreground">{remaining}</strong> /{" "}
            {totalAvailable}
          </span>
          {totalSelected > 0 && (
            <button
              type="button"
              onClick={() => setSelections({})}
              className="rounded border border-border px-2 py-1 text-xs text-muted hover:text-foreground"
            >
              Clear selection
            </button>
          )}
        </div>
      </div>

      {totalAvailable === 0 && (
        <p className="rounded-lg border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-200/90">
          Set your cap breaker count on the{" "}
          <Link href="/build" className="underline">
            Build
          </Link>{" "}
          page under Resources (universal + specialization).
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {[leftGroups, rightGroups].map((groups, col) => (
          <div key={col} className="space-y-6 rounded-lg border border-border bg-black/30 p-4">
            {groups.map((group) => (
              <AttributeColumn
                key={group.label}
                label={group.label}
                keys={group.keys}
                rowsByKey={rowsByKey}
                remainingBudget={remaining}
                onToggleSlot={handleToggle}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-accent">Badge Impact</h3>
        {totalSelected === 0 ? (
          <p className="text-sm text-muted">
            Select cap breakers above to preview badges unlocked or upgraded at
            the new attribute caps.
          </p>
        ) : badgeImpact.gained.length === 0 &&
          badgeImpact.upgraded.length === 0 ? (
          <p className="text-sm text-muted">
            No new badges from this allocation — try different attributes or
            add more cap breakers.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {badgeImpact.gained.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-400">
                  Badges Earned ({badgeImpact.gained.length})
                </p>
                <ul className="space-y-1 text-sm">
                  {badgeImpact.gained.map((id) => (
                    <li key={id} className="text-foreground">
                      {badgeName(id)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {badgeImpact.upgraded.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-sky-400">
                  Badges Upgraded ({badgeImpact.upgraded.length})
                </p>
                <ul className="space-y-1 text-sm">
                  {badgeImpact.upgraded.map((u) => (
                    <li key={u.badgeId} className="text-foreground">
                      {badgeName(u.badgeId)}:{" "}
                      {u.from ? BADGE_TIER_LABELS[u.from] : "—"} →{" "}
                      {BADGE_TIER_LABELS[u.to]}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

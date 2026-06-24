"use client";

import type { ReactNode } from "react";
import type { ScannerSortKey, SortDirection } from "@/lib/engines/bot-valuation";

const BULLISH_BOT_OPTIONS = [
  { value: 0, label: "Any" },
  { value: 2, label: "2+" },
  { value: 3, label: "3+" },
  { value: 4, label: "4/4" },
] as const;

const SORT_OPTIONS: { value: ScannerSortKey; label: string }[] = [
  { value: "score", label: "Score" },
  { value: "bot-upside", label: "Bot upside" },
];

function toggleButtonClass(active: boolean): string {
  return `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    active
      ? "bg-primary/15 text-primary shadow-sm"
      : "text-muted hover:bg-accent hover:text-foreground"
  }`;
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-[10rem] flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

interface ScannerFiltersProps {
  sectors: string[];
  sectorFilter: string;
  onSectorFilterChange: (value: string) => void;
  minScore: number;
  onMinScoreChange: (value: number) => void;
  minBullishBots: number;
  onMinBullishBotsChange: (value: number) => void;
  sortKey: ScannerSortKey;
  onSortKeyChange: (value: ScannerSortKey) => void;
  sortDirection: SortDirection;
  onSortDirectionChange: (value: SortDirection) => void;
}

export function ScannerFilters({
  sectors,
  sectorFilter,
  onSectorFilterChange,
  minScore,
  onMinScoreChange,
  minBullishBots,
  onMinBullishBotsChange,
  sortKey,
  onSortKeyChange,
  sortDirection,
  onSortDirectionChange,
}: ScannerFiltersProps) {
  const directionLabels =
    sortKey === "bot-upside"
      ? {
          desc: "Most underpriced",
          asc: "Least upside",
        }
      : {
          desc: "Highest score",
          asc: "Lowest score",
        };

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="grid gap-5 lg:grid-cols-[auto_1fr] lg:items-start">
        <div className="flex flex-wrap gap-4">
          <FilterField label="Sector">
            <select
              value={sectorFilter}
              onChange={(e) => onSectorFilterChange(e.target.value)}
              className="w-full min-w-[11rem] rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
            >
              <option value="all">All sectors</option>
              {sectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Min score">
            <select
              value={minScore}
              onChange={(e) => onMinScoreChange(Number(e.target.value))}
              className="w-full min-w-[7rem] rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
            >
              <option value={0}>All</option>
              <option value={35}>35+</option>
              <option value={50}>50+</option>
              <option value={70}>70+</option>
            </select>
          </FilterField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FilterField label="Min bots bullish">
            <div
              className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-background p-1"
              role="group"
              aria-label="Minimum bullish bots"
            >
              {BULLISH_BOT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onMinBullishBotsChange(option.value)}
                  className={toggleButtonClass(minBullishBots === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </FilterField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FilterField label="Sort by">
              <div
                className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-background p-1"
                role="group"
                aria-label="Sort field"
              >
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onSortKeyChange(option.value)}
                    className={toggleButtonClass(sortKey === option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </FilterField>

            <FilterField label="Order">
              <div
                className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-background p-1"
                role="group"
                aria-label="Sort direction"
              >
                <button
                  type="button"
                  onClick={() => onSortDirectionChange("desc")}
                  className={toggleButtonClass(sortDirection === "desc")}
                >
                  ↓ {directionLabels.desc}
                </button>
                <button
                  type="button"
                  onClick={() => onSortDirectionChange("asc")}
                  className={toggleButtonClass(sortDirection === "asc")}
                >
                  ↑ {directionLabels.asc}
                </button>
              </div>
            </FilterField>
          </div>
        </div>
      </div>
    </section>
  );
}

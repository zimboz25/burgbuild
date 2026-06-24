"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MarketId, WatchlistEntry } from "@/lib/types/stocks";

function makeLocalId(): string {
  return `local-${crypto.randomUUID()}`;
}

interface WatchlistStore {
  entries: WatchlistEntry[];
  addEntry: (input: {
    marketId: MarketId;
    symbol: string;
    addedPrice?: number | null;
    notes?: string;
  }) => void;
  removeEntry: (id: string) => void;
  hasSymbol: (marketId: MarketId, symbol: string) => boolean;
  setEntries: (entries: WatchlistEntry[]) => void;
  clearEntries: () => void;
}

export const useWatchlistStore = create<WatchlistStore>()(
  persist(
    (set, get) => ({
      entries: [],
      addEntry: ({ marketId, symbol, addedPrice, notes }) => {
        const normalized = symbol.toUpperCase();
        const existing = get().entries.find(
          (entry) =>
            entry.marketId === marketId && entry.symbol === normalized,
        );
        if (existing) return;

        set({
          entries: [
            {
              id: makeLocalId(),
              marketId,
              symbol: normalized,
              addedAt: new Date().toISOString(),
              addedPrice: addedPrice ?? null,
              notes,
            },
            ...get().entries,
          ],
        });
      },
      removeEntry: (id) => {
        set({ entries: get().entries.filter((entry) => entry.id !== id) });
      },
      hasSymbol: (marketId, symbol) =>
        get().entries.some(
          (entry) =>
            entry.marketId === marketId &&
            entry.symbol === symbol.toUpperCase(),
        ),
      setEntries: (entries) => set({ entries }),
      clearEntries: () => set({ entries: [] }),
    }),
    { name: "burgbuild-watchlist" },
  ),
);

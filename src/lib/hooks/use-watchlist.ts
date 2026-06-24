"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { MarketId, WatchlistEntry } from "@/lib/types/stocks";
import { useWatchlistStore } from "@/lib/store/watchlist-store";
import {
  addWatchlistSymbol,
  listWatchlist,
  removeWatchlistSymbol,
  syncWatchlistToCloud,
} from "@/lib/supabase/watchlists";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export function useWatchlist() {
  const { user } = useAuth();
  const entries = useWatchlistStore((s) => s.entries);
  const addLocal = useWatchlistStore((s) => s.addEntry);
  const removeLocal = useWatchlistStore((s) => s.removeEntry);
  const hasSymbol = useWatchlistStore((s) => s.hasSymbol);
  const setEntries = useWatchlistStore((s) => s.setEntries);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadCloud = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) return;
    setLoading(true);
    try {
      const cloudEntries = await listWatchlist();
      setEntries(cloudEntries);
    } finally {
      setLoading(false);
    }
  }, [user, setEntries]);

  useEffect(() => {
    if (user) {
      void loadCloud();
    }
  }, [user, loadCloud]);

  const addSymbol = useCallback(
    async (input: {
      marketId: MarketId;
      symbol: string;
      addedPrice?: number | null;
      notes?: string;
    }) => {
      if (user && isSupabaseConfigured()) {
        await addWatchlistSymbol(input);
        await loadCloud();
        return;
      }

      addLocal(input);
    },
    [user, addLocal, loadCloud],
  );

  const removeSymbol = useCallback(
    async (id: string) => {
      if (user && isSupabaseConfigured() && !id.startsWith("local-")) {
        await removeWatchlistSymbol(id);
        await loadCloud();
        return;
      }

      removeLocal(id);
    },
    [user, removeLocal, loadCloud],
  );

  const syncLocalToCloud = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) return;
    setSyncing(true);
    try {
      const merged = await syncWatchlistToCloud(entries);
      setEntries(merged);
    } finally {
      setSyncing(false);
    }
  }, [user, entries, setEntries]);

  return {
    entries,
    loading,
    syncing,
    addSymbol,
    removeSymbol,
    hasSymbol,
    syncLocalToCloud,
    reload: loadCloud,
    isCloud: Boolean(user && isSupabaseConfigured()),
  };
}

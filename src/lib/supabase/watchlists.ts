import type { MarketId, WatchlistEntry } from "@/lib/types/stocks";
import { getSupabaseClient } from "./client";
import type { WatchlistRow } from "./database.types";

function toEntry(row: WatchlistRow): WatchlistEntry {
  return {
    id: row.id,
    marketId: row.market_id as MarketId,
    symbol: row.symbol,
    addedAt: row.added_at,
    addedPrice: row.added_price,
    notes: row.notes ?? undefined,
  };
}

export async function listWatchlist(): Promise<WatchlistEntry[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("watchlists")
    .select("*")
    .order("added_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => toEntry(row as WatchlistRow));
}

export async function addWatchlistSymbol(input: {
  marketId: MarketId;
  symbol: string;
  addedPrice?: number | null;
  notes?: string;
}): Promise<WatchlistEntry> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to save watchlist items");

  const { data, error } = await supabase
    .from("watchlists")
    .upsert(
      {
        user_id: user.id,
        market_id: input.marketId,
        symbol: input.symbol.toUpperCase(),
        added_price: input.addedPrice ?? null,
        notes: input.notes ?? null,
        added_at: new Date().toISOString(),
      },
      { onConflict: "user_id,market_id,symbol" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return toEntry(data as WatchlistRow);
}

export async function removeWatchlistSymbol(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase.from("watchlists").delete().eq("id", id);
  if (error) throw error;
}

export async function syncWatchlistToCloud(
  entries: WatchlistEntry[],
): Promise<WatchlistEntry[]> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to sync watchlist");

  for (const entry of entries) {
    await supabase.from("watchlists").upsert(
      {
        user_id: user.id,
        market_id: entry.marketId,
        symbol: entry.symbol.toUpperCase(),
        added_price: entry.addedPrice,
        notes: entry.notes ?? null,
        added_at: entry.addedAt,
      },
      { onConflict: "user_id,market_id,symbol" },
    );
  }

  return listWatchlist();
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MARKETS, MARKET_IDS } from "@/data/markets";
import { useWatchlist } from "@/lib/hooks/use-watchlist";
import { rankBuyTimingSuggestions } from "@/lib/engines/buy-timing";
import {
  buildProjectionPathForForecast,
  getSma50Line,
} from "@/lib/engines/price-forecast";
import { fetchAllSparkSeries, fetchSparkSeries } from "@/lib/stocks/yahoo-finance";
import type {
  BuyTimingSuggestion,
  ForecastHorizon,
  MarketId,
  SparkSeries,
  WatchlistEntry,
} from "@/lib/types/stocks";
import {
  BotBreakdownPanel,
  BotConsensusBadge,
  BotIconRow,
} from "@/components/stocks/bot-ui";
import { ForecastPanel } from "@/components/stocks/forecast-panel";
import { HorizonTabs, PriceChart } from "@/components/stocks/price-chart";
import { useAuth } from "@/components/auth/AuthProvider";
import { SignedValue } from "@/components/stocks/signed-value";

function formatPrice(value: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPct(value: number | null): string {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function sinceAddedPct(
  currentPrice: number,
  addedPrice: number | null,
): number | null {
  if (addedPrice == null || addedPrice <= 0) return null;
  return ((currentPrice - addedPrice) / addedPrice) * 100;
}

interface WatchlistRow extends WatchlistEntry {
  suggestion?: BuyTimingSuggestion;
  series?: SparkSeries;
}

export function WatchlistWorkspace() {
  const { user } = useAuth();
  const { entries, loading: watchlistLoading, addSymbol, removeSymbol, syncLocalToCloud, syncing, isCloud } =
    useWatchlist();

  const [addMarketId, setAddMarketId] = useState<MarketId>("asx200");
  const [addSymbolValue, setAddSymbolValue] = useState("");
  const [rows, setRows] = useState<WatchlistRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [chartHorizon, setChartHorizon] = useState<ForecastHorizon>("20d");

  const market = MARKETS[addMarketId];
  const stockOptions = useMemo(
    () => market.stocks.map((stock) => stock.symbol).sort(),
    [market],
  );

  const loadWatchlistData = useCallback(async () => {
    if (entries.length === 0) {
      setRows([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const grouped = new Map<MarketId, WatchlistEntry[]>();
      for (const entry of entries) {
        const list = grouped.get(entry.marketId) ?? [];
        list.push(entry);
        grouped.set(entry.marketId, list);
      }

      const suggestionMap = new Map<string, BuyTimingSuggestion>();
      const seriesMap = new Map<string, SparkSeries>();

      for (const [marketId, marketEntries] of grouped) {
        const marketDef = MARKETS[marketId];
        const symbols = marketEntries.map((entry) => entry.symbol);
        const series =
          symbols.length <= 20
            ? await fetchSparkSeries(symbols, marketDef)
            : await fetchAllSparkSeries(symbols, marketDef);
        for (const item of series) {
          seriesMap.set(`${marketId}:${item.symbol}`, item);
        }
        const ranked = rankBuyTimingSuggestions(series, marketId);
        for (const item of ranked) {
          suggestionMap.set(`${marketId}:${item.symbol}`, item);
        }
      }

      setRows(
        entries.map((entry) => ({
          ...entry,
          suggestion: suggestionMap.get(`${entry.marketId}:${entry.symbol}`),
          series: seriesMap.get(`${entry.marketId}:${entry.symbol}`),
        })),
      );
    } catch (err) {
      setRows(entries);
      setError(
        err instanceof Error ? err.message : "Failed to load watchlist market data",
      );
    } finally {
      setLoading(false);
    }
  }, [entries]);

  useEffect(() => {
    void loadWatchlistData();
  }, [loadWatchlistData]);

  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];
  const selectedHorizonForecast = selected?.suggestion?.forecast?.consensus.find(
    (item) => item.horizon === chartHorizon,
  );
  const chartProjectionPath =
    selected?.suggestion &&
    selected.series &&
    selectedHorizonForecast
      ? buildProjectionPathForForecast(
          selected.suggestion.price,
          selected.series.closes,
          selectedHorizonForecast,
        )
      : selected?.suggestion?.forecast?.projectionPath;

  const handleAdd = async () => {
    const symbol = addSymbolValue.trim().toUpperCase();
    if (!symbol) return;

    const stock = market.stocks.find((item) => item.symbol === symbol);
    if (!stock) {
      setAddError(`${symbol} is not in the ${market.label} universe`);
      return;
    }

    setAddError(null);

    try {
      let addedPrice: number | null = null;
      const series = await fetchSparkSeries([symbol], market);
      if (series[0]) {
        addedPrice = series[0].meta.regularMarketPrice;
      }

      await addSymbol({ marketId: addMarketId, symbol, addedPrice });
      setAddSymbolValue("");
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add symbol");
    }
  };

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Markets
        </p>
        <h1 className="text-3xl font-bold text-foreground">Watchlist</h1>
        <p className="max-w-2xl text-muted">
          Track symbols you care about, monitor price change since you added them,
          and see bot consensus across technical, momentum, mean reversion, and ML
          models. Not financial advice.
        </p>
        {!user && (
          <p className="text-sm text-muted">
            Saved locally in your browser.{" "}
            <Link href="/auth" className="text-primary hover:underline">
              Sign in
            </Link>{" "}
            to sync across devices.
          </p>
        )}
        {user && !isCloud && (
          <button
            type="button"
            onClick={() => void syncLocalToCloud()}
            disabled={syncing}
            className="rounded-md border border-primary/40 px-3 py-1 text-sm text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            {syncing ? "Syncing…" : "Sync local watchlist to cloud"}
          </button>
        )}
      </header>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <label className="flex flex-col gap-1 text-sm text-muted">
          Market
          <select
            value={addMarketId}
            onChange={(e) => setAddMarketId(e.target.value as MarketId)}
            className="rounded-md border border-border bg-background px-2 py-1 text-foreground"
          >
            {MARKET_IDS.map((id) => (
              <option key={id} value={id}>
                {MARKETS[id].label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          Symbol
          <input
            list="watchlist-symbols"
            value={addSymbolValue}
            onChange={(e) => setAddSymbolValue(e.target.value.toUpperCase())}
            placeholder="e.g. BHP"
            className="rounded-md border border-border bg-background px-2 py-1 text-foreground"
          />
          <datalist id="watchlist-symbols">
            {stockOptions.map((symbol) => (
              <option key={symbol} value={symbol} />
            ))}
          </datalist>
        </label>
        <button
          type="button"
          onClick={() => void handleAdd()}
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Add to watchlist
        </button>
      </div>

      {addError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {addError}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {watchlistLoading || (loading && rows.length === 0) ? (
        <div className="flex flex-1 items-center justify-center py-24 text-muted">
          Loading watchlist…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-16 text-center text-muted">
          Your watchlist is empty. Add a symbol above or from the buy timing scanner.
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[1fr_420px]">
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Since added</th>
                    <th className="px-4 py-3">1M forecast</th>
                    <th className="px-4 py-3">Bots</th>
                    <th className="px-4 py-3">Consensus</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const marketDef = MARKETS[row.marketId];
                    const price = row.suggestion?.price;
                    const change = price != null ? sinceAddedPct(price, row.addedPrice) : null;
                    const active = selected?.id === row.id;

                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedId(row.id)}
                        className={`cursor-pointer border-b border-border/60 transition-colors ${
                          active ? "bg-primary/10" : "hover:bg-accent"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{row.symbol}</div>
                          <div className="text-xs text-muted">
                            {marketDef.shortLabel}
                            {row.suggestion?.sector ? ` · ${row.suggestion.sector}` : ""}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {price != null
                            ? formatPrice(price, row.suggestion!.currency, marketDef.locale)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          <SignedValue value={change}>{formatPct(change)}</SignedValue>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          <SignedValue
                            value={
                              row.suggestion?.forecast?.consensus.find(
                                (item) => item.horizon === "20d",
                              )?.expectedReturnPct
                            }
                          >
                            {formatPct(
                              row.suggestion?.forecast?.consensus.find(
                                (item) => item.horizon === "20d",
                              )?.expectedReturnPct ?? null,
                            )}
                          </SignedValue>
                        </td>
                        <td className="px-4 py-3">
                          <BotIconRow results={row.suggestion?.consensus?.results ?? []} />
                        </td>
                        <td className="px-4 py-3">
                          <BotConsensusBadge consensus={row.suggestion?.consensus} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void removeSymbol(row.id);
                            }}
                            className="text-xs text-muted hover:text-red-400"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="rounded-xl border border-border bg-card p-5">
            {selected?.suggestion ? (
              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">
                    {selected.symbol} · {MARKETS[selected.marketId].label}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">
                    {selected.suggestion.name}
                  </h2>
                  <p className="mt-1 font-mono text-2xl text-foreground">
                    {formatPrice(
                      selected.suggestion.price,
                      selected.suggestion.currency,
                      MARKETS[selected.marketId].locale,
                    )}
                  </p>
                  {selected.addedPrice != null && (
                    <p className="mt-1 text-sm text-muted">
                      Added at{" "}
                      {formatPrice(
                        selected.addedPrice,
                        selected.suggestion.currency,
                        MARKETS[selected.marketId].locale,
                      )}
                    </p>
                  )}
                </div>

                {selected.series && chartProjectionPath && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-wide text-muted">
                        Price chart
                      </p>
                      <HorizonTabs value={chartHorizon} onChange={setChartHorizon} />
                    </div>
                    <PriceChart
                      history={selected.series.closes}
                      timestamps={selected.series.timestamps}
                      currency={selected.suggestion.currency}
                      locale={MARKETS[selected.marketId].locale}
                      projectionPath={chartProjectionPath}
                      forecast={selectedHorizonForecast}
                      sma50={getSma50Line(selected.series.closes)}
                    />
                  </div>
                )}

                {selected.suggestion.forecast && (
                  <ForecastPanel
                    outlook={selected.suggestion.forecast}
                    horizon={chartHorizon}
                    currency={selected.suggestion.currency}
                    locale={MARKETS[selected.marketId].locale}
                  />
                )}

                <BotBreakdownPanel consensus={selected.suggestion.consensus} />
              </div>
            ) : (
              <p className="text-sm text-muted">
                Select a watchlist item to see bot details.
              </p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

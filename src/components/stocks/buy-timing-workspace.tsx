"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getMarket,
  getMarketSymbols,
  isMarketId,
  MARKET_IDS,
  MARKETS,
} from "@/data/markets";
import { rankBuyTimingSuggestions } from "@/lib/engines/buy-timing";
import {
  compareSuggestions,
  getSuggestionBotUpside,
  type ScannerSortKey,
  type SortDirection,
} from "@/lib/engines/bot-valuation";
import { buildProjectionPathForForecast } from "@/lib/engines/price-forecast";
import {
  canSliceCachedSeries,
  chartRangeUsesIntraday,
  chartSeriesCacheKey,
  getYahooFetchParams,
  sliceSeriesByRange,
  type ChartRange,
} from "@/lib/stocks/chart-range";
import { fetchAllSparkSeries, fetchSparkSeries } from "@/lib/stocks/yahoo-finance";
import type {
  BuyTimingRating,
  ForecastHorizon,
  MarketId,
  SparkSeries,
} from "@/lib/types/stocks";
import { useWatchlist } from "@/lib/hooks/use-watchlist";
import { BotConsensusBadge, BotIconRow } from "@/components/stocks/bot-ui";
import { StockDetailPanel } from "@/components/stocks/stock-detail-panel";
import { ScannerFilters } from "@/components/stocks/scanner-filters";
import { Dialog } from "@/components/ui/dialog";
import { SignedValue } from "@/components/stocks/signed-value";

const RATING_CLASSES: Record<BuyTimingRating, string> = {
  "strong-buy": "border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
  "good-entry": "border-secondary/40 bg-secondary/20 text-secondary-foreground",
  watch: "border-chart-2/40 bg-chart-2/15 text-chart-2",
  wait: "border-border bg-muted-surface/40 text-muted-foreground",
};

const RATING_SHORT_LABELS: Record<BuyTimingRating, string> = {
  "strong-buy": "Strong buy",
  "good-entry": "Good entry",
  watch: "Watch",
  wait: "Wait",
};

function RatingBadge({
  rating,
  compact = false,
}: {
  rating: BuyTimingRating;
  compact?: boolean;
}) {
  const label = compact ? RATING_SHORT_LABELS[rating] : RATING_SHORT_LABELS[rating];

  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium leading-none ${RATING_CLASSES[rating]}`}
      style={rating === "strong-buy" ? { color: "#34d399" } : undefined}
    >
      {label}
    </span>
  );
}

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

export function BuyTimingWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMarket = searchParams.get("market");
  const [marketId, setMarketId] = useState<MarketId>(
    isMarketId(initialMarket) ? initialMarket : "asx200",
  );
  const market = MARKETS[marketId];

  const [suggestions, setSuggestions] = useState<
    ReturnType<typeof rankBuyTimingSuggestions>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [minScore, setMinScore] = useState(35);
  const [minBullishBots, setMinBullishBots] = useState(0);
  const [detailSymbol, setDetailSymbol] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [seriesCache, setSeriesCache] = useState<Record<string, SparkSeries>>({});
  const [chartSeriesCache, setChartSeriesCache] = useState<Record<string, SparkSeries>>({});
  const [detailChartSeries, setDetailChartSeries] = useState<SparkSeries | undefined>();
  const [chartSeriesLoading, setChartSeriesLoading] = useState(false);
  const [chartRange, setChartRange] = useState<ChartRange>("1y");
  const [chartHorizon, setChartHorizon] = useState<ForecastHorizon>("20d");
  const [sortKey, setSortKey] = useState<ScannerSortKey>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const { addSymbol, hasSymbol, removeSymbol, entries } = useWatchlist();
  const [watchlistBusy, setWatchlistBusy] = useState(false);

  const sectors = useMemo(
    () => [...new Set(market.stocks.map((s) => s.sector))].sort(),
    [market],
  );

  const selectMarket = useCallback(
    (nextMarketId: MarketId) => {
      setMarketId(nextMarketId);
      setSectorFilter("all");
      setDetailSymbol(null);
      setSuggestions([]);
      router.replace(`/stocks/buy-timing?market=${nextMarketId}`, {
        scroll: false,
      });
    },
    [router],
  );

  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const symbols = getMarketSymbols(marketId);
      const series = await fetchAllSparkSeries(symbols, market);
      const cache: Record<string, SparkSeries> = {};
      for (const item of series) cache[item.symbol] = item;
      setSeriesCache(cache);
      const ranked = rankBuyTimingSuggestions(series, marketId);
      setSuggestions(ranked);
      setLastUpdated(new Date());
    } catch (err) {
      setSuggestions([]);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load market data. Try again shortly.",
      );
    } finally {
      setLoading(false);
    }
  }, [market, marketId]);

  useEffect(() => {
    void loadSuggestions();
  }, [loadSuggestions]);

  const filtered = useMemo(() => {
    return suggestions.filter((item) => {
      if (item.score < minScore) return false;
      if (sectorFilter !== "all" && item.sector !== sectorFilter) return false;
      if (
        minBullishBots > 0 &&
        (item.consensus?.bullishCount ?? 0) < minBullishBots
      ) {
        return false;
      }
      return true;
    });
  }, [suggestions, minScore, sectorFilter, minBullishBots]);

  const sorted = useMemo(() => {
    const items = [...filtered];
    items.sort((left, right) =>
      compareSuggestions(left, right, sortKey, chartHorizon, sortDirection),
    );
    return items;
  }, [filtered, sortKey, sortDirection, chartHorizon]);

  const detailStock = detailSymbol
    ? suggestions.find((s) => s.symbol === detailSymbol)
    : undefined;
  const detailHorizonForecast = detailStock?.forecast?.consensus.find(
    (item) => item.horizon === chartHorizon,
  );
  const detailProjectionPath =
    detailStock && detailChartSeries && detailHorizonForecast && !chartRangeUsesIntraday(chartRange)
      ? buildProjectionPathForForecast(
          detailStock.price,
          detailChartSeries.closes,
          detailHorizonForecast,
        )
      : undefined;
  const detailOnWatchlist =
    detailStock != null && hasSymbol(marketId, detailStock.symbol);
  const detailWatchlistId = detailStock
    ? entries.find(
        (entry) =>
          entry.marketId === marketId && entry.symbol === detailStock.symbol,
      )?.id
    : undefined;

  useEffect(() => {
    if (!detailStock) {
      setDetailChartSeries(undefined);
      return;
    }

    const cacheKey = chartSeriesCacheKey(detailStock.symbol, chartRange);
    const cached = chartSeriesCache[cacheKey];
    if (cached) {
      setDetailChartSeries(cached);
      return;
    }

    const baseSeries = seriesCache[detailStock.symbol];
    if (baseSeries && canSliceCachedSeries(chartRange)) {
      const sliced = sliceSeriesByRange(baseSeries, chartRange);
      setChartSeriesCache((current) => ({ ...current, [cacheKey]: sliced }));
      setDetailChartSeries(sliced);
      return;
    }

    let cancelled = false;
    setChartSeriesLoading(true);

    const { range, interval, minPoints } = getYahooFetchParams(chartRange);
    void fetchSparkSeries([detailStock.symbol], market, range, interval, minPoints)
      .then((rows) => {
        if (cancelled) return;
        const fetched = rows[0];
        if (fetched) {
          setChartSeriesCache((current) => ({ ...current, [cacheKey]: fetched }));
          setDetailChartSeries(fetched);
        } else if (baseSeries) {
          setDetailChartSeries(sliceSeriesByRange(baseSeries, "1y"));
        }
      })
      .catch(() => {
        if (!cancelled && baseSeries) {
          setDetailChartSeries(sliceSeriesByRange(baseSeries, "1y"));
        }
      })
      .finally(() => {
        if (!cancelled) setChartSeriesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [detailStock, chartRange, market, seriesCache, chartSeriesCache]);

  const handleWatchlistToggle = async () => {
    if (!detailStock) return;
    setWatchlistBusy(true);
    try {
      if (detailOnWatchlist && detailWatchlistId) {
        await removeSymbol(detailWatchlistId);
      } else {
        await addSymbol({
          marketId,
          symbol: detailStock.symbol,
          addedPrice: detailStock.price,
        });
      }
    } finally {
      setWatchlistBusy(false);
    }
  };

  const openDetail = (symbol: string) => {
    setDetailSymbol(symbol);
    setChartHorizon("20d");
    setChartRange("1y");
  };

  const closeDetail = () => setDetailSymbol(null);

  const strongCount = suggestions.filter((s) => s.rating === "strong-buy").length;
  const goodCount = suggestions.filter((s) => s.rating === "good-entry").length;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[min(100%,1800px)] flex-1 flex-col gap-6 px-4 py-8 lg:px-8">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          {market.label}
        </p>
        <h1 className="text-3xl font-bold text-foreground">Buy Timing Scanner</h1>
        <p className="max-w-3xl text-muted">
          Scans {market.label} stocks with technical analysis and four independent
          trading bots (technical, momentum, mean reversion, ML). When multiple bots
          agree, consensus is stronger. Not financial advice.
        </p>

        <div className="flex flex-wrap gap-2">
          {MARKET_IDS.map((id) => {
            const option = getMarket(id);
            const active = id === marketId;

            return (
              <button
                key={id}
                type="button"
                onClick={() => selectMarket(id)}
                disabled={loading && active}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
          <span>{market.stocks.length} stocks tracked</span>
          {lastUpdated && (
            <span>· Updated {lastUpdated.toLocaleTimeString(market.locale)}</span>
          )}
          {!loading && suggestions.length > 0 && (
            <span>
              · {strongCount} strong · {goodCount} good entry
            </span>
          )}
          <button
            type="button"
            onClick={() => void loadSuggestions()}
            disabled={loading}
            className="rounded-md border border-primary/40 px-3 py-1 text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            {loading ? "Scanning…" : "Refresh scan"}
          </button>
        </div>
      </header>

      <ScannerFilters
        sectors={sectors}
        sectorFilter={sectorFilter}
        onSectorFilterChange={setSectorFilter}
        minScore={minScore}
        onMinScoreChange={setMinScore}
        minBullishBots={minBullishBots}
        onMinBullishBotsChange={setMinBullishBots}
        sortKey={sortKey}
        onSortKeyChange={setSortKey}
        sortDirection={sortDirection}
        onSortDirectionChange={setSortDirection}
      />

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && suggestions.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-24 text-muted">
          Scanning {market.label} price history…
        </div>
      ) : (
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Stock</th>
                  <th className="whitespace-nowrap px-4 py-3">Price</th>
                  <th className="whitespace-nowrap px-4 py-3">Bot upside</th>
                  <th className="whitespace-nowrap px-4 py-3">Score</th>
                  <th className="min-w-[7.5rem] whitespace-nowrap px-4 py-3">
                    Rating
                  </th>
                  <th className="whitespace-nowrap px-4 py-3">Bots</th>
                  <th className="whitespace-nowrap px-4 py-3">Consensus</th>
                  <th className="whitespace-nowrap px-4 py-3">1M est.</th>
                  <th className="whitespace-nowrap px-4 py-3">RSI</th>
                  <th className="whitespace-nowrap px-4 py-3">5d</th>
                  <th className="whitespace-nowrap px-4 py-3">20d</th>
                  <th className="whitespace-nowrap px-4 py-3">52w range</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((item) => {
                  const active = detailSymbol === item.symbol;
                  const botUpside = getSuggestionBotUpside(item, "20d");

                  return (
                    <tr
                      key={item.symbol}
                      onClick={() => openDetail(item.symbol)}
                      className={`cursor-pointer border-b border-border/60 transition-colors ${
                        active ? "bg-primary/10" : "hover:bg-accent"
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="font-medium text-foreground">{item.symbol}</div>
                        <div className="max-w-[12rem] truncate text-xs text-muted">
                          {item.name}
                        </div>
                        <div className="text-xs text-muted">{item.sector}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono">
                        {formatPrice(item.price, item.currency, market.locale)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                        <SignedValue value={botUpside?.upsidePct}>
                          {formatPct(botUpside?.upsidePct ?? null)}
                        </SignedValue>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs">{item.score}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <RatingBadge rating={item.rating} compact />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <BotIconRow results={item.consensus?.results ?? []} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <BotConsensusBadge consensus={item.consensus} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                        <SignedValue
                          value={
                            item.forecast?.consensus.find((f) => f.horizon === "20d")
                              ?.expectedReturnPct
                          }
                        >
                          {formatPct(
                            item.forecast?.consensus.find((f) => f.horizon === "20d")
                              ?.expectedReturnPct ?? null,
                          )}
                        </SignedValue>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                        {item.signals.rsi14?.toFixed(0) ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                        <SignedValue value={item.signals.return5d}>
                          {formatPct(item.signals.return5d)}
                        </SignedValue>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                        <SignedValue value={item.signals.return20d}>
                          {formatPct(item.signals.return20d)}
                        </SignedValue>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">
                        {item.signals.rangePosition != null
                          ? `${item.signals.rangePosition.toFixed(0)}%`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {sorted.length === 0 && !loading && (
            <p className="px-4 py-8 text-center text-sm text-muted">
              No stocks match your filters. Try lowering the minimum score.
            </p>
          )}
          {sorted.length > 0 && !detailSymbol && (
            <p className="border-t border-border px-4 py-3 text-center text-xs text-muted">
              Click a row to view charts, forecasts, and bot breakdown.
            </p>
          )}
        </section>
      )}

      <Dialog
        open={detailStock != null}
        onClose={closeDetail}
        title={detailStock ? `${detailStock.symbol} · ${detailStock.name}` : ""}
        description={
          detailStock
            ? `${detailStock.sector} · ${market.label}`
            : undefined
        }
        className="max-w-5xl"
      >
        {detailStock && (
          <StockDetailPanel
            stock={detailStock}
            locale={market.locale}
            series={detailChartSeries}
            chartRange={chartRange}
            onChartRangeChange={setChartRange}
            chartHorizon={chartHorizon}
            onChartHorizonChange={setChartHorizon}
            chartProjectionPath={detailProjectionPath}
            chartLoading={chartSeriesLoading}
            onWatchlistToggle={() => void handleWatchlistToggle()}
            watchlistBusy={watchlistBusy}
            onWatchlist={detailOnWatchlist}
          />
        )}
      </Dialog>
    </div>
  );
}

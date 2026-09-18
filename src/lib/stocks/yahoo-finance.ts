import type { SparkSeries } from "@/lib/types/stocks";
import { fromYahooSymbol, toYahooSymbol } from "@/data/markets";
import type { MarketDefinition } from "@/lib/types/stocks";

const CHART_CONCURRENCY = 8;

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta: {
        currency: string;
        symbol: string;
        regularMarketPrice: number;
        fiftyTwoWeekHigh?: number;
        fiftyTwoWeekLow?: number;
        longName?: string;
        shortName?: string;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
          high?: Array<number | null>;
        }>;
      };
    }>;
    error?: { code: string; description: string } | null;
  };
}

function getMarketApiBase(): string {
  if (typeof window === "undefined") return "/api/market";
  return `${window.location.origin}/api/market`;
}

async function runPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R | null>,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function runWorker() {
    while (index < items.length) {
      const item = items[index++];
      const result = await worker(item);
      if (result != null) results.push(result);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, runWorker),
  );

  return results;
}

async function fetchChartSeries(
  symbol: string,
  market: MarketDefinition,
  range: string,
  interval: string,
  minPoints: number,
): Promise<SparkSeries | null> {
  const yahooSymbol = toYahooSymbol(symbol, market);
  const url = `${getMarketApiBase()}/chart/${encodeURIComponent(yahooSymbol)}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const data = (await res.json()) as YahooChartResponse & { error?: string };

  if (!res.ok) {
    const detail =
      data.chart?.error?.description ?? data.error ?? `HTTP ${res.status}`;
    throw new Error(`Market chart request failed: ${detail}`);
  }

  if (data.chart?.error) {
    throw new Error(data.chart.error.description ?? "Market chart error");
  }

  const result = data.chart?.result?.[0];
  if (!result?.meta) return null;

  const rawCloses = result.indicators?.quote?.[0]?.close ?? [];
  const rawHighs = result.indicators?.quote?.[0]?.high ?? [];
  const rawTimestamps = result.timestamp ?? [];
  const pairs: { close: number; high: number; timestamp: number }[] = [];

  for (let i = 0; i < rawCloses.length; i++) {
    const close = rawCloses[i];
    const high = rawHighs[i];
    const timestamp = rawTimestamps[i];
    if (
      typeof close !== "number" ||
      close <= 0 ||
      typeof timestamp !== "number"
    ) {
      continue;
    }

    const resolvedHigh =
      typeof high === "number" && high > 0 ? Math.max(high, close) : close;
    pairs.push({ close, high: resolvedHigh, timestamp });
  }

  if (pairs.length < minPoints) return null;

  return {
    symbol: fromYahooSymbol(result.meta.symbol || yahooSymbol, market),
    meta: {
      currency: result.meta.currency,
      symbol: result.meta.symbol,
      regularMarketPrice: result.meta.regularMarketPrice,
      fiftyTwoWeekHigh: result.meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: result.meta.fiftyTwoWeekLow,
      longName: result.meta.longName,
      shortName: result.meta.shortName,
    },
    closes: pairs.map((pair) => pair.close),
    highs: pairs.map((pair) => pair.high),
    timestamps: pairs.map((pair) => pair.timestamp),
  };
}

export async function fetchSparkSeries(
  symbols: string[],
  market: MarketDefinition,
  range = "1y",
  interval = "1d",
  minPoints = 30,
): Promise<SparkSeries[]> {
  if (symbols.length === 0) return [];

  return runPool(symbols, CHART_CONCURRENCY, (symbol) =>
    fetchChartSeries(symbol, market, range, interval, minPoints).catch(() => null),
  );
}

export async function fetchAllSparkSeries(
  symbols: string[],
  market: MarketDefinition,
  range = "1y",
): Promise<SparkSeries[]> {
  return fetchSparkSeries(symbols, market, range);
}

import type { SparkSeries } from "@/lib/types/stocks";
import { fromYahooSymbol, toYahooSymbol } from "@/data/markets";
import type { MarketDefinition } from "@/lib/types/stocks";

const SPARK_BATCH_SIZE = 20;
const FETCH_CONCURRENCY = 3;

interface YahooSparkResponse {
  spark?: {
    result?: Array<{
      symbol: string;
      response?: Array<{
        meta: {
          currency: string;
          symbol: string;
          regularMarketPrice: number;
          fiftyTwoWeekHigh?: number;
          fiftyTwoWeekLow?: number;
          longName?: string;
          shortName?: string;
        };
        indicators?: {
          quote?: Array<{
            close?: Array<number | null>;
          }>;
        };
        timestamp?: number[];
      }>;
    }>;
    error?: { code: string; description: string } | null;
  };
}

function getMarketApiBase(): string {
  if (typeof window === "undefined") return "/api/market";
  return `${window.location.origin}/api/market`;
}

export async function fetchSparkSeries(
  symbols: string[],
  market: MarketDefinition,
  range = "1y",
  interval = "1d",
  minPoints = 30,
): Promise<SparkSeries[]> {
  if (symbols.length === 0) return [];

  const yahooSymbols = symbols
    .map((symbol) => toYahooSymbol(symbol, market))
    .join(",");
  const url = `${getMarketApiBase()}/spark?symbols=${encodeURIComponent(yahooSymbols)}&range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const data = (await res.json()) as YahooSparkResponse & {
    error?: string;
  };

  if (!res.ok) {
    const detail =
      data.spark?.error?.description ??
      data.error ??
      `HTTP ${res.status}`;
    throw new Error(`Market data request failed: ${detail}`);
  }

  if (data.spark?.error) {
    throw new Error(data.spark.error.description ?? "Market data error");
  }

  const results: SparkSeries[] = [];

  for (const entry of data.spark?.result ?? []) {
    const response = entry.response?.[0];
    if (!response?.meta) continue;

    const rawCloses = response.indicators?.quote?.[0]?.close ?? [];
    const rawTimestamps = response.timestamp ?? [];
    const pairs: { close: number; timestamp: number }[] = [];

    for (let i = 0; i < rawCloses.length; i++) {
      const close = rawCloses[i];
      const timestamp = rawTimestamps[i];
      if (typeof close === "number" && close > 0 && typeof timestamp === "number") {
        pairs.push({ close, timestamp });
      }
    }

    if (pairs.length < minPoints) continue;

    results.push({
      symbol: fromYahooSymbol(entry.symbol, market),
      meta: response.meta,
      closes: pairs.map((pair) => pair.close),
      timestamps: pairs.map((pair) => pair.timestamp),
    });
  }

  return results;
}

async function runBatchesInPool<T>(
  batches: string[][],
  concurrency: number,
  worker: (batch: string[]) => Promise<T[]>,
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function runWorker() {
    while (index < batches.length) {
      const batchIndex = index++;
      const batchResults = await worker(batches[batchIndex]);
      results.push(...batchResults);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, batches.length) }, runWorker),
  );

  return results;
}

export async function fetchAllSparkSeries(
  symbols: string[],
  market: MarketDefinition,
  range = "1y",
): Promise<SparkSeries[]> {
  const batches: string[][] = [];
  for (let i = 0; i < symbols.length; i += SPARK_BATCH_SIZE) {
    batches.push(symbols.slice(i, i + SPARK_BATCH_SIZE));
  }

  return runBatchesInPool(batches, FETCH_CONCURRENCY, (batch) =>
    fetchSparkSeries(batch, market, range),
  );
}

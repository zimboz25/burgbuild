import type { SparkSeries } from "@/lib/types/stocks";

export type ChartRange = "1d" | "1w" | "1m" | "ytd" | "1y" | "3y";

export const CHART_RANGE_OPTIONS: { id: ChartRange; label: string }[] = [
  { id: "1d", label: "1D" },
  { id: "1w", label: "1W" },
  { id: "1m", label: "1M" },
  { id: "ytd", label: "YTD" },
  { id: "1y", label: "1Y" },
  { id: "3y", label: "3Y" },
];

export function getYahooFetchParams(
  range: ChartRange,
): { range: string; interval: string; minPoints: number } {
  switch (range) {
    case "1d":
      return { range: "1d", interval: "5m", minPoints: 12 };
    case "1w":
      return { range: "5d", interval: "15m", minPoints: 12 };
    case "1m":
      return { range: "1mo", interval: "1d", minPoints: 10 };
    case "ytd":
      return { range: "ytd", interval: "1d", minPoints: 10 };
    case "1y":
      return { range: "1y", interval: "1d", minPoints: 30 };
    case "3y":
      return { range: "3y", interval: "1d", minPoints: 30 };
  }
}

export function chartRangeUsesIntraday(range: ChartRange): boolean {
  return range === "1d" || range === "1w";
}

export function canSliceCachedSeries(range: ChartRange): boolean {
  return range === "1m" || range === "ytd" || range === "1y";
}

export function sliceSeriesByRange(
  series: SparkSeries,
  range: ChartRange,
): SparkSeries {
  if (range === "1y") return series;

  const cutoff = getRangeCutoffTimestamp(range);
  const pairs = series.timestamps
    .map((timestamp, index) => ({
      timestamp,
      close: series.closes[index],
    }))
    .filter((point) => point.timestamp >= cutoff);

  if (pairs.length === 0) return series;

  return {
    ...series,
    closes: pairs.map((point) => point.close),
    timestamps: pairs.map((point) => point.timestamp),
  };
}

function getRangeCutoffTimestamp(range: ChartRange): number {
  const now = Date.now();

  switch (range) {
    case "1m": {
      const date = new Date(now);
      date.setMonth(date.getMonth() - 1);
      return Math.floor(date.getTime() / 1000);
    }
    case "ytd": {
      const year = new Date(now).getFullYear();
      return Math.floor(new Date(year, 0, 1).getTime() / 1000);
    }
    default:
      return 0;
  }
}

export function chartSeriesCacheKey(symbol: string, range: ChartRange): string {
  return `${symbol}:${range}`;
}

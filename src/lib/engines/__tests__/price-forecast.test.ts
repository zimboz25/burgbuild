import { describe, expect, it } from "vitest";
import { buildConsensus, runAllBots } from "@/lib/engines/bots/consensus";
import {
  buildForecastOutlook,
  buildProjectionPathForForecast,
} from "@/lib/engines/price-forecast";
import type { SparkSeries } from "@/lib/types/stocks";

function makeRisingCloses(length: number, start = 50): number[] {
  return Array.from({ length }, (_, i) => start + i * 0.5);
}

function makeTimestamps(count: number): number[] {
  const day = 86_400;
  const now = Math.floor(Date.now() / 1000);
  return Array.from({ length: count }, (_, index) => now - (count - 1 - index) * day);
}

function makeSeries(closes: number[]): SparkSeries {
  return {
    symbol: "TEST",
    meta: {
      currency: "USD",
      symbol: "TEST",
      regularMarketPrice: closes[closes.length - 1],
      fiftyTwoWeekLow: Math.min(...closes),
      fiftyTwoWeekHigh: Math.max(...closes),
    },
    closes,
    timestamps: makeTimestamps(closes.length),
  };
}

describe("buildForecastOutlook", () => {
  it("returns forecasts for all horizons and bots", () => {
    const series = makeSeries(makeRisingCloses(260, 80));
    const consensus = buildConsensus(runAllBots(series));
    const outlook = buildForecastOutlook(series, consensus);

    expect(outlook.consensus).toHaveLength(3);
    expect(outlook.byBot).toHaveLength(4);
    expect(outlook.projectionPath.length).toBeGreaterThan(30);
  });

  it("returns valid month forecast on rising series", () => {
    const series = makeSeries(makeRisingCloses(260, 80));
    const consensus = buildConsensus(runAllBots(series));
    const outlook = buildForecastOutlook(series, consensus);
    const month = outlook.consensus.find((item) => item.horizon === "20d");

    expect(month).toBeDefined();
    expect(month!.highPrice).toBeGreaterThan(month!.lowPrice);
    expect(month!.expectedPrice).toBeGreaterThan(0);
  });

  it("builds projection path for selected horizon", () => {
    const series = makeSeries(makeRisingCloses(260, 80));
    const consensus = buildConsensus(runAllBots(series));
    const outlook = buildForecastOutlook(series, consensus);
    const week = outlook.consensus.find((item) => item.horizon === "5d")!;

    const path = buildProjectionPathForForecast(
      outlook.currentPrice,
      series.closes,
      week,
    );

    expect(path.length).toBe(35);
    expect(path.at(-1)).toBeGreaterThan(0);
  });
});

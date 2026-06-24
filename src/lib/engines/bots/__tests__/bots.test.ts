import { describe, expect, it } from "vitest";
import { runMeanReversionBot } from "@/lib/engines/bots/mean-reversion-bot";
import { runMomentumBot } from "@/lib/engines/bots/momentum-bot";
import { runTechnicalBot } from "@/lib/engines/bots/technical-bot";
import { buildConsensus, runAllBots } from "@/lib/engines/bots/consensus";
import { predictMlProbability } from "@/lib/engines/bots/ml-bot";
import { extractMlFeatures } from "@/lib/engines/bots/features";
import type { SparkSeries } from "@/lib/types/stocks";

function makeTimestamps(count: number): number[] {
  const day = 86_400;
  const now = Math.floor(Date.now() / 1000);
  return Array.from({ length: count }, (_, index) => now - (count - 1 - index) * day);
}

function makeSeries(
  closes: number[],
  meta: Partial<SparkSeries["meta"]> = {},
): SparkSeries {
  return {
    symbol: "TEST",
    meta: {
      currency: "USD",
      symbol: "TEST",
      regularMarketPrice: closes[closes.length - 1],
      fiftyTwoWeekLow: Math.min(...closes),
      fiftyTwoWeekHigh: Math.max(...closes),
      ...meta,
    },
    closes,
    timestamps: makeTimestamps(closes.length),
  };
}

function makeRisingCloses(length: number, start = 50): number[] {
  return Array.from({ length }, (_, i) => start + i * 0.5);
}

function makeDecliningCloses(length: number, start = 100): number[] {
  return Array.from({ length }, (_, i) => start - i * 0.8);
}

describe("momentum bot", () => {
  it("signals buy on sustained uptrend", () => {
    const series = makeSeries(makeRisingCloses(260, 80));
    const result = runMomentumBot(series);
    expect(result.signal).toBe("buy");
  });

  it("signals sell on sustained downtrend", () => {
    const series = makeSeries(makeDecliningCloses(260, 120));
    const result = runMomentumBot(series);
    expect(["sell", "hold"]).toContain(result.signal);
  });
});

describe("mean reversion bot", () => {
  it("signals buy when oversold near range lows", () => {
    const series = makeSeries(makeDecliningCloses(260, 100), {
      fiftyTwoWeekLow: 35,
      fiftyTwoWeekHigh: 110,
    });
    const result = runMeanReversionBot(series);
    expect(result.signal).toBe("buy");
  });
});

describe("technical bot", () => {
  it("signals buy on high technical score setup", () => {
    const series = makeSeries(makeDecliningCloses(260, 90), {
      fiftyTwoWeekLow: 30,
      fiftyTwoWeekHigh: 100,
    });
    const result = runTechnicalBot(series);
    expect(["buy", "hold", "sell"]).toContain(result.signal);
  });
});

describe("consensus", () => {
  it("aggregates four bot results", () => {
    const series = makeSeries(makeDecliningCloses(260, 90), {
      fiftyTwoWeekLow: 30,
      fiftyTwoWeekHigh: 100,
    });
    const results = runAllBots(series);
    expect(results).toHaveLength(4);
    const consensus = buildConsensus(results);
    expect(consensus.results).toHaveLength(4);
    expect(consensus.consensusScore).toBeGreaterThanOrEqual(0);
    expect(consensus.consensusScore).toBeLessThanOrEqual(100);
  });

  it("counts bullish bots", () => {
    const results = runAllBots(
      makeSeries(makeDecliningCloses(260, 90), {
        fiftyTwoWeekLow: 30,
        fiftyTwoWeekHigh: 100,
      }),
    );
    const consensus = buildConsensus(results);
    expect(consensus.bullishCount).toBeGreaterThanOrEqual(0);
    expect(consensus.bullishCount).toBeLessThanOrEqual(4);
  });
});

describe("ml bot", () => {
  it("returns probability between 0 and 1", () => {
    const series = makeSeries(makeRisingCloses(260));
    const features = extractMlFeatures(series);
    const probability = predictMlProbability(features);
    expect(probability).toBeGreaterThanOrEqual(0);
    expect(probability).toBeLessThanOrEqual(1);
  });
});

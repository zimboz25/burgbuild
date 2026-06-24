import { describe, expect, it } from "vitest";
import {
  analyzeTechnicalSignals,
  buildBuyTimingSuggestion,
  computeMacd,
  computeRsi,
  rankBuyTimingSuggestions,
  scoreBuyTiming,
} from "@/lib/engines/buy-timing";
import type { SparkSeries } from "@/lib/types/stocks";

function makeDecliningCloses(length: number, start = 100): number[] {
  return Array.from({ length }, (_, i) => start - i * 0.8);
}

function makeRisingCloses(length: number, start = 50): number[] {
  return Array.from({ length }, (_, i) => start + i * 0.5);
}

describe("computeRsi", () => {
  it("returns high RSI for steadily rising prices", () => {
    const closes = makeRisingCloses(30);
    const rsi = computeRsi(closes);
    expect(rsi).not.toBeNull();
    expect(rsi!).toBeGreaterThan(60);
  });

  it("returns low RSI for steadily falling prices", () => {
    const closes = makeDecliningCloses(30);
    const rsi = computeRsi(closes);
    expect(rsi).not.toBeNull();
    expect(rsi!).toBeLessThan(40);
  });
});

describe("computeMacd", () => {
  it("returns macd values for sufficient history", () => {
    const closes = makeRisingCloses(60);
    const macd = computeMacd(closes);
    expect(macd).not.toBeNull();
    expect(macd!.histogram).toBeTypeOf("number");
  });
});

describe("scoreBuyTiming", () => {
  it("scores oversold near-range-low setups higher", () => {
    const signals = analyzeTechnicalSignals(makeDecliningCloses(260, 120), {
      currency: "AUD",
      symbol: "BHP.AX",
      regularMarketPrice: 55,
      fiftyTwoWeekLow: 50,
      fiftyTwoWeekHigh: 120,
    });

    const { score, reasons } = scoreBuyTiming(55, signals);
    expect(score).toBeGreaterThanOrEqual(40);
    expect(reasons.length).toBeGreaterThan(0);
  });
});

function makeTimestamps(count: number): number[] {
  const day = 86_400;
  const now = Math.floor(Date.now() / 1000);
  return Array.from({ length: count }, (_, index) => now - (count - 1 - index) * day);
}

describe("buildBuyTimingSuggestion", () => {
  it("builds a ranked suggestion for known ASX symbols", () => {
    const closes = makeDecliningCloses(260, 65);
    const series: SparkSeries = {
      symbol: "BHP",
      meta: {
        currency: "AUD",
        symbol: "BHP.AX",
        regularMarketPrice: 58,
        fiftyTwoWeekLow: 35,
        fiftyTwoWeekHigh: 66,
        longName: "BHP Group Limited",
      },
      closes,
      timestamps: makeTimestamps(closes.length),
    };

    const suggestion = buildBuyTimingSuggestion(series, "asx200");
    expect(suggestion).not.toBeNull();
    expect(suggestion!.symbol).toBe("BHP");
    expect(suggestion!.score).toBeGreaterThanOrEqual(0);
    expect(suggestion!.score).toBeLessThanOrEqual(100);
  });

  it("ranks higher-scoring suggestions first", () => {
    const oversoldCloses = makeDecliningCloses(260, 70);
    const expensiveCloses = makeRisingCloses(260, 140);
    const oversold: SparkSeries = {
      symbol: "BHP",
      meta: {
        currency: "AUD",
        symbol: "BHP.AX",
        regularMarketPrice: 40,
        fiftyTwoWeekLow: 35,
        fiftyTwoWeekHigh: 70,
      },
      closes: oversoldCloses,
      timestamps: makeTimestamps(oversoldCloses.length),
    };

    const expensive: SparkSeries = {
      symbol: "CBA",
      meta: {
        currency: "AUD",
        symbol: "CBA.AX",
        regularMarketPrice: 190,
        fiftyTwoWeekLow: 140,
        fiftyTwoWeekHigh: 195,
      },
      closes: expensiveCloses,
      timestamps: makeTimestamps(expensiveCloses.length),
    };

    const ranked = rankBuyTimingSuggestions([expensive, oversold], "asx200");
    expect(ranked[0].symbol).toBe("BHP");
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
  });
});

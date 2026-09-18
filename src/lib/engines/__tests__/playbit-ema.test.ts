import { describe, expect, it } from "vitest";
import {
  analyzePlayBitChannel,
  regimeFromClose,
} from "@/lib/engines/playbit-ema";
import type { SparkSeries } from "@/lib/types/stocks";

function makeTimestamps(count: number): number[] {
  const day = 86_400;
  const now = Math.floor(Date.now() / 1000);
  return Array.from({ length: count }, (_, index) => now - (count - 1 - index) * day);
}

function makeSeries(closes: number[], highs?: number[]): SparkSeries {
  return {
    symbol: "PB",
    meta: {
      currency: "USD",
      symbol: "PB",
      regularMarketPrice: closes[closes.length - 1],
    },
    closes,
    highs: highs ?? closes.map((close) => close * 1.01),
    timestamps: makeTimestamps(closes.length),
  };
}

describe("playbit ema", () => {
  it("classifies regimes from close vs EMA channel", () => {
    expect(regimeFromClose(110, 100, 95)).toBe("above");
    expect(regimeFromClose(90, 100, 95)).toBe("below");
    expect(regimeFromClose(97, 100, 95)).toBe("inside");
  });

  it("detects above-channel regime on a strong uptrend", () => {
    const closes = Array.from({ length: 260 }, (_, i) => 50 + i * 0.4);
    const highs = closes.map((close) => close * 1.008);
    const analysis = analyzePlayBitChannel(makeSeries(closes, highs));
    expect(analysis).not.toBeNull();
    expect(analysis!.regime).toBe("above");
    expect(analysis!.emaHigh).toBeGreaterThan(analysis!.emaClose);
  });

  it("detects below-channel regime on a strong downtrend", () => {
    const closes = Array.from({ length: 260 }, (_, i) => 180 - i * 0.5);
    const highs = closes.map((close) => close * 1.004);
    const analysis = analyzePlayBitChannel(makeSeries(closes, highs));
    expect(analysis).not.toBeNull();
    expect(analysis!.regime).toBe("below");
  });
});

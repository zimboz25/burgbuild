import { describe, expect, it } from "vitest";
import {
  compareSuggestions,
  getBotAverageValuation,
} from "@/lib/engines/bot-valuation";
import type { BotId, ForecastHorizon } from "@/lib/types/stocks";

function makeOutlook(currentPrice: number, botPrices: number[]): ForecastOutlook {
  return {
    currentPrice,
    consensus: [],
    byBot: botPrices.map((expectedPrice, index) => ({
      botId: (["technical", "momentum", "mean-reversion", "ml"] as BotId[])[index],
      botName: `Bot ${index + 1}`,
      horizons: [
        {
          horizon: "20d",
          horizonLabel: "1 month",
          tradingDays: 20,
          expectedReturnPct: ((expectedPrice - currentPrice) / currentPrice) * 100,
          lowReturnPct: 0,
          highReturnPct: 0,
          expectedPrice,
          lowPrice: expectedPrice * 0.95,
          highPrice: expectedPrice * 1.05,
          confidence: 0.7,
          direction: expectedPrice >= currentPrice ? "up" : "down",
        },
      ],
    })),
    projectionPath: [currentPrice],
  };
}

describe("getBotAverageValuation", () => {
  it("computes average bot target and upside", () => {
    const valuation = getBotAverageValuation(makeOutlook(100, [110, 108, 112, 106]), "20d");

    expect(valuation).not.toBeNull();
    expect(valuation!.avgExpectedPrice).toBeCloseTo(109, 5);
    expect(valuation!.upsidePct).toBeCloseTo(9, 5);
    expect(valuation!.botCount).toBe(4);
  });
});

describe("compareSuggestions", () => {
  it("sorts by bot upside when requested", () => {
    const cheap: BuyTimingSuggestion = {
      marketId: "asx200",
      symbol: "AAA",
      yahooSymbol: "AAA.AX",
      name: "AAA",
      sector: "Tech",
      price: 100,
      currency: "AUD",
      score: 40,
      rating: "watch",
      signals: {
        rsi14: 50,
        sma50: 100,
        sma200: 100,
        macdLine: 0,
        macdSignal: 0,
        macdHistogram: 0,
        fiftyTwoWeekLow: 80,
        fiftyTwoWeekHigh: 120,
        rangePosition: 50,
        return5d: 0,
        return20d: 0,
      },
      reasons: [],
      forecast: makeOutlook(100, [120, 118, 122, 116]),
    };

    const rich: BuyTimingSuggestion = {
      ...cheap,
      symbol: "BBB",
      yahooSymbol: "BBB.AX",
      name: "BBB",
      score: 80,
      forecast: makeOutlook(100, [101, 102, 100, 99]),
    };

    const sorted = [rich, cheap].sort((left, right) =>
      compareSuggestions(left, right, "bot-upside", "20d", "desc"),
    );

    expect(sorted[0].symbol).toBe("AAA");
  });
});

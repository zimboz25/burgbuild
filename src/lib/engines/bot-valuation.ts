import type {
  BuyTimingSuggestion,
  ForecastHorizon,
  ForecastOutlook,
} from "@/lib/types/stocks";

export interface BotAverageValuation {
  horizon: ForecastHorizon;
  avgExpectedPrice: number;
  upsidePct: number;
  botCount: number;
}

export function getBotAverageValuation(
  forecast: ForecastOutlook | undefined,
  horizon: ForecastHorizon = "20d",
): BotAverageValuation | null {
  if (!forecast || forecast.byBot.length === 0) return null;

  const expectedPrices = forecast.byBot
    .map((bot) => bot.horizons.find((item) => item.horizon === horizon)?.expectedPrice)
    .filter((price): price is number => typeof price === "number" && price > 0);

  if (expectedPrices.length === 0) return null;

  const avgExpectedPrice =
    expectedPrices.reduce((sum, price) => sum + price, 0) / expectedPrices.length;
  const upsidePct =
    forecast.currentPrice > 0
      ? ((avgExpectedPrice - forecast.currentPrice) / forecast.currentPrice) * 100
      : 0;

  return {
    horizon,
    avgExpectedPrice,
    upsidePct,
    botCount: expectedPrices.length,
  };
}

export function getSuggestionBotUpside(
  suggestion: BuyTimingSuggestion,
  horizon: ForecastHorizon = "20d",
): BotAverageValuation | null {
  return getBotAverageValuation(suggestion.forecast, horizon);
}

export type ScannerSortKey = "score" | "bot-upside";
export type SortDirection = "asc" | "desc";

function compareAscending(
  left: BuyTimingSuggestion,
  right: BuyTimingSuggestion,
  sortKey: ScannerSortKey,
  horizon: ForecastHorizon = "20d",
): number {
  if (sortKey === "bot-upside") {
    const leftUpside = getSuggestionBotUpside(left, horizon)?.upsidePct ?? -Infinity;
    const rightUpside = getSuggestionBotUpside(right, horizon)?.upsidePct ?? -Infinity;
    if (leftUpside !== rightUpside) return leftUpside - rightUpside;
    return left.score - right.score;
  }

  if (left.score !== right.score) return left.score - right.score;
  return left.symbol.localeCompare(right.symbol);
}

export function compareSuggestions(
  left: BuyTimingSuggestion,
  right: BuyTimingSuggestion,
  sortKey: ScannerSortKey,
  horizon: ForecastHorizon = "20d",
  direction: SortDirection = "desc",
): number {
  const ascending = compareAscending(left, right, sortKey, horizon);
  return direction === "asc" ? ascending : -ascending;
}

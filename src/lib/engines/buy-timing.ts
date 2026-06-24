import type {
  BuyTimingRating,
  BuyTimingSuggestion,
  SparkSeries,
  TechnicalSignals,
} from "@/lib/types/stocks";
import type { MarketId } from "@/lib/types/stocks";
import { getStockBySymbol } from "@/data/markets";
import { analyzeSeriesWithBots } from "@/lib/engines/bots/consensus";
import { buildForecastOutlook } from "@/lib/engines/price-forecast";

export function sma(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((sum, value) => sum + value, 0) / period;
}

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  let prev = values[0];

  for (let i = 0; i < values.length; i++) {
    prev = i === 0 ? values[0] : values[i] * k + prev * (1 - k);
    result.push(prev);
  }

  return result;
}

export function computeRsi(closes: number[], period = 14): number | null {
  if (closes.length <= period) return null;

  let gains = 0;
  let losses = 0;

  for (let i = closes.length - period; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function computeMacd(closes: number[]): {
  line: number;
  signal: number;
  histogram: number;
} | null {
  if (closes.length < 35) return null;

  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((value, index) => value - ema26[index]);
  const signalLine = ema(macdLine, 9);
  const last = macdLine.length - 1;

  return {
    line: macdLine[last],
    signal: signalLine[last],
    histogram: macdLine[last] - signalLine[last],
  };
}

export function pctReturn(closes: number[], days: number): number | null {
  if (closes.length <= days) return null;
  const current = closes[closes.length - 1];
  const prior = closes[closes.length - 1 - days];
  if (prior <= 0) return null;
  return ((current - prior) / prior) * 100;
}

function rangePosition(
  price: number,
  low: number | null | undefined,
  high: number | null | undefined,
): number | null {
  if (low == null || high == null || high <= low) return null;
  return ((price - low) / (high - low)) * 100;
}

function ratingFromScore(score: number): BuyTimingRating {
  if (score >= 70) return "strong-buy";
  if (score >= 50) return "good-entry";
  if (score >= 35) return "watch";
  return "wait";
}

export function analyzeTechnicalSignals(
  closes: number[],
  meta: SparkSeries["meta"],
): TechnicalSignals {
  const price = meta.regularMarketPrice;
  const macd = computeMacd(closes);

  return {
    rsi14: computeRsi(closes),
    sma50: sma(closes, 50),
    sma200: sma(closes, 200),
    macdLine: macd?.line ?? null,
    macdSignal: macd?.signal ?? null,
    macdHistogram: macd?.histogram ?? null,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? null,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? null,
    rangePosition: rangePosition(
      price,
      meta.fiftyTwoWeekLow,
      meta.fiftyTwoWeekHigh,
    ),
    return5d: pctReturn(closes, 5),
    return20d: pctReturn(closes, 20),
  };
}

export function scoreBuyTiming(
  price: number,
  signals: TechnicalSignals,
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (signals.rsi14 != null) {
    if (signals.rsi14 < 30) {
      score += 25;
      reasons.push(`RSI at ${signals.rsi14.toFixed(0)} — oversold territory`);
    } else if (signals.rsi14 < 40) {
      score += 15;
      reasons.push(`RSI at ${signals.rsi14.toFixed(0)} — approaching oversold`);
    } else if (signals.rsi14 < 50) {
      score += 8;
      reasons.push(`RSI at ${signals.rsi14.toFixed(0)} — below neutral`);
    } else if (signals.rsi14 > 70) {
      score -= 10;
      reasons.push(`RSI at ${signals.rsi14.toFixed(0)} — overbought, wait for pullback`);
    }
  }

  if (signals.sma50 != null) {
    const pctBelow = ((signals.sma50 - price) / signals.sma50) * 100;
    if (price < signals.sma50) {
      const pts = Math.min(15, 5 + pctBelow * 2);
      score += pts;
      reasons.push(
        `Trading ${pctBelow.toFixed(1)}% below 50-day average — short-term dip`,
      );
    }
  }

  if (signals.sma200 != null && price < signals.sma200) {
    score += 10;
    const pctBelow =
      ((signals.sma200 - price) / signals.sma200) * 100;
    reasons.push(
      `Below 200-day average (${pctBelow.toFixed(1)}%) — longer-term value zone`,
    );
  }

  if (signals.rangePosition != null) {
    if (signals.rangePosition <= 25) {
      score += 20;
      reasons.push(
        `Near 52-week low (${signals.rangePosition.toFixed(0)}% of range)`,
      );
    } else if (signals.rangePosition <= 45) {
      score += 12;
      reasons.push(
        `Lower half of 52-week range (${signals.rangePosition.toFixed(0)}%)`,
      );
    } else if (signals.rangePosition >= 85) {
      score -= 8;
      reasons.push(
        `Near 52-week high (${signals.rangePosition.toFixed(0)}% of range) — patience advised`,
      );
    }
  }

  if (
    signals.macdHistogram != null &&
    signals.macdLine != null &&
    signals.macdSignal != null
  ) {
    if (signals.macdHistogram > 0 && signals.macdLine > signals.macdSignal) {
      score += 12;
      reasons.push("MACD bullish — upward momentum building");
    } else if (signals.macdHistogram < 0) {
      score -= 5;
    }
  }

  if (signals.return5d != null && signals.return20d != null) {
    if (signals.return5d < -3 && signals.return20d > -8) {
      score += 8;
      reasons.push("Recent pullback within an intact medium-term trend");
    }
    if (signals.return20d < -15 && signals.rangePosition != null && signals.rangePosition < 40) {
      score += 6;
      reasons.push("Extended decline may be nearing exhaustion");
    }
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons,
  };
}

export function buildBuyTimingSuggestion(
  series: SparkSeries,
  marketId: MarketId,
): BuyTimingSuggestion | null {
  const stock = getStockBySymbol(marketId, series.symbol);
  if (!stock) return null;

  const price = series.meta.regularMarketPrice;
  const signals = analyzeTechnicalSignals(series.closes, series.meta);
  const { score, reasons } = scoreBuyTiming(price, signals);

  if (reasons.length === 0) {
    reasons.push("No strong technical buy signals detected right now");
  }

  const consensus = analyzeSeriesWithBots(series);

  return {
    marketId,
    symbol: stock.symbol,
    yahooSymbol: series.meta.symbol,
    name: series.meta.longName ?? stock.name,
    sector: stock.sector,
    price,
    currency: series.meta.currency,
    score,
    rating: ratingFromScore(score),
    signals,
    reasons,
    consensus,
    forecast: buildForecastOutlook(series, consensus),
  };
}

export function rankBuyTimingSuggestions(
  seriesList: SparkSeries[],
  marketId: MarketId,
): BuyTimingSuggestion[] {
  return seriesList
    .map((series) => buildBuyTimingSuggestion(series, marketId))
    .filter((item): item is BuyTimingSuggestion => item != null)
    .sort((a, b) => b.score - a.score);
}

export const RATING_LABELS: Record<BuyTimingRating, string> = {
  "strong-buy": "Strong buy window",
  "good-entry": "Good entry",
  watch: "Watch",
  wait: "Wait",
};

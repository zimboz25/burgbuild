import type { BotResult, SparkSeries, TechnicalSignals } from "@/lib/types/stocks";
import { analyzeTechnicalSignals } from "@/lib/engines/buy-timing";
import { getReturn60d, getRsi } from "@/lib/engines/bots/features";

export function runMomentumBot(
  series: SparkSeries,
  signals?: TechnicalSignals,
): BotResult {
  const resolved = signals ?? analyzeTechnicalSignals(series.closes, series.meta);
  const price = series.meta.regularMarketPrice;
  const return60d = getReturn60d(series.closes);
  const priorRsi = getRsi(series.closes.slice(0, -5));

  let bullishPoints = 0;
  const reasons: string[] = [];

  if (resolved.return20d != null && resolved.return20d > 0) {
    bullishPoints += 1;
    reasons.push(`20-day return +${resolved.return20d.toFixed(1)}%`);
  }

  if (return60d != null && return60d > 0) {
    bullishPoints += 1;
    reasons.push(`60-day return +${return60d.toFixed(1)}%`);
  }

  if (resolved.sma50 != null && price > resolved.sma50) {
    bullishPoints += 1;
    reasons.push("Price above 50-day average");
  }

  if (resolved.sma200 != null && price > resolved.sma200) {
    bullishPoints += 1;
    reasons.push("Price above 200-day average");
  }

  if (resolved.macdHistogram != null && resolved.macdHistogram > 0) {
    bullishPoints += 1;
    reasons.push("MACD momentum positive");
  }

  if (
    resolved.rsi14 != null &&
    priorRsi != null &&
    resolved.rsi14 > priorRsi &&
    resolved.rsi14 >= 45 &&
    resolved.rsi14 <= 70
  ) {
    bullishPoints += 1;
    reasons.push("RSI rising in healthy trend zone");
  }

  if (bullishPoints >= 4) {
    return {
      botId: "momentum",
      botName: "Momentum",
      signal: "buy",
      confidence: Math.min(1, bullishPoints / 6),
      reason: reasons.slice(0, 2).join("; ") || "Strong upward momentum",
    };
  }

  if (
    resolved.return20d != null &&
    resolved.return20d < -10 &&
    resolved.macdHistogram != null &&
    resolved.macdHistogram < 0
  ) {
    return {
      botId: "momentum",
      botName: "Momentum",
      signal: "sell",
      confidence: 0.7,
      reason: "Negative momentum — declining trend with weak MACD",
    };
  }

  return {
    botId: "momentum",
    botName: "Momentum",
    signal: "hold",
    confidence: 0.45,
    reason: reasons[0] ?? "Mixed momentum signals",
  };
}

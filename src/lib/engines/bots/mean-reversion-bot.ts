import type { BotResult, SparkSeries, TechnicalSignals } from "@/lib/types/stocks";
import { analyzeTechnicalSignals } from "@/lib/engines/buy-timing";
import { computeBollingerZScore } from "@/lib/engines/bots/features";

export function runMeanReversionBot(
  series: SparkSeries,
  signals?: TechnicalSignals,
): BotResult {
  const resolved = signals ?? analyzeTechnicalSignals(series.closes, series.meta);
  const zScore = computeBollingerZScore(series.closes);

  const oversoldRsi = resolved.rsi14 != null && resolved.rsi14 < 35;
  const lowRange =
    resolved.rangePosition != null && resolved.rangePosition <= 30;
  const belowBand = zScore != null && zScore < -1;

  if (oversoldRsi && lowRange) {
    return {
      botId: "mean-reversion",
      botName: "Mean Reversion",
      signal: "buy",
      confidence: belowBand ? 0.85 : 0.7,
      reason: `Oversold setup — RSI ${resolved.rsi14?.toFixed(0)}, ${resolved.rangePosition?.toFixed(0)}% of 52w range`,
    };
  }

  if (oversoldRsi || (lowRange && belowBand)) {
    return {
      botId: "mean-reversion",
      botName: "Mean Reversion",
      signal: "buy",
      confidence: 0.6,
      reason: oversoldRsi
        ? `RSI oversold at ${resolved.rsi14?.toFixed(0)}`
        : "Price stretched below Bollinger band near range lows",
    };
  }

  if (resolved.rsi14 != null && resolved.rsi14 > 75) {
    return {
      botId: "mean-reversion",
      botName: "Mean Reversion",
      signal: "sell",
      confidence: 0.75,
      reason: `Overbought — RSI ${resolved.rsi14.toFixed(0)}, mean reversion risk`,
    };
  }

  return {
    botId: "mean-reversion",
    botName: "Mean Reversion",
    signal: "hold",
    confidence: 0.4,
    reason: "No clear mean-reversion entry",
  };
}

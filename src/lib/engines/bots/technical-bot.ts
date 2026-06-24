import type { BotResult, SparkSeries, TechnicalSignals } from "@/lib/types/stocks";
import {
  analyzeTechnicalSignals,
  scoreBuyTiming,
} from "@/lib/engines/buy-timing";

export function runTechnicalBot(
  series: SparkSeries,
  signals?: TechnicalSignals,
): BotResult {
  const resolved = signals ?? analyzeTechnicalSignals(series.closes, series.meta);
  const { score } = scoreBuyTiming(series.meta.regularMarketPrice, resolved);

  if (score >= 50) {
    return {
      botId: "technical",
      botName: "Technical",
      signal: "buy",
      confidence: Math.min(1, score / 100),
      reason: `Technical score ${score}/100 — multiple buy indicators aligned`,
    };
  }

  if (score <= 25) {
    return {
      botId: "technical",
      botName: "Technical",
      signal: "sell",
      confidence: Math.min(1, (100 - score) / 100),
      reason: `Technical score ${score}/100 — weak setup, avoid adding`,
    };
  }

  return {
    botId: "technical",
    botName: "Technical",
    signal: "hold",
    confidence: 0.5,
    reason: `Technical score ${score}/100 — neutral, wait for clearer signals`,
  };
}

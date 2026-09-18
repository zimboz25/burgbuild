import type { BotResult, SparkSeries } from "@/lib/types/stocks";
import {
  analyzePlayBitChannel,
  playBitRegimeLabel,
} from "@/lib/engines/playbit-ema";

export function runPlayBitBot(series: SparkSeries): BotResult {
  const analysis = analyzePlayBitChannel(series);

  if (!analysis) {
    return {
      botId: "playbit",
      botName: "PlayBit EMA",
      signal: "hold",
      confidence: 0.2,
      reason: "Not enough history for PlayBit 200 EMA channel",
    };
  }

  const recentCross =
    analysis.barsSinceCross != null && analysis.barsSinceCross <= 3;
  const distanceBoost = Math.min(0.25, Math.abs(analysis.distancePct) / 20);

  if (analysis.crossedAbove || (analysis.regime === "above" && recentCross)) {
    return {
      botId: "playbit",
      botName: "PlayBit EMA",
      signal: "buy",
      confidence: Math.min(0.95, 0.7 + distanceBoost),
      reason: analysis.crossedAbove
        ? `Close reclaimed PlayBit channel (above ${analysis.period} EMA highs/closes)`
        : `Price holding above PlayBit channel after recent reclaim`,
    };
  }

  if (analysis.crossedBelow || (analysis.regime === "below" && recentCross)) {
    return {
      botId: "playbit",
      botName: "PlayBit EMA",
      signal: "sell",
      confidence: Math.min(0.95, 0.7 + distanceBoost),
      reason: analysis.crossedBelow
        ? `Close lost PlayBit channel (below ${analysis.period} EMA highs/closes)`
        : `Price holding below PlayBit channel after recent breakdown`,
    };
  }

  if (analysis.regime === "above") {
    return {
      botId: "playbit",
      botName: "PlayBit EMA",
      signal: "buy",
      confidence: Math.min(0.85, 0.55 + distanceBoost),
      reason: `${playBitRegimeLabel(analysis.regime)} — bullish PlayBit bias`,
    };
  }

  if (analysis.regime === "below") {
    return {
      botId: "playbit",
      botName: "PlayBit EMA",
      signal: "sell",
      confidence: Math.min(0.85, 0.55 + distanceBoost),
      reason: `${playBitRegimeLabel(analysis.regime)} — bearish PlayBit bias`,
    };
  }

  return {
    botId: "playbit",
    botName: "PlayBit EMA",
    signal: "hold",
    confidence: 0.45,
    reason: `${playBitRegimeLabel(analysis.regime)} — wait for reclaim or breakdown`,
  };
}

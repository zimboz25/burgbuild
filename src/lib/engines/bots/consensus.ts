import type { BotConsensus, BotResult, BotSignal, SparkSeries } from "@/lib/types/stocks";
import { analyzeTechnicalSignals } from "@/lib/engines/buy-timing";
import { runMeanReversionBot } from "@/lib/engines/bots/mean-reversion-bot";
import { runMlBot } from "@/lib/engines/bots/ml-bot";
import { runMomentumBot } from "@/lib/engines/bots/momentum-bot";
import { runTechnicalBot } from "@/lib/engines/bots/technical-bot";

const BOT_WEIGHTS: Record<BotResult["botId"], number> = {
  technical: 0.3,
  momentum: 0.25,
  "mean-reversion": 0.25,
  ml: 0.2,
};

function signalToScore(signal: BotSignal, confidence: number): number {
  if (signal === "buy") return confidence;
  if (signal === "sell") return -confidence;
  return 0;
}

function scoreToConsensusSignal(score: number): BotSignal {
  if (score >= 0.35) return "buy";
  if (score <= -0.35) return "sell";
  return "hold";
}

export function runAllBots(series: SparkSeries): BotResult[] {
  const signals = analyzeTechnicalSignals(series.closes, series.meta);

  return [
    runTechnicalBot(series, signals),
    runMomentumBot(series, signals),
    runMeanReversionBot(series, signals),
    runMlBot(series, signals),
  ];
}

export function buildConsensus(results: BotResult[]): BotConsensus {
  const bullishCount = results.filter((result) => result.signal === "buy").length;
  const bearishCount = results.filter((result) => result.signal === "sell").length;

  let weightedScore = 0;
  for (const result of results) {
    weightedScore +=
      BOT_WEIGHTS[result.botId] * signalToScore(result.signal, result.confidence);
  }

  const consensusScore = Math.round(
    Math.max(0, Math.min(100, (weightedScore + 1) * 50)),
  );

  return {
    bullishCount,
    bearishCount,
    consensusSignal: scoreToConsensusSignal(weightedScore),
    consensusScore,
    results,
  };
}

export function analyzeSeriesWithBots(series: SparkSeries): BotConsensus {
  return buildConsensus(runAllBots(series));
}

export const BOT_LABELS: Record<BotResult["botId"], string> = {
  technical: "Technical",
  momentum: "Momentum",
  "mean-reversion": "Mean Reversion",
  ml: "ML Model",
};

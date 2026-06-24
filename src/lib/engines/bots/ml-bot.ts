import signalModel from "@/data/models/signal-model.json";
import type { BotResult, MlFeatureVector, SparkSeries, TechnicalSignals } from "@/lib/types/stocks";
import { extractMlFeatures } from "@/lib/engines/bots/features";

interface SignalModelConfig {
  version: number;
  featureOrder: (keyof MlFeatureVector)[];
  bias: number;
  weights: Record<keyof MlFeatureVector, number>;
  buyThreshold: number;
  sellThreshold: number;
}

const model = signalModel as SignalModelConfig;

function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-value));
}

export function predictMlProbability(features: MlFeatureVector): number {
  let logit = model.bias;
  for (const key of model.featureOrder) {
    logit += model.weights[key] * features[key];
  }
  return sigmoid(logit);
}

export function runMlBot(
  series: SparkSeries,
  signals?: TechnicalSignals,
): BotResult {
  const features = extractMlFeatures(series, signals);
  const probability = predictMlProbability(features);

  if (probability >= model.buyThreshold) {
    return {
      botId: "ml",
      botName: "ML Model",
      signal: "buy",
      confidence: probability,
      reason: `Model estimates ${(probability * 100).toFixed(0)}% upside probability`,
    };
  }

  if (probability <= model.sellThreshold) {
    return {
      botId: "ml",
      botName: "ML Model",
      signal: "sell",
      confidence: 1 - probability,
      reason: `Model estimates only ${(probability * 100).toFixed(0)}% upside probability`,
    };
  }

  return {
    botId: "ml",
    botName: "ML Model",
    signal: "hold",
    confidence: 0.5,
    reason: `Model neutral at ${(probability * 100).toFixed(0)}% upside probability`,
  };
}

export function getSignalModelConfig(): SignalModelConfig {
  return model;
}

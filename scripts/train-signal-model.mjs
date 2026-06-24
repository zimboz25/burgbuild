/**
 * Offline trainer for the logistic regression signal model.
 * Usage: node scripts/train-signal-model.mjs
 *
 * Fetches Yahoo spark data and writes src/data/models/signal-model.json
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "../src/data/models/signal-model.json");

const SAMPLE_SYMBOLS = [
  "BHP.AX",
  "CBA.AX",
  "AAPL",
  "MSFT",
  "NVDA",
  "AMZN",
  "GOOGL",
  "META",
  "TSLA",
  "COST",
];

const FEATURE_ORDER = [
  "rsi14",
  "macdHistogram",
  "belowSma50",
  "rangePosition",
  "return5d",
  "return20d",
  "volatility20d",
];

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function sma(values, period) {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((sum, value) => sum + value, 0) / period;
}

function ema(values, period) {
  const k = 2 / (period + 1);
  const result = [];
  let prev = values[0];
  for (let i = 0; i < values.length; i++) {
    prev = i === 0 ? values[0] : values[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}

function computeRsi(closes, period = 14) {
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
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function computeMacd(closes) {
  if (closes.length < 35) return null;
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((value, index) => value - ema26[index]);
  const signalLine = ema(macdLine, 9);
  const last = macdLine.length - 1;
  return macdLine[last] - signalLine[last];
}

function pctReturn(closes, days) {
  if (closes.length <= days) return null;
  const current = closes[closes.length - 1];
  const prior = closes[closes.length - 1 - days];
  if (prior <= 0) return null;
  return ((current - prior) / prior) * 100;
}

function volatility20d(closes) {
  if (closes.length < 21) return 0.5;
  const returns = [];
  for (let i = closes.length - 20; i < closes.length; i++) {
    const prev = closes[i - 1];
    if (prev > 0) returns.push((closes[i] - prev) / prev);
  }
  if (returns.length === 0) return 0.5;
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  return clamp01(Math.sqrt(variance) * 50);
}

function extractFeaturesAt(closes, index, meta) {
  const slice = closes.slice(0, index + 1);
  if (slice.length < 60) return null;

  const price = slice[slice.length - 1];
  const rsi = computeRsi(slice);
  const macdHistogram = computeMacd(slice);
  const sma50 = sma(slice, 50);
  const return5d = pctReturn(slice, 5);
  const return20d = pctReturn(slice, 20);

  const low = meta.fiftyTwoWeekLow ?? Math.min(...slice);
  const high = meta.fiftyTwoWeekHigh ?? Math.max(...slice);
  const rangePosition =
    high > low ? ((price - low) / (high - low)) * 100 : 50;

  return {
    rsi14: rsi == null ? 0.5 : clamp01(rsi / 100),
    macdHistogram:
      macdHistogram == null ? 0.5 : clamp01(0.5 + macdHistogram / 2),
    belowSma50:
      sma50 != null && sma50 > 0 ? clamp01((sma50 - price) / sma50) : 0.5,
    rangePosition: clamp01(rangePosition / 100),
    return5d: return5d == null ? 0.5 : clamp01(0.5 + return5d / 10),
    return20d: return20d == null ? 0.5 : clamp01(0.5 + return20d / 20),
    volatility20d: volatility20d(slice),
  };
}

function forwardReturn(closes, index, days = 20) {
  if (index + days >= closes.length) return null;
  const start = closes[index];
  const end = closes[index + days];
  if (start <= 0) return null;
  return ((end - start) / start) * 100;
}

function sigmoid(value) {
  return 1 / (1 + Math.exp(-value));
}

async function fetchSpark(symbol) {
  const url = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(symbol)}&range=2y&interval=1d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; BurgBuild-Trainer/1.0)" },
  });
  if (!res.ok) throw new Error(`Failed ${symbol}: ${res.status}`);
  const data = await res.json();
  const response = data.spark?.result?.[0]?.response?.[0];
  if (!response) return null;

  const closes = (response.indicators?.quote?.[0]?.close ?? []).filter(
    (value) => typeof value === "number" && value > 0,
  );

  return { closes, meta: response.meta };
}

function trainLogisticRegression(samples, epochs = 800, learningRate = 0.08) {
  const weights = Object.fromEntries(FEATURE_ORDER.map((key) => [key, 0]));
  let bias = 0;

  for (let epoch = 0; epoch < epochs; epoch++) {
    for (const sample of samples) {
      let logit = bias;
      for (const key of FEATURE_ORDER) {
        logit += weights[key] * sample.features[key];
      }
      const prediction = sigmoid(logit);
      const error = prediction - sample.label;

      bias -= learningRate * error;
      for (const key of FEATURE_ORDER) {
        weights[key] -= learningRate * error * sample.features[key];
      }
    }
  }

  return { bias, weights };
}

async function main() {
  const samples = [];

  for (const symbol of SAMPLE_SYMBOLS) {
    const payload = await fetchSpark(symbol);
    if (!payload) continue;

    const { closes, meta } = payload;
    for (let i = 60; i < closes.length - 21; i += 5) {
      const features = extractFeaturesAt(closes, i, meta);
      const fwd = forwardReturn(closes, i, 20);
      if (!features || fwd == null) continue;

      samples.push({
        features,
        label: fwd > 5 ? 1 : 0,
      });
    }
  }

  if (samples.length < 50) {
    throw new Error(`Not enough training samples: ${samples.length}`);
  }

  const { bias, weights } = trainLogisticRegression(samples);

  const model = {
    version: 1,
    featureOrder: FEATURE_ORDER,
    bias,
    weights,
    buyThreshold: 0.6,
    sellThreshold: 0.4,
    trainedAt: new Date().toISOString(),
    sampleCount: samples.length,
  };

  writeFileSync(OUTPUT, `${JSON.stringify(model, null, 2)}\n`);
  console.log(`Wrote model with ${samples.length} samples to ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import type { MlFeatureVector, SparkSeries, TechnicalSignals } from "@/lib/types/stocks";
import {
  analyzeTechnicalSignals,
  computeRsi,
  pctReturn,
  sma,
} from "@/lib/engines/buy-timing";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizeRsi(rsi: number | null): number {
  if (rsi == null) return 0.5;
  return clamp01(rsi / 100);
}

function normalizeReturn(pct: number | null, scale = 20): number {
  if (pct == null) return 0.5;
  return clamp01(0.5 + pct / scale);
}

function normalizeRange(position: number | null): number {
  if (position == null) return 0.5;
  return clamp01(position / 100);
}

function computeVolatility20d(closes: number[]): number {
  if (closes.length < 21) return 0.5;

  const returns: number[] = [];
  for (let i = closes.length - 20; i < closes.length; i++) {
    const prev = closes[i - 1];
    if (prev > 0) returns.push((closes[i] - prev) / prev);
  }

  if (returns.length === 0) return 0.5;

  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  return clamp01(stdDev * 50);
}

export function extractMlFeatures(
  series: SparkSeries,
  signals?: TechnicalSignals,
): MlFeatureVector {
  const resolved = signals ?? analyzeTechnicalSignals(series.closes, series.meta);
  const price = series.meta.regularMarketPrice;

  const belowSma50 =
    resolved.sma50 != null && resolved.sma50 > 0
      ? clamp01((resolved.sma50 - price) / resolved.sma50)
      : 0.5;

  const macdNorm =
    resolved.macdHistogram != null
      ? clamp01(0.5 + resolved.macdHistogram / 2)
      : 0.5;

  return {
    rsi14: normalizeRsi(resolved.rsi14),
    macdHistogram: macdNorm,
    belowSma50,
    rangePosition: normalizeRange(resolved.rangePosition),
    return5d: normalizeReturn(resolved.return5d, 10),
    return20d: normalizeReturn(resolved.return20d, 20),
    volatility20d: computeVolatility20d(series.closes),
  };
}

export function computeBollingerZScore(
  closes: number[],
  period = 20,
): number | null {
  if (closes.length < period) return null;

  const slice = closes.slice(-period);
  const mean = slice.reduce((sum, value) => sum + value, 0) / period;
  const variance =
    slice.reduce((sum, value) => sum + (value - mean) ** 2, 0) / period;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return 0;

  return (closes[closes.length - 1] - mean) / stdDev;
}

export function getReturn60d(closes: number[]): number | null {
  return pctReturn(closes, 60);
}

export function getSma50(closes: number[]): number | null {
  return sma(closes, 50);
}

export function getSma200(closes: number[]): number | null {
  return sma(closes, 200);
}

export function getRsi(closes: number[]): number | null {
  return computeRsi(closes);
}

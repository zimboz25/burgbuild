import type { PlayBitRegime, SparkSeries } from "@/lib/types/stocks";

export const PLAYBIT_EMA_PERIOD = 200;

export interface PlayBitChannelPoint {
  emaHigh: number;
  emaClose: number;
  upper: number;
  lower: number;
  regime: PlayBitRegime;
}

export interface PlayBitAnalysis {
  period: number;
  points: PlayBitChannelPoint[];
  emaHigh: number;
  emaClose: number;
  upper: number;
  lower: number;
  regime: PlayBitRegime;
  previousRegime: PlayBitRegime | null;
  crossedAbove: boolean;
  crossedBelow: boolean;
  barsSinceCross: number | null;
  distancePct: number;
}

function emaSeries(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  let prev = values[0];

  for (let i = 0; i < values.length; i++) {
    prev = i === 0 ? values[0] : values[i] * k + prev * (1 - k);
    result.push(prev);
  }

  return result;
}

export function resolvePlayBitHighs(series: SparkSeries): number[] {
  if (series.highs?.length === series.closes.length) return series.highs;
  return series.closes;
}

export function regimeFromClose(
  close: number,
  emaHigh: number,
  emaClose: number,
): PlayBitRegime {
  const upper = Math.max(emaHigh, emaClose);
  const lower = Math.min(emaHigh, emaClose);

  if (close > upper) return "above";
  if (close < lower) return "below";
  return "inside";
}

export function analyzePlayBitChannel(
  series: SparkSeries,
  period = PLAYBIT_EMA_PERIOD,
): PlayBitAnalysis | null {
  if (series.closes.length < Math.min(period, 30)) return null;

  const highs = resolvePlayBitHighs(series);
  const emaHigh = emaSeries(highs, period);
  const emaClose = emaSeries(series.closes, period);
  const points: PlayBitChannelPoint[] = [];

  for (let i = 0; i < series.closes.length; i++) {
    const highEma = emaHigh[i];
    const closeEma = emaClose[i];
    points.push({
      emaHigh: highEma,
      emaClose: closeEma,
      upper: Math.max(highEma, closeEma),
      lower: Math.min(highEma, closeEma),
      regime: regimeFromClose(series.closes[i], highEma, closeEma),
    });
  }

  const last = points.length - 1;
  const current = points[last];
  const previous = last > 0 ? points[last - 1] : null;
  const crossedAbove =
    previous != null &&
    previous.regime !== "above" &&
    current.regime === "above";
  const crossedBelow =
    previous != null &&
    previous.regime !== "below" &&
    current.regime === "below";

  let barsSinceCross: number | null = null;
  for (let i = last; i >= 1; i--) {
    const curr = points[i];
    const prev = points[i - 1];
    if (curr.regime !== prev.regime) {
      barsSinceCross = last - i;
      break;
    }
  }

  const close = series.closes[last];
  const mid = (current.upper + current.lower) / 2;
  const distancePct = mid > 0 ? ((close - mid) / mid) * 100 : 0;

  return {
    period,
    points,
    emaHigh: current.emaHigh,
    emaClose: current.emaClose,
    upper: current.upper,
    lower: current.lower,
    regime: current.regime,
    previousRegime: previous?.regime ?? null,
    crossedAbove,
    crossedBelow,
    barsSinceCross,
    distancePct,
  };
}

export function getPlayBitChannelLines(
  series: SparkSeries,
  period = PLAYBIT_EMA_PERIOD,
): {
  emaHigh: (number | null)[];
  emaClose: (number | null)[];
  regimes: PlayBitRegime[];
} | null {
  const analysis = analyzePlayBitChannel(series, period);
  if (!analysis) return null;

  // Hide noisy warmup where EMA hasn't had a full period yet.
  const emaHigh = analysis.points.map((point, index) =>
    index < period - 1 ? null : point.emaHigh,
  );
  const emaClose = analysis.points.map((point, index) =>
    index < period - 1 ? null : point.emaClose,
  );
  const regimes = analysis.points.map((point) => point.regime);

  return { emaHigh, emaClose, regimes };
}

export function playBitRegimeLabel(regime: PlayBitRegime): string {
  switch (regime) {
    case "above":
      return "Above channel";
    case "below":
      return "Below channel";
    case "inside":
      return "Inside channel";
  }
}

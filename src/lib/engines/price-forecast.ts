import type {
  BotConsensus,
  BotForecast,
  BotId,
  BotResult,
  ForecastHorizon,
  ForecastOutlook,
  PriceForecast,
  SparkSeries,
  TechnicalSignals,
} from "@/lib/types/stocks";
import { FORECAST_HORIZONS } from "@/lib/types/stocks";
import { analyzeTechnicalSignals, pctReturn, scoreBuyTiming, sma } from "@/lib/engines/buy-timing";
import { predictMlProbability } from "@/lib/engines/bots/ml-bot";
import { extractMlFeatures } from "@/lib/engines/bots/features";
import { BOT_LABELS } from "@/lib/engines/bots/consensus";

const HORIZON_KEYS: ForecastHorizon[] = ["5d", "20d", "60d"];

const BOT_FORECAST_WEIGHTS: Record<BotId, number> = {
  technical: 0.3,
  momentum: 0.25,
  "mean-reversion": 0.25,
  ml: 0.2,
};

function dailyVolatility(closes: number[]): number {
  if (closes.length < 21) return 0.01;
  const returns: number[] = [];
  for (let i = closes.length - 20; i < closes.length; i++) {
    const prev = closes[i - 1];
    if (prev > 0) returns.push((closes[i] - prev) / prev);
  }
  if (returns.length === 0) return 0.01;
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  return Math.max(0.005, Math.sqrt(variance));
}

function linearDrift(closes: number[], lookback = 30): number {
  const slice = closes.slice(-lookback);
  if (slice.length < 10) return 0;

  const n = slice.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += slice[i];
    sumXY += i * slice[i];
    sumXX += i * i;
  }

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const avg = sumY / n;
  return avg > 0 ? slope / avg : 0;
}

function directionFromReturn(pct: number): PriceForecast["direction"] {
  if (pct > 0.75) return "up";
  if (pct < -0.75) return "down";
  return "flat";
}

function buildForecast(
  horizon: ForecastHorizon,
  price: number,
  expectedReturnPct: number,
  bandWidthPct: number,
  confidence: number,
): PriceForecast {
  const { label, tradingDays } = FORECAST_HORIZONS[horizon];
  const lowReturnPct = expectedReturnPct - bandWidthPct;
  const highReturnPct = expectedReturnPct + bandWidthPct;

  return {
    horizon,
    horizonLabel: label,
    tradingDays,
    expectedReturnPct,
    lowReturnPct,
    highReturnPct,
    expectedPrice: price * (1 + expectedReturnPct / 100),
    lowPrice: price * (1 + lowReturnPct / 100),
    highPrice: price * (1 + highReturnPct / 100),
    confidence,
    direction: directionFromReturn(expectedReturnPct),
  };
}

function momentumForecast(
  price: number,
  closes: number[],
  horizon: ForecastHorizon,
  bot: BotResult,
): PriceForecast {
  const days = FORECAST_HORIZONS[horizon].tradingDays;
  const drift = linearDrift(closes);
  const vol = dailyVolatility(closes);
  const scale = bot.signal === "buy" ? 1.15 : bot.signal === "sell" ? 0.85 : 1;
  const expectedReturnPct = drift * days * 100 * scale;
  const bandWidthPct = vol * Math.sqrt(days) * 100 * 1.2;

  return buildForecast(
    horizon,
    price,
    expectedReturnPct,
    bandWidthPct,
    bot.confidence,
  );
}

function meanReversionForecast(
  price: number,
  signals: TechnicalSignals,
  horizon: ForecastHorizon,
  bot: BotResult,
): PriceForecast {
  const days = FORECAST_HORIZONS[horizon].tradingDays;
  const target = signals.sma50 ?? price;
  const gapPct = target > 0 ? ((target - price) / price) * 100 : 0;
  const reversionRate = 1 - Math.exp(-days / 25);
  const expectedReturnPct = gapPct * reversionRate * (bot.signal === "buy" ? 1.1 : 1);
  const bandWidthPct = Math.abs(gapPct) * 0.35 + days * 0.15;

  return buildForecast(
    horizon,
    price,
    expectedReturnPct,
    Math.max(1.5, bandWidthPct),
    bot.confidence,
  );
}

function technicalForecast(
  price: number,
  signals: TechnicalSignals,
  horizon: ForecastHorizon,
  bot: BotResult,
): PriceForecast {
  const days = FORECAST_HORIZONS[horizon].tradingDays;
  const { score } = scoreBuyTiming(price, signals);
  const horizonScale = Math.sqrt(days / 20);
  const expectedReturnPct = ((score - 50) / 50) * 8 * horizonScale;
  const bandWidthPct = 3 + days * 0.12;

  return buildForecast(
    horizon,
    price,
    expectedReturnPct,
    bandWidthPct,
    bot.confidence,
  );
}

function mlForecast(
  price: number,
  series: SparkSeries,
  signals: TechnicalSignals,
  horizon: ForecastHorizon,
  bot: BotResult,
): PriceForecast {
  const days = FORECAST_HORIZONS[horizon].tradingDays;
  const probability = predictMlProbability(extractMlFeatures(series, signals));
  const horizonScale = Math.sqrt(days / 20);
  const expectedReturnPct = (probability - 0.5) * 16 * horizonScale;
  const vol = dailyVolatility(series.closes);
  const bandWidthPct = vol * Math.sqrt(days) * 100 * 1.1 + 2;

  return buildForecast(
    horizon,
    price,
    expectedReturnPct,
    bandWidthPct,
    Math.max(bot.confidence, probability),
  );
}

function consensusForecast(
  price: number,
  botForecasts: BotForecast[],
  horizon: ForecastHorizon,
  consensus: BotConsensus,
): PriceForecast {
  let expected = 0;
  let low = 0;
  let high = 0;
  let weightSum = 0;

  for (const bot of botForecasts) {
    const forecast = bot.horizons.find((item) => item.horizon === horizon);
    if (!forecast) continue;
    const weight = BOT_FORECAST_WEIGHTS[bot.botId];
    expected += forecast.expectedReturnPct * weight;
    low += forecast.lowReturnPct * weight;
    high += forecast.highReturnPct * weight;
    weightSum += weight;
  }

  if (weightSum === 0) {
    return buildForecast(horizon, price, 0, 3, 0.5);
  }

  return buildForecast(
    horizon,
    price,
    expected / weightSum,
    Math.max(1.5, (high - low) / 2),
    consensus.consensusScore / 100,
  );
}

function buildProjectionPath(
  price: number,
  closes: number[],
  consensusHorizon: PriceForecast,
): number[] {
  const historyDays = 30;
  const forecastDays = consensusHorizon.tradingDays;
  const history = closes.slice(-historyDays);
  const path = [...history];
  const dailyReturn = consensusHorizon.expectedReturnPct / forecastDays / 100;

  let current = price;
  for (let i = 1; i <= forecastDays; i++) {
    const decay = 1 - i / (forecastDays * 1.5);
    current *= 1 + dailyReturn * Math.max(0.35, decay);
    path.push(current);
  }

  return path;
}

export function buildBotForecasts(
  series: SparkSeries,
  botResults: BotResult[],
  signals?: TechnicalSignals,
): BotForecast[] {
  const resolved = signals ?? analyzeTechnicalSignals(series.closes, series.meta);
  const price = series.meta.regularMarketPrice;

  return botResults.map((bot) => {
    const horizons = HORIZON_KEYS.map((horizon) => {
      switch (bot.botId) {
        case "momentum":
          return momentumForecast(price, series.closes, horizon, bot);
        case "mean-reversion":
          return meanReversionForecast(price, resolved, horizon, bot);
        case "ml":
          return mlForecast(price, series, resolved, horizon, bot);
        default:
          return technicalForecast(price, resolved, horizon, bot);
      }
    });

    return {
      botId: bot.botId,
      botName: BOT_LABELS[bot.botId],
      horizons,
    };
  });
}

export function buildForecastOutlook(
  series: SparkSeries,
  consensus: BotConsensus,
): ForecastOutlook {
  const price = series.meta.regularMarketPrice;
  const signals = analyzeTechnicalSignals(series.closes, series.meta);
  const byBot = buildBotForecasts(series, consensus.results, signals);
  const consensusForecasts = HORIZON_KEYS.map((horizon) =>
    consensusForecast(price, byBot, horizon, consensus),
  );
  const defaultHorizon =
    consensusForecasts.find((item) => item.horizon === "20d") ?? consensusForecasts[0];

  return {
    currentPrice: price,
    consensus: consensusForecasts,
    byBot,
    projectionPath: buildProjectionPath(price, series.closes, defaultHorizon),
  };
}

export function recentReturn(closes: number[], days: number): number | null {
  return pctReturn(closes, days);
}

export function getSma50Line(closes: number[]): (number | null)[] {
  return closes.map((_, index) => {
    if (index < 49) return null;
    return sma(closes.slice(0, index + 1), 50);
  });
}

export function buildProjectionPathForForecast(
  price: number,
  closes: number[],
  forecast: PriceForecast,
): number[] {
  return buildProjectionPath(price, closes, forecast);
}

export type MarketId = "asx200" | "sp500" | "nasdaq100";

export interface MarketStock {
  symbol: string;
  name: string;
  sector: string;
}

export interface MarketDefinition {
  id: MarketId;
  label: string;
  shortLabel: string;
  description: string;
  currency: string;
  locale: string;
  yahooSuffix: string;
  stocks: MarketStock[];
}

/** @deprecated Use MarketStock */
export type AsxStock = MarketStock;

export type BuyTimingRating =
  | "strong-buy"
  | "good-entry"
  | "watch"
  | "wait";

export interface TechnicalSignals {
  rsi14: number | null;
  sma50: number | null;
  sma200: number | null;
  macdLine: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyTwoWeekHigh: number | null;
  rangePosition: number | null;
  return5d: number | null;
  return20d: number | null;
}

export interface BuyTimingSuggestion {
  marketId: MarketId;
  symbol: string;
  yahooSymbol: string;
  name: string;
  sector: string;
  price: number;
  currency: string;
  score: number;
  rating: BuyTimingRating;
  signals: TechnicalSignals;
  reasons: string[];
  consensus?: BotConsensus;
  forecast?: ForecastOutlook;
}

export interface SparkQuoteMeta {
  currency: string;
  symbol: string;
  regularMarketPrice: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  longName?: string;
  shortName?: string;
}

export interface SparkSeries {
  symbol: string;
  meta: SparkQuoteMeta;
  closes: number[];
  /** Unix timestamps (seconds), aligned with `closes` */
  timestamps: number[];
}

export type BotSignal = "buy" | "hold" | "sell";

export type BotId = "technical" | "momentum" | "mean-reversion" | "ml";

export interface BotResult {
  botId: BotId;
  botName: string;
  signal: BotSignal;
  confidence: number;
  reason: string;
}

export interface BotConsensus {
  bullishCount: number;
  bearishCount: number;
  consensusSignal: BotSignal;
  consensusScore: number;
  results: BotResult[];
}

export interface MlFeatureVector {
  rsi14: number;
  macdHistogram: number;
  belowSma50: number;
  rangePosition: number;
  return5d: number;
  return20d: number;
  volatility20d: number;
}

export interface WatchlistEntry {
  id: string;
  marketId: MarketId;
  symbol: string;
  addedAt: string;
  addedPrice: number | null;
  notes?: string;
}

export type ForecastHorizon = "5d" | "20d" | "60d";

export const FORECAST_HORIZONS: Record<
  ForecastHorizon,
  { label: string; tradingDays: number }
> = {
  "5d": { label: "1 week", tradingDays: 5 },
  "20d": { label: "1 month", tradingDays: 20 },
  "60d": { label: "3 months", tradingDays: 60 },
};

export interface PriceForecast {
  horizon: ForecastHorizon;
  horizonLabel: string;
  tradingDays: number;
  expectedReturnPct: number;
  lowReturnPct: number;
  highReturnPct: number;
  expectedPrice: number;
  lowPrice: number;
  highPrice: number;
  confidence: number;
  direction: "up" | "down" | "flat";
}

export interface BotForecast {
  botId: BotId;
  botName: string;
  horizons: PriceForecast[];
}

export interface ForecastOutlook {
  currentPrice: number;
  consensus: PriceForecast[];
  byBot: BotForecast[];
  projectionPath: number[];
}

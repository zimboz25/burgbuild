import { ASX200_STOCKS } from "@/data/asx200-stocks";
import { NASDAQ100_STOCKS } from "@/data/markets/nasdaq100-stocks";
import { SP500_STOCKS } from "@/data/markets/sp500-stocks";
import type { MarketDefinition, MarketId, MarketStock } from "@/lib/types/stocks";

export const MARKET_IDS: MarketId[] = ["asx200", "sp500", "nasdaq100"];

export const MARKETS: Record<MarketId, MarketDefinition> = {
  asx200: {
    id: "asx200",
    label: "ASX 200",
    shortLabel: "ASX",
    description: "Australian Securities Exchange top 200",
    currency: "AUD",
    locale: "en-AU",
    yahooSuffix: ".AX",
    stocks: ASX200_STOCKS,
  },
  sp500: {
    id: "sp500",
    label: "S&P 500",
    shortLabel: "S&P",
    description: "Leading US large-cap benchmark",
    currency: "USD",
    locale: "en-US",
    yahooSuffix: "",
    stocks: SP500_STOCKS,
  },
  nasdaq100: {
    id: "nasdaq100",
    label: "NASDAQ 100",
    shortLabel: "NASDAQ",
    description: "Top non-financial NASDAQ listings",
    currency: "USD",
    locale: "en-US",
    yahooSuffix: "",
    stocks: NASDAQ100_STOCKS,
  },
};

export function isMarketId(value: string | null | undefined): value is MarketId {
  return value === "asx200" || value === "sp500" || value === "nasdaq100";
}

export function getMarket(id: MarketId): MarketDefinition {
  return MARKETS[id];
}

export function toYahooSymbol(symbol: string, market: MarketDefinition): string {
  return `${symbol}${market.yahooSuffix}`;
}

export function fromYahooSymbol(
  yahooSymbol: string,
  market: MarketDefinition,
): string {
  if (market.yahooSuffix && yahooSymbol.endsWith(market.yahooSuffix)) {
    return yahooSymbol.slice(0, -market.yahooSuffix.length);
  }
  return yahooSymbol;
}

export function getStockBySymbol(
  marketId: MarketId,
  symbol: string,
): MarketStock | undefined {
  const market = MARKETS[marketId];
  return market.stocks.find(
    (stock) => stock.symbol.toUpperCase() === symbol.toUpperCase(),
  );
}

export function getMarketSymbols(marketId: MarketId): string[] {
  return MARKETS[marketId].stocks.map((stock) => stock.symbol);
}

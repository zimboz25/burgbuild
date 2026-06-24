import type { CSSProperties } from "react";
import {
  BotBreakdownPanel,
  BotConsensusBadge,
} from "@/components/stocks/bot-ui";
import { ForecastPanel } from "@/components/stocks/forecast-panel";
import {
  ChartRangeTabs,
  HorizonTabs,
  PriceChart,
} from "@/components/stocks/price-chart";
import { getSuggestionBotUpside } from "@/lib/engines/bot-valuation";
import { getSma50Line } from "@/lib/engines/price-forecast";
import type { ChartRange } from "@/lib/stocks/chart-range";
import { chartRangeUsesIntraday } from "@/lib/stocks/chart-range";
import type {
  BuyTimingRating,
  BuyTimingSuggestion,
  ForecastHorizon,
  SparkSeries,
} from "@/lib/types/stocks";
import { RATING_LABELS } from "@/lib/engines/buy-timing";
import { SignedValue } from "@/components/stocks/signed-value";
import { signedValueClass, signedValueStyle } from "@/lib/stocks/value-colors";

const RATING_CLASSES: Record<BuyTimingRating, string> = {
  "strong-buy": "border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
  "good-entry": "border-secondary/40 bg-secondary/20 text-secondary-foreground",
  watch: "border-chart-2/40 bg-chart-2/15 text-chart-2",
  wait: "border-border bg-muted-surface/40 text-muted-foreground",
};

function RatingBadge({ rating }: { rating: BuyTimingRating }) {
  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium leading-none ${RATING_CLASSES[rating]}`}
    >
      {RATING_LABELS[rating]}
    </span>
  );
}

function Metric({
  label,
  value,
  valueClassName,
  valueStyle,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  valueStyle?: CSSProperties;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
      <p className="text-xs text-muted">{label}</p>
      <p className={`font-mono ${valueClassName ?? "text-foreground"}`} style={valueStyle}>
        {value}
      </p>
    </div>
  );
}

function formatPrice(value: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPct(value: number | null): string {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function StockDetailPanel({
  stock,
  locale,
  series,
  chartRange,
  onChartRangeChange,
  chartHorizon,
  onChartHorizonChange,
  chartProjectionPath,
  chartLoading = false,
  onWatchlistToggle,
  watchlistBusy,
  onWatchlist,
}: {
  stock: BuyTimingSuggestion;
  locale: string;
  series?: SparkSeries;
  chartRange: ChartRange;
  onChartRangeChange: (range: ChartRange) => void;
  chartHorizon: ForecastHorizon;
  onChartHorizonChange: (horizon: ForecastHorizon) => void;
  chartProjectionPath?: number[];
  chartLoading?: boolean;
  onWatchlistToggle: () => void;
  watchlistBusy: boolean;
  onWatchlist: boolean;
}) {
  const selectedHorizonForecast = stock.forecast?.consensus.find(
    (item) => item.horizon === chartHorizon,
  );
  const botValuation = getSuggestionBotUpside(stock, chartHorizon);
  const showForecastOnChart = !chartRangeUsesIntraday(chartRange);
  const sma50 =
    series && !chartRangeUsesIntraday(chartRange) && series.closes.length >= 50
      ? getSma50Line(series.closes)
      : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">
            {stock.symbol} · {stock.sector}
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{stock.name}</p>
          <p className="mt-1 font-mono text-3xl text-foreground">
            {formatPrice(stock.price, stock.currency, locale)}
          </p>
          {botValuation && (
            <p className="mt-2 text-sm text-muted">
              Bot avg target{" "}
              <span className="font-mono text-foreground">
                {formatPrice(botValuation.avgExpectedPrice, stock.currency, locale)}
              </span>{" "}
              <SignedValue value={botValuation.upsidePct}>
                ({formatPct(botValuation.upsidePct)})
              </SignedValue>
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-foreground">{stock.score}</span>
            <span className="mb-1 text-sm text-muted">/ 100</span>
          </div>
          <RatingBadge rating={stock.rating} />
          <BotConsensusBadge consensus={stock.consensus} />
        </div>
      </div>

      <button
        type="button"
        onClick={onWatchlistToggle}
        disabled={watchlistBusy}
        className={`rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
          onWatchlist
            ? "border-destructive/40 text-destructive hover:bg-destructive/10"
            : "border-primary/40 text-primary hover:bg-primary/10"
        }`}
      >
        {watchlistBusy
          ? "Saving…"
          : onWatchlist
            ? "Remove from watchlist"
            : "Add to watchlist"}
      </button>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-wide text-muted">Price chart</p>
          <ChartRangeTabs value={chartRange} onChange={onChartRangeChange} />
        </div>
        {chartLoading ? (
          <div className="flex h-48 items-center justify-center rounded-lg border border-border bg-background/40 text-sm text-muted">
            Loading chart…
          </div>
        ) : series ? (
          <>
            <PriceChart
              history={series.closes}
              timestamps={series.timestamps}
              currency={stock.currency}
              locale={locale}
              projectionPath={chartProjectionPath}
              forecast={selectedHorizonForecast}
              sma50={sma50}
              showForecast={showForecastOnChart}
            />
            {showForecastOnChart && (
              <div className="flex items-center justify-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">Forecast horizon</span>
                  <HorizonTabs value={chartHorizon} onChange={onChartHorizonChange} />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-48 items-center justify-center rounded-lg border border-border bg-background/40 text-sm text-muted">
            Chart unavailable
          </div>
        )}
      </div>

      {stock.forecast && (
        <ForecastPanel
          outlook={stock.forecast}
          horizon={chartHorizon}
          currency={stock.currency}
          locale={locale}
        />
      )}

      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="RSI (14)" value={stock.signals.rsi14?.toFixed(1) ?? "—"} />
        <Metric
          label="vs 50-day"
          value={
            stock.signals.sma50
              ? `${(((stock.price - stock.signals.sma50) / stock.signals.sma50) * 100).toFixed(1)}%`
              : "—"
          }
          valueClassName={
            stock.signals.sma50
              ? signedValueClass(
                  ((stock.price - stock.signals.sma50) / stock.signals.sma50) * 100,
                )
              : undefined
          }
          valueStyle={
            stock.signals.sma50
              ? signedValueStyle(
                  ((stock.price - stock.signals.sma50) / stock.signals.sma50) * 100,
                )
              : undefined
          }
        />
        <Metric
          label="5-day"
          value={formatPct(stock.signals.return5d)}
          valueClassName={signedValueClass(stock.signals.return5d)}
          valueStyle={signedValueStyle(stock.signals.return5d)}
        />
        <Metric
          label="20-day"
          value={formatPct(stock.signals.return20d)}
          valueClassName={signedValueClass(stock.signals.return20d)}
          valueStyle={signedValueStyle(stock.signals.return20d)}
        />
        <Metric
          label="52w low"
          value={
            stock.signals.fiftyTwoWeekLow != null
              ? formatPrice(stock.signals.fiftyTwoWeekLow, stock.currency, locale)
              : "—"
          }
        />
        <Metric
          label="52w high"
          value={
            stock.signals.fiftyTwoWeekHigh != null
              ? formatPrice(stock.signals.fiftyTwoWeekHigh, stock.currency, locale)
              : "—"
          }
        />
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-muted">Why now</p>
        <ul className="space-y-2 text-sm text-muted">
          {stock.reasons.map((reason) => (
            <li key={reason} className="flex gap-2">
              <span className="text-primary">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      <BotBreakdownPanel consensus={stock.consensus} />
    </div>
  );
}

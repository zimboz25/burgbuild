import type { BotForecast, ForecastHorizon, ForecastOutlook } from "@/lib/types/stocks";
import { directionClass, directionStyle, signedSurfaceClass } from "@/lib/stocks/value-colors";

function formatPct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function formatPrice(value: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function ForecastPanel({
  outlook,
  horizon,
  currency,
  locale,
}: {
  outlook: ForecastOutlook;
  horizon: ForecastHorizon;
  currency: string;
  locale: string;
}) {
  const consensus = outlook.consensus.find((item) => item.horizon === horizon);
  if (!consensus) return null;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-muted">
          Consensus forecast · {consensus.horizonLabel}
        </p>
        <div
          className={`rounded-lg border px-3 py-3 ${signedSurfaceClass(consensus.expectedReturnPct)}`}
        >
          <div className="flex items-end justify-between gap-3">
            <div>
              <p
                className={`text-2xl font-bold ${directionClass(consensus.direction)}`}
                style={directionStyle(consensus.direction)}
              >
                {formatPct(consensus.expectedReturnPct)}
              </p>
              <p className="text-sm text-muted">
                Target {formatPrice(consensus.expectedPrice, currency, locale)}
              </p>
            </div>
            <div className="text-right text-xs text-muted">
              <p>
                Range {formatPct(consensus.lowReturnPct)} to{" "}
                {formatPct(consensus.highReturnPct)}
              </p>
              <p>{(consensus.confidence * 100).toFixed(0)}% confidence</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted">By bot</p>
        {outlook.byBot.map((bot) => (
          <BotForecastRow
            key={bot.botId}
            bot={bot}
            horizon={horizon}
            currency={currency}
            locale={locale}
          />
        ))}
      </div>

      <p className="text-[11px] leading-relaxed text-muted">
        Forecasts extrapolate each bot&apos;s signal using trend, mean reversion, and
        volatility bands. They are estimates, not guarantees.
      </p>
    </div>
  );
}

function BotForecastRow({
  bot,
  horizon,
  currency,
  locale,
}: {
  bot: BotForecast;
  horizon: ForecastHorizon;
  currency: string;
  locale: string;
}) {
  const forecast = bot.horizons.find((item) => item.horizon === horizon);
  if (!forecast) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{bot.botName}</span>
        <span
          className={`font-mono text-sm ${directionClass(forecast.direction)}`}
          style={directionStyle(forecast.direction)}
        >
          {formatPct(forecast.expectedReturnPct)}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">
        {formatPrice(forecast.expectedPrice, currency, locale)} · band{" "}
        {formatPrice(forecast.lowPrice, currency, locale)} –{" "}
        {formatPrice(forecast.highPrice, currency, locale)}
      </p>
    </div>
  );
}

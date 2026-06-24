"use client";

import { useMemo, useState } from "react";
import type { ChartRange } from "@/lib/stocks/chart-range";
import { CHART_RANGE_OPTIONS } from "@/lib/stocks/chart-range";
import { CHART_POSITIVE_COLOR } from "@/lib/stocks/value-colors";
import type { ForecastHorizon, PriceForecast } from "@/lib/types/stocks";

interface ChartArea {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface PriceChartProps {
  history: number[];
  timestamps?: number[];
  currency?: string;
  locale?: string;
  projectionPath?: number[];
  forecast?: PriceForecast;
  sma50?: (number | null)[];
  height?: number;
  showForecast?: boolean;
}

interface ChartPoint {
  x: number;
  y: number;
  value: number;
  timestamp: number;
  kind: "history" | "forecast";
}

function synthesizeTimestamps(count: number): number[] {
  const result: number[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (result.length < count) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      result.unshift(Math.floor(cursor.getTime() / 1000));
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return result;
}

function addTradingDays(timestamp: number, days: number): number {
  const date = new Date(timestamp * 1000);
  let added = 0;

  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added++;
  }

  return Math.floor(date.getTime() / 1000);
}

function buildChartArea(width: number, height: number): ChartArea {
  return {
    left: 58,
    top: 14,
    right: width - 14,
    bottom: height - 30,
  };
}

function buildPoints(
  values: number[],
  timestamps: number[],
  area: ChartArea,
  min: number,
  max: number,
  kind: "history" | "forecast",
): ChartPoint[] {
  const range = max - min || 1;
  const span = area.right - area.left;

  return values.map((value, index) => ({
    x: area.left + (index / Math.max(values.length - 1, 1)) * span,
    y: area.top + (1 - (value - min) / range) * (area.bottom - area.top),
    value,
    timestamp: timestamps[index] ?? timestamps[timestamps.length - 1],
    kind,
  }));
}

function toPath(points: Pick<ChartPoint, "x" | "y">[]): string {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");
}

function formatPrice(value: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatAxisPrice(value: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: value >= 100 ? 0 : 2,
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function formatAxisDate(timestamp: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp * 1000));
}

function formatTooltipDate(timestamp: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp * 1000));
}

function nicePriceTicks(min: number, max: number, count = 4): number[] {
  const range = max - min || 1;
  const step = range / count;
  return Array.from({ length: count + 1 }, (_, index) => min + step * index);
}

function nearestPoint(points: ChartPoint[], x: number): ChartPoint | null {
  if (points.length === 0) return null;

  let nearest = points[0];
  let nearestDistance = Math.abs(points[0].x - x);

  for (const point of points) {
    const distance = Math.abs(point.x - x);
    if (distance < nearestDistance) {
      nearest = point;
      nearestDistance = distance;
    }
  }

  return nearest;
}

export function PriceChart({
  history,
  timestamps,
  currency = "USD",
  locale = "en-US",
  projectionPath = [],
  forecast,
  sma50,
  height = 240,
  showForecast = true,
}: PriceChartProps) {
  const width = 560;
  const trimmedHistory = history;
  const sourceTimestamps =
    timestamps && timestamps.length === history.length
      ? timestamps
      : synthesizeTimestamps(trimmedHistory.length);

  const [hovered, setHovered] = useState<ChartPoint | null>(null);

  const chartData = useMemo(() => {
    const area = buildChartArea(width, height);
    const historyLength = trimmedHistory.length;
    const forecastSegment =
      showForecast && projectionPath.length > historyLength
        ? projectionPath.slice(historyLength - 1)
        : [];
    const combined = [...trimmedHistory, ...forecastSegment.slice(1)];
    const splitIndex = trimmedHistory.length - 1;
    const min = Math.min(...combined);
    const max = Math.max(...combined);

    const historyTimestamps = sourceTimestamps;
    const forecastTimestamps =
      forecastSegment.length > 0
        ? forecastSegment.map((_, index) =>
            index === 0
              ? historyTimestamps[historyTimestamps.length - 1]
              : addTradingDays(
                  historyTimestamps[historyTimestamps.length - 1],
                  index,
                ),
          )
        : [];

    const combinedTimestamps = [
      ...historyTimestamps,
      ...forecastTimestamps.slice(1),
    ];
    const combinedValues = [...trimmedHistory, ...forecastSegment.slice(1)];

    const allPoints = buildPoints(
      combinedValues,
      combinedTimestamps,
      area,
      min,
      max,
      "history",
    );

    const historyPoints = allPoints.slice(0, splitIndex + 1).map((point) => ({
      ...point,
      kind: "history" as const,
    }));
    const forecastPoints = allPoints.slice(splitIndex).map((point) => ({
      ...point,
      kind: "forecast" as const,
    }));

    const bandPoints =
      showForecast && forecast && forecastSegment.length > 1
        ? {
            high: buildPoints(
              [
                ...trimmedHistory.slice(0, -1).map(() => trimmedHistory.at(-1)!),
                ...forecastSegment.slice(1).map((price) => {
                  const ratio = forecast.highPrice / forecast.expectedPrice;
                  return price * ratio;
                }),
              ],
              [
                ...historyTimestamps.slice(0, -1),
                ...forecastTimestamps.slice(1),
              ],
              area,
              min,
              max,
              "forecast",
            ),
            low: buildPoints(
              [
                ...trimmedHistory.slice(0, -1).map(() => trimmedHistory.at(-1)!),
                ...forecastSegment.slice(1).map((price) => {
                  const ratio = forecast.lowPrice / forecast.expectedPrice;
                  return price * ratio;
                }),
              ],
              [
                ...historyTimestamps.slice(0, -1),
                ...forecastTimestamps.slice(1),
              ],
              area,
              min,
              max,
              "forecast",
            ),
          }
        : null;

    const smaPoints =
      sma50 && sma50.length === history.length
        ? sma50
            .map((value, index) => {
              const resolved = value ?? trimmedHistory[0];
              const anchor = historyPoints[index];
              if (!anchor) return null;

              return {
                x: anchor.x,
                y:
                  area.top +
                  (1 - (resolved - min) / (max - min || 1)) *
                    (area.bottom - area.top),
                value: resolved,
                timestamp: anchor.timestamp,
                kind: "history" as const,
              };
            })
            .filter((point) => point != null) as ChartPoint[]
        : null;

    const priceTicks = nicePriceTicks(min, max);
    const dateTicks = [
      historyTimestamps[0],
      historyTimestamps[Math.floor(historyTimestamps.length / 2)],
      historyTimestamps[historyTimestamps.length - 1],
      forecastTimestamps[forecastTimestamps.length - 1],
    ].filter((value, index, array) => value != null && array.indexOf(value) === index);

    return {
      area,
      combined,
      min,
      max,
      splitIndex,
      historyPoints,
      forecastPoints,
      allPoints,
      bandPoints,
      smaPoints,
      priceTicks,
      dateTicks,
      lastHistoryPoint: historyPoints.at(-1) ?? null,
      forecastEndPoint: forecastPoints.at(-1) ?? null,
    };
  }, [
    trimmedHistory,
    sourceTimestamps,
    projectionPath,
    forecast,
    sma50,
    history,
    width,
    height,
    showForecast,
  ]);

  const {
    area,
    min,
    max,
    historyPoints,
    forecastPoints,
    allPoints,
    bandPoints,
    smaPoints,
    priceTicks,
    dateTicks,
    lastHistoryPoint,
    forecastEndPoint,
  } = chartData;

  const activePoint = hovered ?? lastHistoryPoint;

  const handlePointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width;
    setHovered(nearestPoint(allPoints, x));
  };

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full touch-none"
        role="img"
        aria-label="Price history and forecast chart"
        onPointerMove={handlePointer}
        onPointerLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_POSITIVE_COLOR} stopOpacity="0.18" />
            <stop offset="100%" stopColor={CHART_POSITIVE_COLOR} stopOpacity="0.04" />
          </linearGradient>
        </defs>

        <rect
          x={area.left}
          y={area.top}
          width={area.right - area.left}
          height={area.bottom - area.top}
          fill="var(--card)"
          stroke="var(--border)"
          strokeWidth="1"
          rx="4"
        />

        {priceTicks.map((tick) => {
          const y =
            area.top +
            (1 - (tick - min) / (max - min || 1)) * (area.bottom - area.top);

          return (
            <g key={tick}>
              <line
                x1={area.left}
                x2={area.right}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeOpacity="0.55"
                strokeDasharray="3 4"
              />
              <text
                x={area.left - 8}
                y={y + 4}
                textAnchor="end"
                className="text-[10px]"
                fill="var(--muted-foreground)"
              >
                {formatAxisPrice(tick, currency, locale)}
              </text>
            </g>
          );
        })}

        {dateTicks.map((timestamp) => {
          const index = allPoints.findIndex((point) => point.timestamp === timestamp);
          const point =
            index >= 0
              ? allPoints[index]
              : timestamp === dateTicks[dateTicks.length - 1]
                ? forecastEndPoint
                : null;

          if (!point) return null;

          return (
            <text
              key={timestamp}
              x={point.x}
              y={height - 8}
              textAnchor={
                point === lastHistoryPoint
                  ? "middle"
                  : point === allPoints[0]
                    ? "start"
                    : point === forecastEndPoint
                      ? "end"
                      : "middle"
              }
              className="text-[10px]"
              fill="var(--muted-foreground)"
            >
              {formatAxisDate(timestamp, locale)}
            </text>
          );
        })}

        {bandPoints && (
          <path
            d={`${toPath(bandPoints.high)} L${[...bandPoints.low].reverse().map((point) => `${point.x},${point.y}`).join(" L")} Z`}
            fill="url(#forecastBand)"
          />
        )}

        {smaPoints && (
          <path
            d={toPath(smaPoints)}
            fill="none"
            stroke="var(--chart-2)"
            strokeOpacity="0.85"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
        )}

        <path
          d={toPath(historyPoints)}
          fill="none"
          stroke="var(--muted-foreground)"
          strokeWidth="2"
        />

        {showForecast && forecastPoints.length > 1 && (
          <path
            d={toPath(forecastPoints)}
            fill="none"
            stroke={CHART_POSITIVE_COLOR}
            strokeWidth="2.5"
            strokeDasharray="6 4"
          />
        )}

        {activePoint && (
          <>
            <line
              x1={activePoint.x}
              x2={activePoint.x}
              y1={area.top}
              y2={area.bottom}
              stroke="var(--foreground)"
              strokeOpacity="0.2"
              strokeDasharray="4 3"
            />
            <line
              x1={area.left}
              x2={area.right}
              y1={activePoint.y}
              y2={activePoint.y}
              stroke="var(--foreground)"
              strokeOpacity="0.2"
              strokeDasharray="4 3"
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="4.5"
              fill="var(--card)"
              stroke={
                activePoint.kind === "forecast"
                  ? CHART_POSITIVE_COLOR
                  : "var(--foreground)"
              }
              strokeWidth="2"
            />
          </>
        )}
      </svg>

      {activePoint && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Date</p>
            <p className="font-medium text-foreground">
              {formatTooltipDate(activePoint.timestamp, locale)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted">Share price</p>
            <p className="font-mono text-lg font-semibold text-foreground">
              {formatPrice(activePoint.value, currency, locale)}
            </p>
          </div>
          <div className="text-right text-xs text-muted">
            {activePoint.kind === "forecast" ? "Forecast" : "Historical"}
          </div>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
        <span>
          Range {formatPrice(min, currency, locale)} – {formatPrice(max, currency, locale)}
        </span>
        <div className="flex flex-wrap gap-3">
          <span className="flex items-center gap-1">
            <span className="h-0.5 w-4 bg-muted-foreground" /> History
          </span>
          <span className="flex items-center gap-1">
            <span className="h-0.5 w-4 border-t-2 border-dashed border-emerald-400" /> Forecast
          </span>
          {smaPoints && (
            <span className="flex items-center gap-1">
              <span className="h-0.5 w-4 border-t border-dashed border-chart-2" /> SMA 50
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChartRangeTabs({
  value,
  onChange,
}: {
  value: ChartRange;
  onChange: (range: ChartRange) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {CHART_RANGE_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
            value === option.id
              ? "bg-primary/15 text-primary"
              : "text-muted hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function HorizonTabs({
  value,
  onChange,
}: {
  value: ForecastHorizon;
  onChange: (horizon: ForecastHorizon) => void;
}) {
  const options: ForecastHorizon[] = ["5d", "20d", "60d"];
  const labels: Record<ForecastHorizon, string> = {
    "5d": "1W",
    "20d": "1M",
    "60d": "3M",
  };

  return (
    <div className="flex gap-1">
      {options.map((horizon) => (
        <button
          key={horizon}
          type="button"
          onClick={() => onChange(horizon)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
            value === horizon
              ? "bg-primary/15 text-primary"
              : "text-muted hover:text-foreground"
          }`}
        >
          {labels[horizon]}
        </button>
      ))}
    </div>
  );
}

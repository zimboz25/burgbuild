import type { BotConsensus, BotResult, BotSignal } from "@/lib/types/stocks";

const SIGNAL_CLASSES: Record<BotSignal, string> = {
  buy: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
  hold: "border-chart-2/40 bg-chart-2/20 text-chart-2",
  sell: "border-red-500/40 bg-red-500/15 text-red-400",
};

const SIGNAL_DOT_CLASSES: Record<BotSignal, string> = {
  buy: "bg-emerald-400",
  hold: "bg-chart-2",
  sell: "bg-red-400",
};

const SIGNAL_DOT_STYLES: Record<BotSignal, string | undefined> = {
  buy: "#34d399",
  hold: undefined,
  sell: "#f87171",
};

export function BotSignalBadge({
  signal,
  compact = false,
}: {
  signal: BotSignal;
  compact?: boolean;
}) {
  const label = compact
    ? signal === "buy"
      ? "Buy"
      : signal === "sell"
        ? "Sell"
        : "Hold"
    : signal === "buy"
      ? "Buy signal"
      : signal === "sell"
        ? "Sell signal"
        : "Hold";

  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium leading-none ${SIGNAL_CLASSES[signal]}`}
      style={SIGNAL_DOT_STYLES[signal] ? { color: SIGNAL_DOT_STYLES[signal] } : undefined}
    >
      {label}
    </span>
  );
}

export function BotConsensusBadge({
  consensus,
}: {
  consensus: BotConsensus | undefined;
}) {
  if (!consensus) return <span className="text-xs text-muted">—</span>;

  const strong = consensus.bullishCount >= 3;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
        strong
          ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
          : "border-border text-muted"
      }`}
      style={strong ? { color: "#34d399" } : undefined}
    >
      {consensus.bullishCount}/4 bullish
    </span>
  );
}

export function BotIconRow({ results }: { results: BotResult[] }) {
  return (
    <div className="flex gap-1">
      {results.map((result) => (
        <span
          key={result.botId}
          title={`${result.botName}: ${result.signal}`}
          className={`h-2.5 w-2.5 rounded-full ${SIGNAL_DOT_CLASSES[result.signal]}`}
          style={
            SIGNAL_DOT_STYLES[result.signal]
              ? { backgroundColor: SIGNAL_DOT_STYLES[result.signal] }
              : undefined
          }
        />
      ))}
    </div>
  );
}

export function BotBreakdownPanel({
  consensus,
}: {
  consensus: BotConsensus | undefined;
}) {
  if (!consensus) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted">Bot consensus</p>
        <span className="font-mono text-sm text-foreground">
          {consensus.consensusScore}/100
        </span>
      </div>
      <BotConsensusBadge consensus={consensus} />
      <div className="space-y-2">
        {consensus.results.map((result) => (
          <div
            key={result.botId}
            className="rounded-lg border border-border/60 bg-background/40 px-3 py-2"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">
                {result.botName}
              </span>
              <BotSignalBadge signal={result.signal} compact />
            </div>
            <p className="text-xs text-muted">{result.reason}</p>
            <p className="mt-1 font-mono text-[10px] text-muted">
              Confidence {(result.confidence * 100).toFixed(0)}%
            </p>
          </div>
        ))}
      </div>
      <p className="text-[11px] leading-relaxed text-muted">
        Bot signals are research heuristics only — not financial advice or trade
        recommendations.
      </p>
    </div>
  );
}

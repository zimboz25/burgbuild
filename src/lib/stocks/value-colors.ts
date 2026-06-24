import type { CSSProperties } from "react";

const POSITIVE_COLOR = "#34d399";
const NEGATIVE_COLOR = "#f87171";

export function signedValueClass(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "text-muted";
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-red-400";
  return "text-muted";
}

export function signedValueStyle(
  value: number | null | undefined,
): CSSProperties | undefined {
  if (value == null || Number.isNaN(value) || value === 0) return undefined;
  return { color: value > 0 ? POSITIVE_COLOR : NEGATIVE_COLOR };
}

export function directionClass(direction: "up" | "down" | "flat"): string {
  if (direction === "up") return "text-emerald-400";
  if (direction === "down") return "text-red-400";
  return "text-muted";
}

export function directionStyle(
  direction: "up" | "down" | "flat",
): CSSProperties | undefined {
  if (direction === "up") return { color: POSITIVE_COLOR };
  if (direction === "down") return { color: NEGATIVE_COLOR };
  return undefined;
}

export function signedSurfaceClass(value: number): string {
  if (value > 0) return "border-emerald-500/30 bg-emerald-500/10";
  if (value < 0) return "border-red-500/30 bg-red-500/10";
  return "border-border bg-background/40";
}

export const CHART_POSITIVE_COLOR = POSITIVE_COLOR;
export const CHART_NEGATIVE_COLOR = NEGATIVE_COLOR;

"use client";

import { useCallback, useRef, useState } from "react";
import { ATTRIBUTE_LABELS } from "@/lib/constants/attributes";
import { barScaleMax, clampRating } from "@/lib/utils/build-helpers";
import type { AttributeKey } from "@/lib/types/build";

const BAR_MIN = 25;

interface AttributeBarProps {
  attributeKey: AttributeKey;
  color: string;
  colorBright: string;
  current: number;
  buildCap: number;
  lookupBodyMax: number;
  selected: boolean;
  onSelect: () => void;
  onCurrentChange: (value: number) => void;
  onBuildCapChange: (value: number) => void;
}

function pct(value: number, scaleMax: number) {
  const range = Math.max(1, scaleMax - BAR_MIN);
  return ((value - BAR_MIN) / range) * 100;
}

export function AttributeBar({
  attributeKey,
  color,
  colorBright,
  current,
  buildCap,
  lookupBodyMax,
  selected,
  onSelect,
  onCurrentChange,
  onBuildCapChange,
}: AttributeBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState<"current" | "cap" | null>(null);
  const [editText, setEditText] = useState("");

  const scaleMax = barScaleMax(lookupBodyMax, buildCap, current);
  const currentPct = pct(current, scaleMax);
  const capPct = pct(buildCap, scaleMax);
  const lookupPct = pct(lookupBodyMax, scaleMax);
  const lookupDiffers = lookupBodyMax < buildCap;

  const valueFromClick = useCallback(
    (clientY: number, mode: "current" | "cap") => {
      const el = barRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = 1 - (clientY - rect.top) / rect.height;
      const value = clampRating(BAR_MIN + ratio * (scaleMax - BAR_MIN));
      if (mode === "current") {
        onCurrentChange(Math.min(value, buildCap));
      } else {
        onBuildCapChange(Math.max(value, current));
      }
    },
    [buildCap, current, onBuildCapChange, onCurrentChange, scaleMax],
  );

  const startEdit = (field: "current" | "cap") => {
    setEditing(field);
    setEditText(String(field === "current" ? current : buildCap));
  };

  const commitEdit = () => {
    if (!editing) return;
    const parsed = parseInt(editText, 10);
    if (!Number.isNaN(parsed)) {
      if (editing === "current") {
        onCurrentChange(clampRating(Math.min(parsed, buildCap)));
      } else {
        onBuildCapChange(clampRating(Math.max(parsed, current)));
      }
    }
    setEditing(null);
  };

  const shortLabel = ATTRIBUTE_LABELS[attributeKey]
    .replace("Three-Point", "3PT")
    .replace("Mid-Range", "Mid")
    .replace("Offensive", "O")
    .replace("Defensive", "D")
    .replace("Rebound", "REB")
    .replace("Perimeter", "Per")
    .replace("Interior", "Int")
    .replace("Defense", "DEF")
    .replace("Accuracy", "ACC")
    .replace("Handle", "HND")
    .replace("Vertical", "Vert");

  return (
    <div
      className={`flex w-[52px] shrink-0 flex-col items-center ${selected ? "z-10" : ""}`}
      onClick={onSelect}
    >
      <div className="mb-1 text-center">
        {editing === "cap" ? (
          <input
            autoFocus
            className="w-10 rounded bg-black/80 px-1 text-center text-xs text-white"
            value={editText}
            onChange={(e) => setEditText(e.target.value.replace(/\D/g, ""))}
            onBlur={commitEdit}
            onKeyDown={(e) => e.key === "Enter" && commitEdit()}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <button
            type="button"
            className="text-sm font-bold text-white hover:text-accent"
            onClick={(e) => {
              e.stopPropagation();
              startEdit("cap");
            }}
            title="Build cap (Max) — up to 99"
          >
            {buildCap}
          </button>
        )}
        <div className="text-[9px] uppercase tracking-wider text-white/50">
          Max
        </div>
        {lookupDiffers && (
          <div
            className="text-[8px] text-amber-400/80"
            title="Estimated body ceiling from lookup"
          >
            ~{lookupBodyMax} est
          </div>
        )}
      </div>

      <div
        ref={barRef}
        className={`relative h-[220px] w-10 cursor-ns-resize overflow-hidden rounded-sm border-2 bg-[#1a1a1a] ${
          selected
            ? "border-white shadow-[0_0_12px_rgba(255,255,255,0.4)]"
            : "border-black/60"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
          valueFromClick(e.clientY, e.shiftKey ? "current" : "cap");
        }}
        title="Click to set Max. Shift+click for current rating."
      >
        {/* Cap breaker zone above build cap */}
        <div
          className="absolute left-0 right-0 top-0 bg-black/50"
          style={{ height: `${100 - capPct}%` }}
        />
        {/* Lookup ceiling marker */}
        {lookupDiffers && (
          <div
            className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-amber-400/60"
            style={{ bottom: `${lookupPct}%` }}
          />
        )}
        {/* VC upgrade zone (hatched) */}
        <div
          className="absolute left-0 right-0"
          style={{
            bottom: `${currentPct}%`,
            height: `${Math.max(0, capPct - currentPct)}%`,
            background: `repeating-linear-gradient(
              -45deg,
              ${color}88,
              ${color}88 3px,
              ${colorBright}44 3px,
              ${colorBright}44 6px
            )`,
          }}
        />
        {/* Current rating (solid) */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: `${currentPct}%`,
            background: `linear-gradient(to top, ${color}, ${colorBright})`,
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          <span className="text-[9px] font-semibold uppercase tracking-wide text-white/90 drop-shadow">
            {shortLabel}
          </span>
        </div>
      </div>

      <div className="mt-1 text-center">
        {editing === "current" ? (
          <input
            autoFocus
            className="w-10 rounded bg-black/80 px-1 text-center text-xs text-white"
            value={editText}
            onChange={(e) => setEditText(e.target.value.replace(/\D/g, ""))}
            onBlur={commitEdit}
            onKeyDown={(e) => e.key === "Enter" && commitEdit()}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <button
            type="button"
            className="text-sm font-bold text-white hover:text-accent"
            onClick={(e) => {
              e.stopPropagation();
              startEdit("current");
            }}
            title="Current rating"
          >
            {current}
          </button>
        )}
      </div>
    </div>
  );
}

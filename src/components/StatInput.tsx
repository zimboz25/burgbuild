"use client";

import { useEffect, useState } from "react";

interface StatInputProps {
  value: number;
  min?: number;
  max?: number;
  onCommit: (value: number) => void;
  className?: string;
}

export function StatInput({
  value,
  min = 25,
  max = 99,
  onCommit,
  className = "w-14 rounded border border-border bg-background px-2 py-1 text-center text-sm",
}: StatInputProps) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === "") {
      setText(String(value));
      return;
    }
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      setText(String(value));
      return;
    }
    const clamped = Math.min(max, Math.max(min, Math.round(parsed)));
    setText(String(clamped));
    onCommit(clamped);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={text}
      onChange={(e) => setText(e.target.value.replace(/[^0-9]/g, ""))}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        commit(text);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
      className={className}
      aria-label="Attribute value"
    />
  );
}

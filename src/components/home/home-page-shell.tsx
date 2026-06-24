"use client";

import { Component as EtherealShadow } from "@/components/ui/etheral-shadow";

export function HomePageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-0 flex-1 flex-col overflow-hidden bg-section-panel">
      <EtherealShadow
        className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
        color="color-mix(in srgb, var(--primary) 35%, transparent)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 0.35, scale: 1.2 }}
        sizing="fill"
      />
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}

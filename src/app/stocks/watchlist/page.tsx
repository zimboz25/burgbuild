import type { Metadata } from "next";
import { Suspense } from "react";
import { WatchlistWorkspace } from "@/components/stocks/watchlist-workspace";

export const metadata: Metadata = {
  title: "Watchlist",
};

function WatchlistLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24 text-muted">
      Loading watchlist…
    </div>
  );
}

export default function WatchlistPage() {
  return (
    <Suspense fallback={<WatchlistLoading />}>
      <WatchlistWorkspace />
    </Suspense>
  );
}

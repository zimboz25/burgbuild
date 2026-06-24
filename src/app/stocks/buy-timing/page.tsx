import type { Metadata } from "next";
import { Suspense } from "react";
import { BuyTimingWorkspace } from "@/components/stocks/buy-timing-workspace";

export const metadata: Metadata = {
  title: "Buy Timing Scanner",
};

function BuyTimingLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24 text-muted">
      Loading scanner…
    </div>
  );
}

export default function BuyTimingPage() {
  return (
    <Suspense fallback={<BuyTimingLoading />}>
      <BuyTimingWorkspace />
    </Suspense>
  );
}

import vcCurve from "@/data/vc-cost-curve.json";

export function getVcCostForPoint(currentRating: number): number {
  const bracket = vcCurve.brackets.find(
    (b) => currentRating >= b.minRating && currentRating <= b.maxRating,
  );
  return bracket?.vcPerPoint ?? 3800;
}

export function getVcCostForUpgrade(from: number, to: number): number {
  let total = 0;
  for (let r = from; r < to; r++) {
    total += getVcCostForPoint(r);
  }
  return total;
}

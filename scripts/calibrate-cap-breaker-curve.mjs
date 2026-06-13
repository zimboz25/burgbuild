/**
 * Extract (remaining, slotsLeft, boost) triples from calibration samples
 * and search for the best predictive formula.
 */

import fs from "node:fs";
import path from "node:path";

const SAMPLES = [
  { buildMax: 73, increments: [2, 2, 2, 2, 2] },
  { buildMax: 70, increments: [2, 2, 1, 1, 1] },
  { buildMax: 89, increments: [1, 1, 1, 1] },
  { buildMax: 54, increments: [7, 6, 5, 5, 4] },
  { buildMax: 50, increments: [10, 8, 6, 5, 5] },
  { buildMax: 80, increments: [1, 1, 1, 1, 1] },
  { buildMax: 65, increments: [7, 6, 4, 4, 4] },
  { buildMax: 71, increments: [2, 1, 1, 1, 1] },
  { buildMax: 60, increments: [4, 3, 3, 3, 2] },
  { buildMax: 85, increments: [1, 1, 1, 1, 1] },
  { buildMax: 73, increments: [1, 1, 1, 1, 1] },
  { buildMax: 78, increments: [1, 1, 1, 1, 1] },
  { buildMax: 51, increments: [11, 8, 5] },
  { buildMax: 72, increments: [3, 2] },
  { buildMax: 72, increments: [2, 1, 1, 1, 1] },
  { buildMax: 78, increments: [1, 1, 1, 1, 1] },
  { buildMax: 84, increments: [2, 2, 2, 1, 1] },
  { buildMax: 85, increments: [1, 1, 1, 1, 1] },
  { buildMax: 73, increments: [5, 5, 5, 4, 3] },
  { buildMax: 41, increments: [12, 10, 8, 7, 5] },
  { buildMax: 79, increments: [3, 3, 2, 2, 2] },
  { buildMax: 80, increments: [1] },
  { buildMax: 69, increments: [6, 5, 5, 4, 3] },
  { buildMax: 50, increments: [8, 7, 6, 5, 5] },
  { buildMax: 45, increments: [11, 10, 8, 6, 2] },
  { buildMax: 70, increments: [4, 3, 3, 3, 3] },
  { buildMax: 65, increments: [4, 3, 3, 3, 2] },
  { buildMax: 73, increments: [3, 3, 2, 2, 2] },
  { buildMax: 93, increments: [1, 1, 1, 1, 1] },
  { buildMax: 59, increments: [4, 3, 3, 3, 3] },
  { buildMax: 43, increments: [10, 9, 7, 6, 5] },
  { buildMax: 70, increments: [3, 2, 2, 2, 2] },
  { buildMax: 78, increments: [2] },
  { buildMax: 57, increments: [5, 4, 4, 4, 3] },
  { buildMax: 54, increments: [7, 6, 5] },
  { buildMax: 60, increments: [4, 3, 3, 3, 2] },
  { buildMax: 55, increments: [5, 5, 4, 4, 4] },
  { buildMax: 69, increments: [2, 2, 2, 2, 2] },
  { buildMax: 80, increments: [1, 1] },
  { buildMax: 92, increments: [1, 1, 1, 1, 1] },
  { buildMax: 81, increments: [4, 3, 3, 1] },
  { buildMax: 89, increments: [1] },
  { buildMax: 81, increments: [5, 4, 2] },
  { buildMax: 60, increments: [6, 1] },
  { buildMax: 49, increments: [10, 3] },
  { buildMax: 36, increments: [10, 9, 7, 6] },
  { buildMax: 51, increments: [6, 5, 5, 3] },
  { buildMax: 50, increments: [5, 5, 4, 4, 3] },
  { buildMax: 49, increments: [7, 7] },
  { buildMax: 80, increments: [1, 1, 1, 1, 1] },
  { buildMax: 90, increments: [1, 1, 1, 1, 1] },
  { buildMax: 85, increments: [1, 1, 1, 1, 1] },
  { buildMax: 79, increments: [3, 2] },
  { buildMax: 34, increments: [11, 9, 8, 6, 5] },
  { buildMax: 61, increments: [8, 6, 5, 5, 4] },
  { buildMax: 84, increments: [2, 2, 2, 1, 1] },
  { buildMax: 54, increments: [7, 3] },
  { buildMax: 25, increments: [13, 5] },
  { buildMax: 94, increments: [1, 1, 1, 1, 1] },
  { buildMax: 44, increments: [9, 4] },
  { buildMax: 49, increments: [6, 6, 3] },
  { buildMax: 25, increments: [8, 7, 7, 5] },
  { buildMax: 27, increments: [10] },
  { buildMax: 84, increments: [2, 2, 2, 2, 2] },
  { buildMax: 75, increments: [2, 2, 2, 2, 2] },
  { buildMax: 25, increments: [14, 12, 10, 8, 7] },
  { buildMax: 25, increments: [14, 12, 9] },
  { buildMax: 90, increments: [1, 1, 1, 1, 1] },
  { buildMax: 93, increments: [3, 2, 1] },
  { buildMax: 35, increments: [11] },
  { buildMax: 90, increments: [2, 2, 2, 2, 1] },
  { buildMax: 41, increments: [11] },
  { buildMax: 35, increments: [10] },
  { buildMax: 44, increments: [10, 2] },
  { buildMax: 38, increments: [7] },
  { buildMax: 90, increments: [2, 2, 1, 1, 1] },
];

function triplesFromSample(buildMax, increments) {
  const triples = [];
  for (let i = 0; i < increments.length; i++) {
    const remaining = increments.slice(i).reduce((a, b) => a + b, 0);
    const slotsLeft = 5 - i;
    triples.push({ remaining, slotsLeft, boost: increments[i] });
  }
  return triples;
}

const allTriples = [];
for (const s of SAMPLES) {
  for (const t of triplesFromSample(s.buildMax, s.increments)) {
    allTriples.push(t);
  }
}

function predictV1(remaining, slotsLeft) {
  if (remaining <= 0) return 0;
  const base = Math.ceil(remaining / slotsLeft);
  return Math.max(1, Math.min(15, Math.min(remaining, base)));
}

function predictV2(remaining, slotsLeft) {
  if (remaining <= 0) return 0;
  const base = Math.ceil(remaining / slotsLeft);
  const bonus =
    remaining > 10 ? Math.floor((remaining - 10) / (slotsLeft + 2)) : 0;
  return Math.max(1, Math.min(15, Math.min(remaining, base + bonus)));
}

function predictV3(remaining, slotsLeft) {
  if (remaining <= 0) return 0;
  if (remaining <= 10) {
    return Math.max(1, Math.ceil(remaining / slotsLeft));
  }
  const weighted = Math.ceil((remaining * 1.15) / slotsLeft);
  return Math.max(1, Math.min(15, Math.min(remaining, weighted)));
}

function predictV4(remaining, slotsLeft) {
  if (remaining <= 0) return 0;
  const minForRest = Math.max(0, slotsLeft - 1);
  let boost = Math.ceil(remaining / slotsLeft);
  if (remaining > 15 && slotsLeft >= 4) {
    boost += Math.floor((remaining - 10) / 8);
  } else if (remaining > 10 && slotsLeft >= 3) {
    boost += 1;
  }
  boost = Math.max(1, Math.min(15, boost));
  return Math.min(boost, remaining - minForRest);
}

function predictLookupMode(remaining, slotsLeft) {
  const matches = allTriples.filter(
    (t) => t.remaining === remaining && t.slotsLeft === slotsLeft,
  );
  if (matches.length === 0) return predictV1(remaining, slotsLeft);
  const counts = new Map();
  for (const m of matches) {
    counts.set(m.boost, (counts.get(m.boost) ?? 0) + 1);
  }
  let best = predictV1(remaining, slotsLeft);
  let bestCount = 0;
  for (const [boost, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      best = boost;
    }
  }
  return best;
}

function predictV5(remaining, slotsLeft) {
  if (remaining <= 0) return 0;
  const minForRest = Math.max(0, slotsLeft - 1);
  const lookup = predictLookupMode(remaining, slotsLeft);
  const ceil = predictV1(remaining, slotsLeft);
  if (allTriples.some((t) => t.remaining === remaining && t.slotsLeft === slotsLeft)) {
    return Math.min(lookup, remaining - minForRest);
  }
  return Math.min(ceil, remaining - minForRest);
}

function simulate(fn) {
  let exact = 0;
  let total = 0;
  for (const s of SAMPLES) {
    const absMax = s.buildMax + s.increments.reduce((a, b) => a + b, 0);
    let cap = s.buildMax;
    const pred = [];
    for (let used = 0; used < 5; used++) {
      const remaining = absMax - cap;
      if (remaining <= 0) break;
      const slotsLeft = 5 - used;
      const boost = fn(remaining, slotsLeft);
      if (boost <= 0) break;
      pred.push(boost);
      cap += boost;
      if (cap >= absMax) break;
    }
    total++;
    if (
      pred.length === s.increments.length &&
      pred.every((v, i) => v === s.increments[i])
    ) {
      exact++;
    }
  }
  return { exact, total, pct: ((exact / total) * 100).toFixed(1) };
}

console.log("v1 ceil", simulate(predictV1));
console.log("v2 bonus", simulate(predictV2));
console.log("v3 weighted", simulate(predictV3));
console.log("v4 hybrid", simulate(predictV4));
console.log("lookup mode", simulate(predictLookupMode));
console.log("v5 lookup+ceil fallback", simulate(predictV5));

const table = [...key.entries()]
  .map(([k, vals]) => {
    const [remaining, slotsLeft] = k.split(":").map(Number);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const uniq = [...new Set(vals)];
    return { remaining, slotsLeft, avg: Math.round(avg), uniq, n: vals.length };
  })
  .sort((a, b) => b.remaining - a.remaining || b.slotsLeft - a.slotsLeft);

console.log("\nTop lookup keys by remaining:");
console.log(table.slice(0, 25));

import fs from "node:fs";
import path from "node:path";

const outPath = path.join(
  "src",
  "lib",
  "engines",
  "cap-breaker-boost-calibration.ts",
);

/** In-game verified increment rows — these win over majority vote from other samples. */
const VERIFIED_SAMPLES = [
  // SF 6'9" 185 lbs 6'10" WS (Yam Onem calibration build)
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
  // SF 6'7" 225 lbs 7'1" WS (Bay Harbour-Middy — in-game CB screen)
  { buildMax: 84, increments: [2, 2, 2, 1, 1] },
  { buildMax: 85, increments: [1, 1, 1, 1, 1] },
  { buildMax: 73, increments: [5, 5, 5, 4, 3] },
  { buildMax: 41, increments: [12, 10, 8, 7, 5] },
  { buildMax: 79, increments: [3, 3, 2, 2, 2] },
  { buildMax: 80, increments: [1] },
  { buildMax: 69, increments: [6, 5, 5, 4, 3] },
  { buildMax: 71, increments: [1, 1, 1, 1, 1] },
  { buildMax: 81, increments: [1, 1, 1, 1, 1] },
  { buildMax: 75, increments: [1, 1, 1, 1, 1] },
  { buildMax: 80, increments: [3, 3, 2, 2, 2] },
  { buildMax: 92, increments: [1, 1, 1, 1, 1] },
  { buildMax: 79, increments: [1, 1, 1, 1, 1] },
  { buildMax: 50, increments: [8, 7, 6, 5, 5] },
  { buildMax: 45, increments: [11, 10, 8, 6, 2] },
  { buildMax: 70, increments: [4, 3, 3, 3, 3] },
  { buildMax: 80, increments: [1, 1, 1, 1, 1] },
  { buildMax: 80, increments: [1, 1, 1, 1] },
  { buildMax: 72, increments: [1, 1, 1, 1, 1] },
  { buildMax: 65, increments: [4, 3, 3, 3, 2] },
];

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

function collectBoostVotes(samples, includeBuildMax) {
  const votes = new Map();
  for (const s of samples) {
    for (let i = 0; i < s.increments.length; i++) {
      const remaining = s.increments.slice(i).reduce((a, b) => a + b, 0);
      const slotsLeft = 5 - i;
      const k = includeBuildMax
        ? `${s.buildMax}:${remaining}:${slotsLeft}`
        : `${remaining}:${slotsLeft}`;
      if (!votes.has(k)) votes.set(k, new Map());
      const counts = votes.get(k);
      const boost = s.increments[i];
      counts.set(boost, (counts.get(boost) ?? 0) + 1);
    }
  }
  return votes;
}

function pickBoost(counts) {
  let boost = 0;
  let bestCount = 0;
  for (const [b, c] of counts) {
    if (c > bestCount) {
      bestCount = c;
      boost = b;
    }
  }
  return boost;
}

function buildCalibrationTable(verifiedSamples, generalSamples) {
  const verifiedVotes = collectBoostVotes(verifiedSamples, true);
  const buildSpecificGeneral = collectBoostVotes(generalSamples, true);
  const generalVotes = collectBoostVotes(
    [...verifiedSamples, ...generalSamples],
    false,
  );
  const entries = new Map();

  for (const [k, counts] of verifiedVotes.entries()) {
    entries.set(k, pickBoost(counts));
  }

  for (const [k, counts] of buildSpecificGeneral.entries()) {
    if (!entries.has(k)) {
      entries.set(k, pickBoost(counts));
    }
  }

  for (const [k, counts] of generalVotes.entries()) {
    if (!entries.has(k)) {
      entries.set(k, pickBoost(counts));
    }
  }

  return [...entries.entries()]
    .map(([k, boost]) => {
      const parts = k.split(":").map(Number);
      if (parts.length === 3) {
        return { buildMax: parts[0], remaining: parts[1], slotsLeft: parts[2], boost };
      }
      return { buildMax: null, remaining: parts[0], slotsLeft: parts[1], boost };
    })
    .sort((a, b) => {
      const buildA = a.buildMax ?? -1;
      const buildB = b.buildMax ?? -1;
      return (
        buildB - buildA ||
        b.remaining - a.remaining ||
        b.slotsLeft - a.slotsLeft
      );
    });
}

const entries = buildCalibrationTable(VERIFIED_SAMPLES, SAMPLES);

const body =
  entries
    .map((e) => {
      const key =
        e.buildMax === null
          ? `"${e.remaining}:${e.slotsLeft}"`
          : `"${e.buildMax}:${e.remaining}:${e.slotsLeft}"`;
      return `  ${key}: ${e.boost},`;
    })
    .join("\n") + "\n";

const file = `/** Auto-generated from in-game calibration samples. Run \`node scripts/generate-cap-breaker-boost-table.mjs\`. */
export const CALIBRATED_CAP_BREAKER_BOOSTS: Record<string, number> = {
${body}};
`;

fs.writeFileSync(outPath, file);
console.log(`Wrote ${outPath} (${entries.length} entries)`);

import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "src", "data", "potential-anchors");
mkdirSync(outDir, { recursive: true });

const POSITION_RANGES = {
  PG: { minH: 67, maxH: 77, defaultWeight: 180 },
  SG: { minH: 72, maxH: 80, defaultWeight: 190 },
  SF: { minH: 75, maxH: 82, defaultWeight: 210 },
  PF: { minH: 78, maxH: 84, defaultWeight: 230 },
  C: { minH: 80, maxH: 88, defaultWeight: 250 },
};

const ATTRIBUTE_KEYS = [
  "closeShot", "drivingLayup", "drivingDunk", "standingDunk", "postControl",
  "midRange", "threePoint", "freeThrow", "passAccuracy", "ballHandle",
  "speedWithBall", "interiorDefense", "perimeterDefense", "steal", "block",
  "offensiveRebound", "defensiveRebound", "speed", "agility", "strength",
  "vertical", "stamina",
];

const HEIGHT_SENSITIVITY = {
  threePoint: -0.35, midRange: -0.15, ballHandle: -0.25, speedWithBall: -0.2,
  speed: -0.3, agility: -0.25, perimeterDefense: -0.1, steal: -0.05,
  drivingDunk: 0.35, standingDunk: 0.45, block: 0.4, interiorDefense: 0.25,
  offensiveRebound: 0.3, defensiveRebound: 0.35, postControl: 0.3, strength: 0.2,
  closeShot: 0.1, vertical: 0.05,
};

const BASE_MAX = {
  closeShot: 92, drivingLayup: 94, drivingDunk: 88, standingDunk: 85, postControl: 90,
  midRange: 94, threePoint: 92, freeThrow: 99, passAccuracy: 95, ballHandle: 96,
  speedWithBall: 92, interiorDefense: 93, perimeterDefense: 95, steal: 96, block: 94,
  offensiveRebound: 95, defensiveRebound: 97, speed: 95, agility: 94, strength: 96,
  vertical: 95, stamina: 99,
};

function heightFactor(h, minH, maxH) {
  return (h - minH) / Math.max(1, maxH - minH);
}

function generateMaxPotentials(position, heightInches, weightLbs, wingspanInches) {
  const range = POSITION_RANGES[position];
  const hf = heightFactor(heightInches, range.minH, range.maxH);
  const wf = (weightLbs - range.defaultWeight) / 40;
  const wsf = (wingspanInches - heightInches) / 6;
  const result = {};
  for (const key of ATTRIBUTE_KEYS) {
    const hSens = HEIGHT_SENSITIVITY[key] ?? 0;
    const delta = hSens * (hf - 0.5) * 24 + (key === "perimeterDefense" ? 0.15 : 0) * wsf * 8;
    result[key] = Math.round(Math.min(99, Math.max(60, BASE_MAX[key] + delta)));
  }
  return result;
}

for (const [pos, range] of Object.entries(POSITION_RANGES)) {
  const mid = Math.round((range.minH + range.maxH) / 2);
  const heights = [range.minH, mid, range.maxH];
  const weights = [range.defaultWeight];
  const anchors = [];
  for (const h of heights) {
    for (const w of [h - 2, h, h + 2]) {
      for (const weight of weights) {
        anchors.push({
          heightInches: h,
          weightLbs: weight,
          wingspanInches: w,
          maxPotentials: generateMaxPotentials(pos, h, weight, w),
        });
      }
    }
  }
  writeFileSync(join(outDir, `${pos}.json`), JSON.stringify(anchors, null, 2));
  console.log(`Wrote ${pos}.json (${anchors.length} anchors)`);
}

/**
 * Generates badges.json from NBA2KLab 2K26 badge requirements data.
 * Source: https://www.nba2klab.com/badge-requirements
 */
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function ftInToInches(s) {
  const m = s.match(/(\d+)'(\d+)/);
  if (!m) return 69;
  return parseInt(m[1]) * 12 + parseInt(m[2]);
}

const TIER_MAP = ["bronze", "silver", "gold", "hof", "legend"];

const ATTR = {
  "Mid-Range Shot": "midRange",
  "Three-Point Shot": "threePoint",
  "Close Shot": "closeShot",
  Layup: "drivingLayup",
  "Driving Layup": "drivingLayup",
  "Driving Dunk": "drivingDunk",
  "Standing Dunk": "standingDunk",
  "Post Control": "postControl",
  "Pass Accuracy": "passAccuracy",
  "Ball Handle": "ballHandle",
  "Speed With Ball": "speedWithBall",
  "Interior Defense": "interiorDefense",
  "Perimeter Defense": "perimeterDefense",
  Steal: "steal",
  Block: "block",
  "Offensive Rebound": "offensiveRebound",
  "Defensive Rebound": "defensiveRebound",
  Speed: "speed",
  Agility: "agility",
  Strength: "strength",
  Vertical: "vertical",
};

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** @type {Record<string, {category: string, logic: 'and'|'or', rows: {attr: string, bronze: number, silver: number, gold: number, hof: number, legend: number, minH: string, maxH: string}[]}>} */
const BADGE_DATA = {
  Deadeye: {
    category: "shooting",
    logic: "or",
    rows: [
      { attr: "Mid-Range Shot", bronze: 73, silver: 85, gold: 92, hof: 95, legend: 99, minH: "5'9", maxH: "7'4" },
      { attr: "Three-Point Shot", bronze: 73, silver: 85, gold: 92, hof: 95, legend: 99, minH: "5'9", maxH: "7'4" },
    ],
  },
  "Limitless Range": {
    category: "shooting",
    logic: "and",
    rows: [{ attr: "Three-Point Shot", bronze: 83, silver: 89, gold: 93, hof: 96, legend: 99, minH: "5'9", maxH: "7'4" }],
  },
  "Mini Marksman": {
    category: "shooting",
    logic: "or",
    rows: [
      { attr: "Mid-Range Shot", bronze: 71, silver: 82, gold: 94, hof: 97, legend: 99, minH: "5'9", maxH: "6'3" },
      { attr: "Three-Point Shot", bronze: 71, silver: 82, gold: 94, hof: 97, legend: 99, minH: "5'9", maxH: "6'3" },
    ],
  },
  "Set Shot Specialist": {
    category: "shooting",
    logic: "or",
    rows: [
      { attr: "Mid-Range Shot", bronze: 65, silver: 78, gold: 89, hof: 93, legend: 98, minH: "5'9", maxH: "7'4" },
      { attr: "Three-Point Shot", bronze: 65, silver: 78, gold: 89, hof: 95, legend: 98, minH: "5'9", maxH: "7'4" },
    ],
  },
  "Shifty Shooter": {
    category: "shooting",
    logic: "or",
    rows: [
      { attr: "Mid-Range Shot", bronze: 76, silver: 87, gold: 91, hof: 96, legend: 99, minH: "5'9", maxH: "6'11" },
      { attr: "Three-Point Shot", bronze: 76, silver: 87, gold: 91, hof: 96, legend: 99, minH: "5'9", maxH: "6'11" },
    ],
  },
  "Ankle Assassin": {
    category: "playmaking",
    logic: "and",
    rows: [{ attr: "Ball Handle", bronze: 75, silver: 86, gold: 93, hof: 95, legend: 98, minH: "5'9", maxH: "6'10" }],
  },
  "Bail Out": {
    category: "playmaking",
    logic: "and",
    rows: [{ attr: "Pass Accuracy", bronze: 85, silver: 91, gold: 94, hof: 96, legend: 99, minH: "5'9", maxH: "7'4" }],
  },
  "Break Starter": {
    category: "playmaking",
    logic: "and",
    rows: [{ attr: "Pass Accuracy", bronze: 65, silver: 75, gold: 87, hof: 93, legend: 98, minH: "5'9", maxH: "7'4" }],
  },
  Dimer: {
    category: "playmaking",
    logic: "and",
    rows: [{ attr: "Pass Accuracy", bronze: 55, silver: 71, gold: 82, hof: 92, legend: 98, minH: "5'9", maxH: "7'4" }],
  },
  "Handles For Days": {
    category: "playmaking",
    logic: "and",
    rows: [{ attr: "Ball Handle", bronze: 71, silver: 81, gold: 90, hof: 94, legend: 97, minH: "5'9", maxH: "7'0" }],
  },
  "Lightning Launch": {
    category: "playmaking",
    logic: "and",
    rows: [{ attr: "Speed With Ball", bronze: 68, silver: 75, gold: 86, hof: 91, legend: 94, minH: "5'9", maxH: "6'11" }],
  },
  "Strong Handle": {
    category: "playmaking",
    logic: "and",
    rows: [
      { attr: "Ball Handle", bronze: 60, silver: 67, gold: 73, hof: 77, legend: 80, minH: "5'9", maxH: "6'11" },
      { attr: "Strength", bronze: 60, silver: 65, gold: 73, hof: 84, legend: 93, minH: "5'9", maxH: "6'11" },
    ],
  },
  Unpluckable: {
    category: "playmaking",
    logic: "or",
    rows: [
      { attr: "Ball Handle", bronze: 70, silver: 80, gold: 92, hof: 96, legend: 99, minH: "5'9", maxH: "7'4" },
      { attr: "Post Control", bronze: 75, silver: 86, gold: 96, hof: 96, legend: 99, minH: "5'9", maxH: "7'4" },
    ],
  },
  "Versatile Visionary": {
    category: "playmaking",
    logic: "and",
    rows: [{ attr: "Pass Accuracy", bronze: 70, silver: 76, gold: 84, hof: 95, legend: 99, minH: "5'9", maxH: "7'4" }],
  },
  "Aerial Wizard": {
    category: "finishing",
    logic: "or",
    rows: [
      { attr: "Driving Dunk", bronze: 64, silver: 70, gold: 80, hof: 89, legend: 97, minH: "5'9", maxH: "7'4" },
      { attr: "Standing Dunk", bronze: 60, silver: 75, gold: 84, hof: 92, legend: 98, minH: "5'9", maxH: "7'4" },
    ],
  },
  "Float Game": {
    category: "finishing",
    logic: "and",
    rows: [
      { attr: "Close Shot", bronze: 68, silver: 78, gold: 86, hof: 92, legend: 98, minH: "5'9", maxH: "7'4" },
      { attr: "Layup", bronze: 65, silver: 78, gold: 88, hof: 95, legend: 98, minH: "5'9", maxH: "7'4" },
    ],
  },
  "Hook Specialist": {
    category: "finishing",
    logic: "and",
    rows: [
      { attr: "Close Shot", bronze: 60, silver: 75, gold: 87, hof: 94, legend: 99, minH: "5'9", maxH: "7'4" },
      { attr: "Post Control", bronze: 61, silver: 65, gold: 80, hof: 90, legend: 97, minH: "5'9", maxH: "7'4" },
    ],
  },
  "Layup Mixmaster": {
    category: "finishing",
    logic: "and",
    rows: [{ attr: "Driving Layup", bronze: 75, silver: 85, gold: 93, hof: 97, legend: 99, minH: "5'9", maxH: "6'11" }],
  },
  "Paint Prodigy": {
    category: "finishing",
    logic: "and",
    rows: [{ attr: "Close Shot", bronze: 73, silver: 84, gold: 92, hof: 96, legend: 99, minH: "6'3", maxH: "7'4" }],
  },
  "Physical Finisher": {
    category: "finishing",
    logic: "and",
    rows: [
      { attr: "Strength", bronze: 60, silver: 67, gold: 75, hof: 83, legend: 97, minH: "5'9", maxH: "7'4" },
      { attr: "Driving Layup", bronze: 70, silver: 80, gold: 90, hof: 96, legend: 97, minH: "5'9", maxH: "7'4" },
    ],
  },
  "Post Fade Phenom": {
    category: "finishing",
    logic: "and",
    rows: [
      { attr: "Post Control", bronze: 60, silver: 70, gold: 79, hof: 84, legend: 90, minH: "5'9", maxH: "7'4" },
      { attr: "Mid-Range Shot", bronze: 61, silver: 71, gold: 80, hof: 90, legend: 94, minH: "5'9", maxH: "7'4" },
    ],
  },
  "Post Powerhouse": {
    category: "finishing",
    logic: "and",
    rows: [
      { attr: "Post Control", bronze: 64, silver: 75, gold: 85, hof: 93, legend: 98, minH: "6'4", maxH: "7'4" },
      { attr: "Strength", bronze: 70, silver: 79, gold: 86, hof: 95, legend: 96, minH: "6'4", maxH: "7'4" },
    ],
  },
  "Post-Up Poet": {
    category: "finishing",
    logic: "and",
    rows: [{ attr: "Post Control", bronze: 67, silver: 77, gold: 87, hof: 95, legend: 99, minH: "6'0", maxH: "7'4" }],
  },
  Posterizer: {
    category: "finishing",
    logic: "and",
    rows: [
      { attr: "Driving Dunk", bronze: 73, silver: 87, gold: 93, hof: 96, legend: 99, minH: "5'9", maxH: "7'4" },
      { attr: "Vertical", bronze: 65, silver: 75, gold: 80, hof: 85, legend: 90, minH: "5'9", maxH: "7'4" },
    ],
  },
  "Rise Up": {
    category: "finishing",
    logic: "and",
    rows: [
      { attr: "Standing Dunk", bronze: 72, silver: 81, gold: 90, hof: 95, legend: 99, minH: "6'6", maxH: "7'4" },
      { attr: "Vertical", bronze: 60, silver: 62, gold: 66, hof: 69, legend: 71, minH: "6'6", maxH: "7'4" },
    ],
  },
  Challenger: {
    category: "defense",
    logic: "and",
    rows: [{ attr: "Perimeter Defense", bronze: 71, silver: 82, gold: 92, hof: 95, legend: 99, minH: "5'9", maxH: "6'11" }],
  },
  Glove: {
    category: "defense",
    logic: "and",
    rows: [{ attr: "Steal", bronze: 67, silver: 79, gold: 91, hof: 96, legend: 99, minH: "5'9", maxH: "7'0" }],
  },
  "High-Flying Denier": {
    category: "defense",
    logic: "and",
    rows: [
      { attr: "Block", bronze: 68, silver: 78, gold: 88, hof: 92, legend: 99, minH: "6'3", maxH: "7'4" },
      { attr: "Vertical", bronze: 60, silver: 74, gold: 80, hof: 83, legend: 85, minH: "6'3", maxH: "7'4" },
    ],
  },
  "Immovable Enforcer": {
    category: "defense",
    logic: "and",
    rows: [
      { attr: "Perimeter Defense", bronze: 62, silver: 72, gold: 84, hof: 89, legend: 94, minH: "5'9", maxH: "7'4" },
      { attr: "Strength", bronze: 71, silver: 82, gold: 85, hof: 91, legend: 92, minH: "5'9", maxH: "7'4" },
    ],
  },
  Interceptor: {
    category: "defense",
    logic: "and",
    rows: [{ attr: "Steal", bronze: 60, silver: 73, gold: 85, hof: 94, legend: 98, minH: "5'9", maxH: "7'4" }],
  },
  "Off-Ball Pest": {
    category: "defense",
    logic: "or",
    rows: [
      { attr: "Interior Defense", bronze: 69, silver: 76, gold: 85, hof: 94, legend: 97, minH: "5'9", maxH: "7'4" },
      { attr: "Perimeter Defense", bronze: 58, silver: 68, gold: 80, hof: 87, legend: 98, minH: "5'9", maxH: "7'4" },
    ],
  },
  "On-Ball Menace": {
    category: "defense",
    logic: "and",
    rows: [
      { attr: "Perimeter Defense", bronze: 74, silver: 85, gold: 91, hof: 96, legend: 99, minH: "5'9", maxH: "6'9" },
      { attr: "Agility", bronze: 70, silver: 76, gold: 80, hof: 84, legend: 86, minH: "5'9", maxH: "6'9" },
    ],
  },
  "Paint Patroller": {
    category: "defense",
    logic: "and",
    rows: [
      { attr: "Interior Defense", bronze: 60, silver: 70, gold: 77, hof: 84, legend: 89, minH: "6'6", maxH: "7'4" },
      { attr: "Block", bronze: 74, silver: 84, gold: 93, hof: 97, legend: 99, minH: "6'6", maxH: "7'4" },
    ],
  },
  "Pick Dodger": {
    category: "defense",
    logic: "and",
    rows: [
      { attr: "Perimeter Defense", bronze: 73, silver: 83, gold: 90, hof: 97, legend: 99, minH: "5'9", maxH: "6'10" },
      { attr: "Agility", bronze: 71, silver: 75, gold: 79, hof: 85, legend: 92, minH: "5'9", maxH: "6'10" },
    ],
  },
  "Post Lockdown": {
    category: "defense",
    logic: "and",
    rows: [
      { attr: "Interior Defense", bronze: 74, silver: 82, gold: 88, hof: 93, legend: 99, minH: "6'5", maxH: "7'4" },
      { attr: "Strength", bronze: 70, silver: 78, gold: 84, hof: 92, legend: 97, minH: "6'5", maxH: "7'4" },
    ],
  },
  "Boxout Beast": {
    category: "rebounding",
    logic: "or",
    rows: [
      { attr: "Offensive Rebound", bronze: 55, silver: 70, gold: 85, hof: 94, legend: 98, minH: "6'3", maxH: "7'4" },
      { attr: "Defensive Rebound", bronze: 55, silver: 70, gold: 85, hof: 94, legend: 98, minH: "6'3", maxH: "7'4" },
    ],
  },
  "Rebound Chaser": {
    category: "rebounding",
    logic: "or",
    rows: [
      { attr: "Offensive Rebound", bronze: 60, silver: 80, gold: 92, hof: 96, legend: 99, minH: "5'9", maxH: "7'4" },
      { attr: "Defensive Rebound", bronze: 60, silver: 80, gold: 92, hof: 96, legend: 99, minH: "5'9", maxH: "7'4" },
    ],
  },
  "Brick Wall": {
    category: "physical",
    logic: "and",
    rows: [{ attr: "Strength", bronze: 72, silver: 83, gold: 91, hof: 95, legend: 99, minH: "6'5", maxH: "7'4" }],
  },
  "Slippery Off-Ball": {
    category: "physical",
    logic: "and",
    rows: [
      { attr: "Speed", bronze: 57, silver: 73, gold: 85, hof: 92, legend: 99, minH: "5'9", maxH: "6'9" },
      { attr: "Agility", bronze: 57, silver: 65, gold: 77, hof: 88, legend: 96, minH: "5'9", maxH: "6'9" },
    ],
  },
  "Pogo Stick": {
    category: "physical",
    logic: "and",
    rows: [{ attr: "Vertical", bronze: 63, silver: 70, gold: 77, hof: 83, legend: 88, minH: "6'4", maxH: "7'4" }],
  },
};

const badges = Object.entries(BADGE_DATA).map(([name, def]) => {
  const minH = Math.max(...def.rows.map((r) => ftInToInches(r.minH)));
  const maxH = Math.min(...def.rows.map((r) => ftInToInches(r.maxH)));

  const tiers = TIER_MAP.map((tier, i) => {
    const key = tier === "hof" ? "hof" : tier;
    const tierKey = tier === "bronze" ? "bronze" : tier === "silver" ? "silver" : tier === "gold" ? "gold" : tier === "hof" ? "hof" : "legend";
    const requirements = def.rows.map((row) => ({
      attribute: ATTR[row.attr],
      value: row[tierKey],
    }));
    return {
      tier,
      statGroups: [{ logic: def.logic, requirements }],
    };
  });

  return {
    id: slug(name),
    name,
    category: def.category,
    heightGate: { type: "range", minInches: minH, maxInches: maxH },
    tiers,
    source: "nba2klab",
  };
});

writeFileSync(
  join(__dirname, "..", "src", "data", "badges.json"),
  JSON.stringify(badges, null, 2),
);
console.log(`Wrote ${badges.length} badges from NBA2KLab data`);

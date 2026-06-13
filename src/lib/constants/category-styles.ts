import type { AttributeKey } from "@/lib/types/build";

export const CATEGORY_COLORS: Record<
  string,
  { fill: string; fillBright: string; label: string }
> = {
  Finishing: {
    fill: "#00AEEF",
    fillBright: "#33c5ff",
    label: "Finishing",
  },
  Shooting: {
    fill: "#39B54A",
    fillBright: "#5fd66e",
    label: "Shooting",
  },
  Playmaking: {
    fill: "#F7941E",
    fillBright: "#ffad4d",
    label: "Playmaking",
  },
  Defense: {
    fill: "#ED1C24",
    fillBright: "#ff4d54",
    label: "Defense",
  },
  Rebounding: {
    fill: "#662D91",
    fillBright: "#8b4db8",
    label: "Rebounding",
  },
  Physical: {
    fill: "#C69C6D",
    fillBright: "#dbb896",
    label: "Physical",
  },
};

export const BAR_GROUPS: {
  label: string;
  keys: AttributeKey[];
}[] = [
  {
    label: "Finishing",
    keys: [
      "closeShot",
      "drivingLayup",
      "drivingDunk",
      "standingDunk",
      "postControl",
    ],
  },
  {
    label: "Shooting",
    keys: ["midRange", "threePoint", "freeThrow"],
  },
  {
    label: "Playmaking",
    keys: ["passAccuracy", "ballHandle", "speedWithBall"],
  },
  {
    label: "Defense",
    keys: ["interiorDefense", "perimeterDefense", "steal", "block"],
  },
  {
    label: "Rebounding",
    keys: ["offensiveRebound", "defensiveRebound"],
  },
  {
    label: "Physical",
    keys: ["speed", "agility", "strength", "vertical"],
  },
];

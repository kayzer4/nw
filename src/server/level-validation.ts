import type { LevelPreset, PlacedLamp } from "@/game/level";
import { lampLightsPoint } from "@/game/light";
import { advanceSession, createSession } from "@/game/simulation";
import { allOnWasteSeconds, planIdealLighting, playIdealPlan } from "./ideal-lighting";
import { coverageSamples } from "./coverage-samples";
import { modelFootprintRadius } from "./model-footprint";
import { walkSegmentAllowed } from "./walk-geometry";

export function lampExclusiveShares(lamps: readonly PlacedLamp[], samples: ReturnType<typeof coverageSamples>): number[] {
  const exclusive = lamps.map(() => 0);
  for (const { position } of samples) {
    let only = -1;
    for (let index = 0; index < lamps.length; index++) {
      if (!lampLightsPoint(lamps[index], position)) continue;
      if (only >= 0) { only = -2; break; }
      only = index;
    }
    if (only >= 0) exclusive[only]++;
  }
  return exclusive.map((count) => count / samples.length);
}

function outcome(level: LevelPreset, states: Record<string, boolean>, firstDuration: number, secondStates = states) {
  const start = { ...createSession(level), phase: "playing" as const };
  const first = advanceSession(level, start, states, firstDuration);
  return first.phase === "playing" ? advanceSession(level, first, secondStates, level.rules.shiftSeconds) : first;
}

export function assessLevel(level: LevelPreset): number {
  const maxLamps = Math.max(10, Math.ceil(level.roads.length * 5 / 11));
  if (!level.citizens.length || !level.lamps.length || level.lamps.length > maxLamps) throw new Error(`Level needs residents and 1–${maxLamps} lamps.`);
  if (level.citizens.some((citizen) => !Number.isFinite(citizen.speed) || citizen.speed <= 0)) throw new Error("Resident walking speed must be positive.");
  for (const building of level.buildings) {
    if (modelFootprintRadius(building.asset) * building.scale > 0.881) throw new Error(`Building ${building.id} overlaps its road clearance.`);
  }
  for (const citizen of level.citizens) for (let index = 0; index < citizen.route.length; index++) {
    if (!walkSegmentAllowed(citizen.route[index], citizen.route[(index + 1) % citizen.route.length], level.roads, level.grid)) {
      throw new Error(`Resident ${citizen.id} leaves a sidewalk or an authorized crossing.`);
    }
  }
  const [firstLamp] = level.lamps;
  if (level.lamps.some((lamp) => lamp.radius !== firstLamp.radius || lamp.color !== firstLamp.color || lamp.intensity !== firstLamp.intensity)) {
    throw new Error("Lamp power, color and radius must be uniform within a level.");
  }
  const samples = coverageSamples(level.roads, level.citizens);
  const missing = samples.filter(({ position }) => !level.lamps.some((lamp) => lampLightsPoint(lamp, position)));
  if (missing.length) throw new Error(`${missing.length} road or route samples cannot be lit.`);
  if (lampExclusiveShares(level.lamps, samples).some((share) => share === 0)) throw new Error("Level contains a redundant lamp.");

  const on = Object.fromEntries(level.lamps.map((lamp) => [lamp.id, true]));
  const off = Object.fromEntries(level.lamps.map((lamp) => [lamp.id, false]));
  const shift = level.rules.shiftSeconds;
  if (allOnWasteSeconds(level) > 0 && outcome(level, on, shift).phase !== "lost") throw new Error("Leaving unnecessary lamps on must lose.");
  if (outcome(level, off, shift).phase !== "lost") throw new Error("Leaving every lamp off must lose.");

  const plan = planIdealLighting(level);
  if (!plan || playIdealPlan(level, plan).phase !== "won") throw new Error("Keeping every resident lit must win.");
  // More required switches and less tolerance for redundant light mean a harder shift.
  const excessAllowance = level.rules.startingEnergy / level.rules.energyPerLampSecond;
  const possibleWaste = level.lamps.length * shift - plan.lampSeconds;
  const tolerance = Math.min(1, excessAllowance / Math.max(1, possibleWaste));
  return Math.max(1, Math.min(5, Math.round(1 + plan.switches * 0.3 + (1 - tolerance) * 2)));
}

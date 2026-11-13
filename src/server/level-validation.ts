import type { LevelPreset } from "@/game/level";
import { lampLightsPoint } from "@/game/light";
import { advanceSession, createSession, routePosition } from "@/game/simulation";
import { coverageSamples } from "./coverage-samples";

function outcome(level: LevelPreset, states: Record<string, boolean>, firstDuration: number, secondStates = states) {
  const start = { ...createSession(level), phase: "playing" as const };
  const first = advanceSession(level, start, states, firstDuration);
  return first.phase === "playing" ? advanceSession(level, first, secondStates, level.rules.shiftSeconds) : first;
}

export function assessLevel(level: LevelPreset): number {
  if (!level.citizens.length || !level.lamps.length || level.lamps.length > 7) throw new Error("Level needs residents and 1–7 lamps.");
  const [firstLamp] = level.lamps;
  if (level.lamps.some((lamp) => lamp.radius !== firstLamp.radius || lamp.color !== firstLamp.color || lamp.intensity !== firstLamp.intensity)) {
    throw new Error("Lamp power, color and radius must be uniform within a level.");
  }
  const samples = coverageSamples(level.roads, level.citizens);
  const missing = samples.filter(({ position }) => !level.lamps.some((lamp) => lampLightsPoint(lamp, position, level.buildings)));
  if (missing.length) throw new Error(`${missing.length} road or route samples cannot be lit.`);

  const on = Object.fromEntries(level.lamps.map((lamp) => [lamp.id, true]));
  const off = Object.fromEntries(level.lamps.map((lamp) => [lamp.id, false]));
  const shift = level.rules.shiftSeconds;
  if (outcome(level, on, shift).phase !== "lost") throw new Error("Leaving every lamp on must lose.");
  if (outcome(level, off, shift).phase !== "lost") throw new Error("Leaving every lamp off must lose.");
  if (outcome(level, on, shift * 0.7, off).phase !== "won") throw new Error("No baseline winning strategy found.");

  let requiredFraction = 0;
  for (let t = 0; t < shift; t += 10) {
    const points = level.citizens.map((citizen) => routePosition(citizen, t));
    let minimum = level.lamps.length;
    for (let mask = 1; mask < 2 ** level.lamps.length; mask++) {
      const count = level.lamps.reduce((sum, _, index) => sum + Number(Boolean(mask & (1 << index))), 0);
      if (count >= minimum) continue;
      const lit = points.filter((point) => level.lamps.some((lamp, index) => Boolean(mask & (1 << index)) && lampLightsPoint(lamp, point, level.buildings))).length;
      if (lit >= Math.ceil(points.length / 2)) minimum = count;
    }
    requiredFraction += minimum / level.lamps.length;
  }
  const pressure = requiredFraction / (shift / 10) / 0.72;
  return Math.max(1, Math.min(5, Math.round(pressure * 4 + (level.lamps.length - 3) * 0.6 + (6.5 - firstLamp.radius) * 0.5)));
}

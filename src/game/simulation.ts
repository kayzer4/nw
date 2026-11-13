import type { CitizenRoute, LevelPreset, Position2 } from "./level";
import { lampLightsPoint } from "./light";
export interface SessionSnapshot {
  phase: "ready" | "playing" | "won" | "lost";
  elapsedSeconds: number; energy: number; satisfaction: number;
  citizenLit: Record<string, boolean>;
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export function routePosition(citizen: CitizenRoute, elapsedSeconds: number): Position2 {
  if (!citizen.route.length) return [0, 0];
  const progress = elapsedSeconds / citizen.secondsPerPoint;
  const index = Math.floor(progress) % citizen.route.length;
  const fraction = progress - Math.floor(progress);
  const a = citizen.route[index], b = citizen.route[(index + 1) % citizen.route.length];
  return [a[0] + (b[0] - a[0]) * fraction, a[1] + (b[1] - a[1]) * fraction];
}
export function citizenLighting(level: LevelPreset, states: Readonly<Record<string, boolean>>, elapsed: number) {
  return Object.fromEntries(level.citizens.map((citizen) => {
    const point = routePosition(citizen, elapsed);
    return [citizen.id, level.lamps.some((lamp) => states[lamp.id] && lampLightsPoint(lamp, point))];
  })) as Record<string, boolean>;
}
export function createSession(level: LevelPreset): SessionSnapshot {
  const states = Object.fromEntries(level.lamps.map((lamp) => [lamp.id, lamp.initiallyOn]));
  return { phase: "ready", elapsedSeconds: 0, energy: level.rules.startingEnergy, satisfaction: level.rules.startingSatisfaction, citizenLit: citizenLighting(level, states, 0) };
}
export function advanceSession(level: LevelPreset, current: SessionSnapshot, states: Readonly<Record<string, boolean>>, elapsed: number): SessionSnapshot {
  if (current.phase !== "playing") return current;
  const nextTime = Math.min(level.rules.shiftSeconds, Math.max(current.elapsedSeconds, elapsed));
  const dt = nextTime - current.elapsedSeconds;
  const onCount = level.lamps.filter((lamp) => states[lamp.id]).length;
  const energy = Math.max(0, current.energy - onCount * level.rules.energyPerLampSecond * dt);
  let satisfaction = current.satisfaction;
  // Integrate along the route, including after a throttled background tab resumes.
  for (let time = current.elapsedSeconds; time < nextTime;) {
    const step = Math.min(0.25, nextTime - time);
    const lighting = citizenLighting(level, states, time + step / 2);
    const litCount = Object.values(lighting).filter(Boolean).length;
    satisfaction = clamp(satisfaction + (litCount >= Math.ceil(level.citizens.length / 2) ? 0.35 : -0.6) * step, 0, 100);
    time += step;
  }
  const citizenLit = citizenLighting(level, states, nextTime);
  const phase = energy <= 0 || satisfaction <= level.rules.minimumSatisfaction ? "lost" : nextTime >= level.rules.shiftSeconds ? "won" : "playing";
  return { phase, elapsedSeconds: nextTime, energy, satisfaction, citizenLit };
}

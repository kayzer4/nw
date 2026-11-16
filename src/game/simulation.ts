import type { CitizenRoute, LevelPreset, Position2 } from "./level";
import { lampLightsPoint } from "./light";
import { countBits, coveredResidents, lampCoverageMasks } from "./lighting";
export interface SessionSnapshot {
  phase: "ready" | "playing" | "won" | "lost";
  elapsedSeconds: number; energy: number; satisfaction: number;
  citizenLit: Record<string, boolean>;
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const routeDistances = new WeakMap<CitizenRoute, { cumulative: number[]; total: number }>();
function distancesFor(citizen: CitizenRoute) {
  const cached = routeDistances.get(citizen);
  if (cached) return cached;
  const cumulative = [0];
  for (let index = 0; index < citizen.route.length; index++) {
    const a = citizen.route[index], b = citizen.route[(index + 1) % citizen.route.length];
    cumulative.push(cumulative[index] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const distances = { cumulative, total: cumulative.at(-1) ?? 0 };
  routeDistances.set(citizen, distances);
  return distances;
}
export function routePosition(citizen: CitizenRoute, elapsedSeconds: number): Position2 {
  if (!citizen.route.length) return [0, 0];
  const { cumulative, total } = distancesFor(citizen);
  if (total <= 0 || citizen.speed <= 0) return citizen.route[0];
  const distance = (Math.max(0, elapsedSeconds) * citizen.speed) % total;
  for (let index = 0; index < citizen.route.length; index++) {
    if (distance >= cumulative[index + 1]) continue;
    const a = citizen.route[index], b = citizen.route[(index + 1) % citizen.route.length];
    const fraction = (distance - cumulative[index]) / (cumulative[index + 1] - cumulative[index]);
    return [a[0] + (b[0] - a[0]) * fraction, a[1] + (b[1] - a[1]) * fraction];
  }
  return citizen.route[0];
}
export function citizenLighting(level: LevelPreset, states: Readonly<Record<string, boolean>>, elapsed: number) {
  return Object.fromEntries(level.citizens.map((citizen) => {
    const point = routePosition(citizen, elapsed);
    return [citizen.id, level.lamps.some((lamp) => states[lamp.id] && lampLightsPoint(lamp, point))];
  })) as Record<string, boolean>;
}
export function lightingEconomy(level: LevelPreset, states: Readonly<Record<string, boolean>>, elapsed: number) {
  const positions = level.citizens.map((citizen) => routePosition(citizen, elapsed));
  const coverage = lampCoverageMasks(level.lamps, positions);
  const activeMask = level.lamps.reduce((mask, lamp, index) => mask | (states[lamp.id] ? 1 << index : 0), 0);
  return {
    litCount: countBits(coveredResidents(coverage, activeMask)),
    activeLampCount: countBits(activeMask),
  };
}
export function createSession(level: LevelPreset): SessionSnapshot {
  const states = Object.fromEntries(level.lamps.map((lamp) => [lamp.id, lamp.initiallyOn]));
  return { phase: "ready", elapsedSeconds: 0, energy: level.rules.startingEnergy, satisfaction: level.rules.startingSatisfaction, citizenLit: citizenLighting(level, states, 0) };
}
export function advanceSession(level: LevelPreset, current: SessionSnapshot, states: Readonly<Record<string, boolean>>, elapsed: number): SessionSnapshot {
  if (current.phase !== "playing") return current;
  const nextTime = Math.min(level.rules.shiftSeconds, Math.max(current.elapsedSeconds, elapsed));
  let energy = current.energy;
  let satisfaction = current.satisfaction;
  // Integrate along the route, including after a throttled background tab resumes.
  for (let time = current.elapsedSeconds; time < nextTime;) {
    const step = Math.min(0.25, nextTime - time);
    const { litCount, activeLampCount } = lightingEconomy(level, states, time + step / 2);
    satisfaction = clamp(satisfaction + (litCount >= level.rules.requiredLitResidents ? level.rules.comfortGainPerSecond : -level.rules.comfortLossPerSecond) * step, 0, 100);
    energy = Math.max(0, energy - activeLampCount * level.rules.energyPerLampSecond * step);
    time += step;
    if (energy <= 0 || satisfaction <= level.rules.minimumSatisfaction) {
      return { phase: "lost", elapsedSeconds: time, energy, satisfaction, citizenLit: citizenLighting(level, states, time) };
    }
  }
  const citizenLit = citizenLighting(level, states, nextTime);
  const phase = nextTime >= level.rules.shiftSeconds ? "won" : "playing";
  return { phase, elapsedSeconds: nextTime, energy, satisfaction, citizenLit };
}

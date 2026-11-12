import type { CitizenRoute, LevelPreset, Position2 } from "./level";

export type CoverageIndex = Record<string, string[][]>;
export interface SessionSnapshot {
  phase: "ready" | "playing" | "won" | "lost";
  elapsedSeconds: number;
  energy: number;
  satisfaction: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function segmentHitsBox(a: Position2, b: Position2, center: Position2, halfExtent = 1.05) {
  const minX = center[0] - halfExtent;
  const maxX = center[0] + halfExtent;
  const minZ = center[1] - halfExtent;
  const maxZ = center[1] + halfExtent;
  let low = 0;
  let high = 1;
  const axes: [number, number, number, number][] = [
    [a[0], b[0] - a[0], minX, maxX],
    [a[1], b[1] - a[1], minZ, maxZ],
  ];
  for (const [origin, delta, min, max] of axes) {
    if (Math.abs(delta) < 1e-6) {
      if (origin < min || origin > max) return false;
      continue;
    }
    const t1 = (min - origin) / delta;
    const t2 = (max - origin) / delta;
    low = Math.max(low, Math.min(t1, t2));
    high = Math.min(high, Math.max(t1, t2));
    if (low > high) return false;
  }
  return high > 0 && low < 1;
}

function isBlocked(lamp: Position2, citizen: Position2, level: LevelPreset) {
  return level.buildings.some((building) =>
    segmentHitsBox(lamp, citizen, [building.position[0], building.position[2]]),
  );
}

function isInRange(lamp: LevelPreset["lamps"][number], point: Position2) {
  const dx = lamp.position[0] - point[0];
  const dz = lamp.position[2] - point[1];
  return dx * dx + dz * dz <= lamp.radius * lamp.radius;
}

/** Build once on level load; ticks then inspect only lamps that can reach each route point. */
export function buildCoverageIndex(level: LevelPreset): CoverageIndex {
  return Object.fromEntries(level.citizens.map((citizen) => [
    citizen.id,
    citizen.route.map((point) => level.lamps
      .filter((lamp) => isInRange(lamp, point) && !isBlocked([lamp.position[0], lamp.position[2]], point, level))
      .map((lamp) => lamp.id)),
  ]));
}

export function createSession(level: LevelPreset): SessionSnapshot {
  return { phase: "ready", elapsedSeconds: 0, energy: level.rules.startingEnergy, satisfaction: level.rules.startingSatisfaction };
}

export function advanceSession(
  level: LevelPreset,
  current: SessionSnapshot,
  lampStates: Readonly<Record<string, boolean>>,
  coverage: CoverageIndex,
): SessionSnapshot {
  if (current.phase !== "playing") return current;

  const elapsedSeconds = current.elapsedSeconds + 1;
  const activeLampCount = Object.values(lampStates).filter(Boolean).length;
  const energy = Math.max(0, current.energy - activeLampCount * level.rules.energyPerLampSecond);
  let litCitizens = 0;
  for (const citizen of level.citizens) {
    const routeIndex = Math.floor(elapsedSeconds / citizen.secondsPerPoint) % citizen.route.length;
    const candidates = coverage[citizen.id]?.[routeIndex] ?? [];
    if (candidates.some((lampId) => lampStates[lampId])) litCitizens += 1;
  }
  const satisfactionChange = litCitizens / Math.max(1, level.citizens.length) >= 0.5 ? 0.45 : -2.2;
  const satisfaction = clamp(current.satisfaction + satisfactionChange, 0, 100);
  const phase = energy <= 0 || satisfaction <= level.rules.minimumSatisfaction
    ? "lost"
    : elapsedSeconds >= level.rules.shiftSeconds ? "won" : "playing";
  return { phase, elapsedSeconds, energy, satisfaction };
}

export function routePosition(citizen: CitizenRoute, elapsedSeconds: number): Position2 {
  const progress = elapsedSeconds / citizen.secondsPerPoint;
  const segment = Math.floor(progress) % citizen.route.length;
  const fraction = progress - Math.floor(progress);
  const from = citizen.route[segment];
  const to = citizen.route[(segment + 1) % citizen.route.length];
  return [from[0] + (to[0] - from[0]) * fraction, from[1] + (to[1] - from[1]) * fraction];
}

import type { CitizenRoute, PlacedAsset, Position2 } from "@/game/level";

export interface CoverageSample { position: Position2; tangent: Position2 }

export function coverageSamples(roads: readonly PlacedAsset[], citizens: readonly CitizenRoute[]): CoverageSample[] {
  const samples = new Map<string, CoverageSample>();
  const add = (position: Position2, tangent: Position2) => {
    const key = `${position[0].toFixed(2)},${position[1].toFixed(2)}`;
    if (!samples.has(key)) samples.set(key, { position, tangent });
  };
  // Sample the whole road tile, including road sections with no resident route.
  for (const road of roads) {
    for (const dx of [-0.75, -0.5, 0, 0.5, 0.75]) {
      for (const dz of [-0.75, -0.5, 0, 0.5, 0.75]) {
        add([road.position[0] + dx, road.position[2] + dz], [1, 0]);
      }
    }
  }
  for (const citizen of citizens) {
    citizen.route.forEach((from, index) => {
      const to = citizen.route[(index + 1) % citizen.route.length];
      const dx = to[0] - from[0], dz = to[1] - from[1];
      const length = Math.hypot(dx, dz);
      const tangent: Position2 = length ? [dx / length, dz / length] : [1, 0];
      const steps = Math.max(1, Math.ceil(length / 0.25));
      for (let step = 0; step <= steps; step++) add([from[0] + dx * step / steps, from[1] + dz * step / steps], tangent);
    });
  }
  return [...samples.values()];
}

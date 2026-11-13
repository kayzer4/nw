import type { LevelPreset, PlacedAsset, Position2 } from "@/game/level";

/** Verify an interpolated walk segment against the road model's walkable strips. */
export function walkSegmentAllowed(from: Position2, to: Position2, roads: readonly PlacedAsset[], grid: LevelPreset["grid"]): boolean {
  const byCell = new Map(roads.map((road) => {
    const x = Math.floor((road.position[0] + grid.width * grid.cellSize / 2) / grid.cellSize);
    const z = Math.floor((road.position[2] + grid.depth * grid.cellSize / 2) / grid.cellSize);
    return [`${x},${z}`, road] as const;
  }));
  const distance = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const steps = Math.max(1, Math.ceil(distance / 0.1));
  for (let step = 0; step <= steps; step++) {
    const fraction = step / steps;
    const x = from[0] + (to[0] - from[0]) * fraction;
    const z = from[1] + (to[1] - from[1]) * fraction;
    const cellX = Math.floor((x + grid.width * grid.cellSize / 2) / grid.cellSize);
    const cellZ = Math.floor((z + grid.depth * grid.cellSize / 2) / grid.cellSize);
    const road = byCell.get(`${cellX},${cellZ}`);
    if (!road) return false;
    const dx = x - road.position[0], dz = z - road.position[2];
    const cosine = Math.cos(road.rotationY), sine = Math.sin(road.rotationY);
    const localX = dx * cosine - dz * sine;
    const localZ = dx * sine + dz * cosine;
    const left = localX <= -0.6, right = localX >= 0.6;
    const front = localZ <= -0.6, back = localZ >= 0.6;
    const model = road.asset.split("/").at(-1);
    const walkable = model === "road-straight.glb" ? front || back
      : model === "road-crossing.glb" ? front || back || Math.abs(localX) <= 0.35
      : model === "road-end.glb" ? left || front || back
      : model === "road-crossroad.glb" ? (left || right) && (front || back)
      : model === "road-intersection.glb" ? front || (back && (left || right))
      : model === "road-bend-square.glb" ? front || right || (left && back)
      : false;
    if (!walkable) return false;
  }
  return true;
}

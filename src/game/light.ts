import type { LevelPreset, PlacedLamp, Position2 } from "./level";
export const LAMP_HEAD: Position2 = [0, -0.15];
export const LAMP_HEAD_HEIGHT = 0.62;
export function lampCone(lamp: PlacedLamp) {
  const height = LAMP_HEAD_HEIGHT * lamp.scale;
  return { height, angle: Math.atan(lamp.radius / height), distance: Math.hypot(lamp.radius, height) };
}
function hitsBuilding(a: Position2, b: Position2, x: number, z: number) {
  let lo = 0, hi = 1;
  for (const [origin, delta, min, max] of [[a[0], b[0] - a[0], x - 1.05, x + 1.05], [a[1], b[1] - a[1], z - 1.05, z + 1.05]]) {
    if (Math.abs(delta) < 1e-8) { if (origin < min || origin > max) return false; continue; }
    const t1 = (min - origin) / delta, t2 = (max - origin) / delta;
    lo = Math.max(lo, Math.min(t1, t2)); hi = Math.min(hi, Math.max(t1, t2));
    if (lo > hi) return false;
  }
  return hi > 0 && lo < 1;
}
export function lampLightsPoint(lamp: PlacedLamp, point: Position2, buildings: LevelPreset["buildings"]) {
  const dx = lamp.position[0] - point[0], dz = lamp.position[2] - point[1];
  if (dx * dx + dz * dz > lamp.radius * lamp.radius) return false;
  return !buildings.some((b) => hitsBuilding([lamp.position[0], lamp.position[2]], point, b.position[0], b.position[2]));
}

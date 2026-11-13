import type { PlacedLamp, Position2 } from "./level";
export const LAMP_HEAD: Position2 = [0, -0.15];
export const LAMP_HEAD_HEIGHT = 0.62;
export function lampFootprintCenter(lamp: PlacedLamp): Position2 {
  const x = LAMP_HEAD[0] * lamp.scale, z = LAMP_HEAD[1] * lamp.scale;
  const cosine = Math.cos(lamp.rotationY), sine = Math.sin(lamp.rotationY);
  return [lamp.position[0] + x * cosine + z * sine, lamp.position[2] - x * sine + z * cosine];
}
export function lampCone(lamp: PlacedLamp) {
  const height = LAMP_HEAD_HEIGHT * lamp.scale;
  return { height, angle: Math.atan(lamp.radius / height) };
}
export function lampLightsPoint(lamp: PlacedLamp, point: Position2) {
  const center = lampFootprintCenter(lamp);
  const dx = center[0] - point[0], dz = center[1] - point[1];
  return dx * dx + dz * dz <= lamp.radius * lamp.radius;
}

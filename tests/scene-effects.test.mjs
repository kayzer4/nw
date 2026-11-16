import { expect, test } from "bun:test";
import * as sceneEffects from "../src/client/scene-effects";

const { hoverRingState, wrappedGridCoordinate } = sceneEffects;

test("hover ring remains hidden until a lamp is targeted and then pulses within a controlled range", () => {
  expect(hoverRingState(false, 0)).toEqual({ scale: 0, opacity: 0 });
  const first = hoverRingState(true, 0);
  const later = hoverRingState(true, Math.PI / 8);
  expect(first.opacity).toBeGreaterThanOrEqual(0.7);
  expect(first.opacity).toBeLessThanOrEqual(1);
  expect(later.scale).toBeGreaterThan(first.scale);
  expect(later.scale).toBeLessThanOrEqual(1.14);
});

test("grid coordinates repeat around the camera instead of ending at a fixed plane edge", () => {
  expect(wrappedGridCoordinate(0, 2)).toBe(0);
  expect(wrappedGridCoordinate(17, 2)).toBe(1);
  expect(wrappedGridCoordinate(-1, 2)).toBe(1);
});

test("infinite grid stays centered on the camera while it pans beyond one tile", () => {
  expect(sceneEffects.gridCenterAtCamera?.(201.75, -64.5)).toEqual([201.75, -64.5]);
});

test("grid fades before its small camera-centred plane can show an edge", () => {
  const surface = sceneEffects.infiniteGridSurface?.();
  expect(surface).toEqual({ size: 96, fadeStart: 32, fadeEnd: 42 });
});

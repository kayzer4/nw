import { expect, test } from "bun:test";
import * as sceneEffects from "../src/client/scene-effects";

const { hoverRingState } = sceneEffects;

test("hover ring remains hidden until a lamp is targeted and then pulses within a controlled range", () => {
  expect(hoverRingState(false, 0)).toEqual({ scale: 0, opacity: 0 });
  const first = hoverRingState(true, 0);
  const later = hoverRingState(true, Math.PI / 8);
  expect(first.opacity).toBeGreaterThanOrEqual(0.7);
  expect(first.opacity).toBeLessThanOrEqual(1);
  expect(later.scale).toBeGreaterThan(first.scale);
  expect(later.scale).toBeLessThanOrEqual(1.14);
});

test("infinite grid uses the renderer's camera-following fade", () => {
  expect(sceneEffects.infiniteGridOptions?.()).toEqual({
    size: 32,
    fadeDistance: 240,
    fadeStrength: 0.65,
  });
});

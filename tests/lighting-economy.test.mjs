import { expect, test } from "bun:test";
import { advanceSession, createSession } from "../src/game/simulation";

const lamp = (id, x) => ({ id, position: [x, 0, 0], rotationY: 0, scale: 1, radius: 2, color: "#fff", intensity: 1, initiallyOn: false });
const level = {
  lamps: [lamp("near", 0), lamp("extra", 0.5)],
  citizens: [{ id: "walker", route: [[0, 0]], speed: 1 }],
  rules: { shiftSeconds: 30, startingEnergy: 10, energyPerLampSecond: 1,
    startingSatisfaction: 70, minimumSatisfaction: 20, requiredLitResidents: 1,
    comfortGainPerSecond: 0.5, comfortLossPerSecond: 1.5 },
};

test("serving a resident does not consume the budget reserved for needless lamps", () => {
  const start = { ...createSession(level), phase: "playing" };
  const necessary = advanceSession(level, start, { near: true, extra: false }, 5);
  const wasteful = advanceSession(level, start, { near: true, extra: true }, 5);
  const dark = advanceSession(level, start, { near: false, extra: false }, 5);
  expect(necessary.energy).toBe(10);
  expect(wasteful.energy).toBe(5);
  expect(necessary.satisfaction).toBe(wasteful.satisfaction);
  expect(dark.energy).toBe(necessary.energy);
  expect(dark.satisfaction).toBeLessThan(necessary.satisfaction);
});

import { expect, test } from "bun:test";
import { advanceSession, createSession } from "../src/game/simulation";

const lamp = (id, x) => ({ id, position: [x, 0, 0], rotationY: 0, scale: 1, radius: 2, color: "#fff", intensity: 1, initiallyOn: false });
const level = {
  lamps: [lamp("near", 0), lamp("extra", 0.5)],
  citizens: [{ id: "walker", route: [[0, 0]], speed: 1 }],
  rules: { shiftSeconds: 30, startingEnergy: 10, energyPerLampSecond: 1,
    startingSatisfaction: 70, minimumSatisfaction: 50, requiredLitResidents: 1,
    comfortGainPerSecond: 0.5, comfortLossPerSecond: 1.5 },
};

test("darkness does not end a shift while the energy supply remains", () => {
  const start = { ...createSession(level), phase: "playing" };
  const result = advanceSession(level, start, { near: false, extra: false }, 30);
  expect(result.phase).toBe("won");
  expect(result.energy).toBe(10);
});

test("energy depletion remains the only loss condition", () => {
  const start = { ...createSession(level), phase: "playing" };
  expect(advanceSession(level, start, { near: true, extra: true }, 5).phase).toBe("lost");
});

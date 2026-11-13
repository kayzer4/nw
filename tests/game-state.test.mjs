import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import { lampFootprintCenter, lampLightsPoint } from "../src/game/light";
import { advanceSession, citizenLighting, createSession, routePosition } from "../src/game/simulation";
import { assessLevel } from "../src/server/level-validation";

const ids = ["first-shift", "market-lights", "north-gate", "west-end", "south-crossing"];
const load = (id) => JSON.parse(fs.readFileSync(`data/levels/${id}.json`, "utf8"));

describe("ready level contracts", () => {
  for (const id of ids) test(id, () => {
    const level = load(id);
    expect(assessLevel(level)).toBe(level.difficulty);
    const allOn = Object.fromEntries(level.lamps.map((lamp) => [lamp.id, true]));
    const allOff = Object.fromEntries(level.lamps.map((lamp) => [lamp.id, false]));
    const start = { ...createSession(level), phase: "playing" };
    expect(advanceSession(level, start, allOn, 100).phase).toBe("lost");
    expect(advanceSession(level, start, allOff, 100).phase).toBe("lost");
    const partial = advanceSession(level, start, allOn, 70);
    expect(advanceSession(level, partial, allOff, 100).phase).toBe("won");
  });
});

test("rendered route and lighting state use the same interpolated position", () => {
  const level = load("first-shift");
  const citizen = level.citizens[0];
  const halfway = routePosition(citizen, citizen.secondsPerPoint / 2);
  expect(halfway[0]).toBeCloseTo((citizen.route[0][0] + citizen.route[1][0]) / 2);
  expect(halfway[1]).toBeCloseTo((citizen.route[0][1] + citizen.route[1][1]) / 2);
  const states = Object.fromEntries(level.lamps.map((lamp) => [lamp.id, true]));
  const expected = level.lamps.some((lamp) => lampLightsPoint(lamp, halfway, level.buildings));
  expect(citizenLighting(level, states, citizen.secondsPerPoint / 2)[citizen.id]).toBe(expected);
});

test("light radius is measured from the rendered lamp head", () => {
  const lamp = load("first-shift").lamps[0];
  const center = lampFootprintCenter(lamp);
  expect(lampLightsPoint(lamp, center, [])).toBe(true);
  expect(lampLightsPoint(lamp, [center[0] + lamp.radius + 0.01, center[1]], [])).toBe(false);
});

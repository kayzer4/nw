import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import { lampCone, lampFootprintCenter, lampLightFactor, lampLightsPoint } from "../src/game/light";
import { advanceSession, citizenLighting, createSession, routePosition } from "../src/game/simulation";
import { assessLevel, lampExclusiveShares } from "../src/server/level-validation";
import { walkSegmentAllowed } from "../src/server/walk-geometry";
import { modelFootprintRadius } from "../src/server/model-footprint";
import { coverageSamples } from "../src/server/coverage-samples";
import { buildLevel } from "../src/server/level-builder";
import { findMinimumActionPlan } from "../src/server/action-planner";
import { planIdealLighting, playIdealPlan } from "../src/server/ideal-lighting";

const ids = ["first-shift", "market-lights", "north-gate", "west-end", "south-crossing"];
const energyAllowances = [0.4, 0.3, 0.22, 0.16, 0.1];
const load = (id) => JSON.parse(fs.readFileSync(`data/levels/${id}.json`, "utf8"));

describe("ready level contracts", () => {
  for (const id of ids) test(id, () => {
    const level = load(id);
    expect("minimumSatisfaction" in level.rules).toBe(false);
    expect(assessLevel(level)).toBe(level.difficulty);
    expect(level.lamps.length).toBeLessThanOrEqual(Math.max(3, Math.ceil(level.roads.length * 5 / 11)));
    expect(Math.min(...lampExclusiveShares(level.lamps, coverageSamples(level.roads, level.citizens)))).toBeGreaterThanOrEqual(0.04);
    const allOn = Object.fromEntries(level.lamps.map((lamp) => [lamp.id, true]));
    const allOff = Object.fromEntries(level.lamps.map((lamp) => [lamp.id, false]));
    const start = { ...createSession(level), phase: "playing" };
    expect(advanceSession(level, start, Object.fromEntries(level.lamps.map((lamp) => [lamp.id, false])), 10).phase).toBe("playing");
    expect(advanceSession(level, start, Object.fromEntries(level.lamps.map((lamp) => [lamp.id, true])), 10).phase).toBe("playing");
    expect(["won", "lost"]).toContain(advanceSession(level, start, allOn, level.rules.shiftSeconds).phase);
    const darkOutcome = advanceSession(level, start, allOff, level.rules.shiftSeconds);
    expect(darkOutcome.phase).toBe("lost");
    expect(darkOutcome.energy).toBe(level.rules.startingEnergy);
    const passive = Object.fromEntries(level.lamps.map((lamp) => [lamp.id, lamp.initiallyOn]));
    expect(["won", "lost"]).toContain(advanceSession(level, start, passive, level.rules.shiftSeconds).phase);
    const plan = findMinimumActionPlan(level);
    expect(plan).not.toBeNull();
    expect(plan.actions).toBe(0);
    let session = start;
    let states = Object.fromEntries(level.lamps.map((lamp) => [lamp.id, lamp.initiallyOn]));
    for (const action of plan.steps) {
      session = advanceSession(level, session, states, action.time);
      expect(session.phase).toBe("playing");
      states = Object.fromEntries(level.lamps.map((lamp, index) => [lamp.id, Boolean(action.mask & (1 << index))]));
    }
    expect(["won", "lost"]).toContain(advanceSession(level, session, states, level.rules.shiftSeconds).phase);
  });
});

test("each level budget is its ideal lighting cost plus the intended difficulty allowance", () => {
  for (const [index, id] of ids.entries()) {
    const level = load(id);
    const ideal = planIdealLighting(level);
    expect(ideal).not.toBeNull();
    const idealEnergy = ideal.lampSeconds * level.rules.energyPerLampSecond;
    expect(level.rules.startingEnergy / idealEnergy - 1).toBeCloseTo(energyAllowances[index], 1);
  }
});

test("lamp target scales with road count for other seeds", () => {
  for (const seed of [4, 6, 11, 25]) {
    const level = buildLevel(String(seed));
    const target = Math.max(3, Math.ceil(level.roads.length * 5 / 11));
    expect(level.lamps.length).toBeLessThanOrEqual(target);
    expect(Math.min(...lampExclusiveShares(level.lamps, coverageSamples(level.roads, level.citizens)))).toBeGreaterThanOrEqual(0.04);
    const plan = findMinimumActionPlan(level);
    expect(plan).not.toBeNull();
    expect(plan.actions).toBe(0);
    const ideal = planIdealLighting(level);
    expect(ideal).not.toBeNull();
    expect(playIdealPlan(level, ideal).phase).toBe("won");
  }
});

test("regenerated late catalog seed has a fully lit winning plan", () => {
  const level = buildLevel("12345", 4);
  const ideal = planIdealLighting(level);
  expect(ideal.switches).toBeGreaterThanOrEqual(1);
  expect(playIdealPlan(level, ideal).phase).toBe("won");
});

test("rendered route and lighting state use the same interpolated position", () => {
  const level = load("first-shift");
  const citizen = level.citizens[0];
  const halfwayTime = Math.hypot(citizen.route[1][0] - citizen.route[0][0], citizen.route[1][1] - citizen.route[0][1]) / citizen.speed / 2;
  const halfway = routePosition(citizen, halfwayTime);
  expect(halfway[0]).toBeCloseTo((citizen.route[0][0] + citizen.route[1][0]) / 2);
  expect(halfway[1]).toBeCloseTo((citizen.route[0][1] + citizen.route[1][1]) / 2);
  const states = Object.fromEntries(level.lamps.map((lamp) => [lamp.id, true]));
  const expected = level.lamps.some((lamp) => lampLightsPoint(lamp, halfway));
  expect(citizenLighting(level, states, halfwayTime)[citizen.id]).toBe(expected);
});

test("resident speed is constant across short and long route segments", () => {
  const citizen = { id: "test", asset: "", scale: 1, speed: 1, route: [[0, 0], [1, 0], [1, 3], [0, 3]] };
  expect(routePosition(citizen, 0.4)).toEqual([0.4, 0]);
  expect(routePosition(citizen, 1.4)[1]).toBeCloseTo(0.4);
  expect(routePosition(citizen, 2.4)[1]).toBeCloseTo(1.4);
  expect(routePosition(citizen, 8.4)[0]).toBeCloseTo(0.4);
});

test("light radius is measured from the rendered lamp head", () => {
  const lamp = load("first-shift").lamps[0];
  const center = lampFootprintCenter(lamp);
  expect(lampLightsPoint(lamp, center)).toBe(true);
  expect(lampLightsPoint(lamp, [center[0] + lamp.radius + 0.01, center[1]])).toBe(false);
  const cone = lampCone(lamp);
  expect(Math.tan(cone.angle) * cone.height).toBeCloseTo(lamp.radius);
  expect(lampLightFactor(lamp, center)).toBeCloseTo(1);
  expect(lampLightFactor(lamp, [center[0] + lamp.radius * 0.5, center[1]])).toBeLessThan(0.3);
});

test("residents cross the road only on a marked crossing model", () => {
  const level = load("first-shift");
  const crossing = level.roads.find((road) => road.asset.endsWith("/road-crossing.glb"));
  const straight = level.roads.find((road) => road.asset.endsWith("/road-straight.glb"));
  const intersection = level.roads.find((road) => road.asset.endsWith("/road-intersection.glb"));
  expect(crossing).toBeDefined();
  expect(straight).toBeDefined();
  expect(intersection).toBeDefined();
  const crossingPoints = (road) => {
    const x = road.position[0], z = road.position[2], rotation = road.rotationY;
    return [[x - Math.sin(rotation) * 0.9, z - Math.cos(rotation) * 0.9], [x + Math.sin(rotation) * 0.9, z + Math.cos(rotation) * 0.9]];
  };
  expect(walkSegmentAllowed(...crossingPoints(crossing), level.roads, level.grid)).toBe(true);
  expect(walkSegmentAllowed(...crossingPoints(straight), level.roads, level.grid)).toBe(false);
  const toWorld = (road, x, z) => [road.position[0] + x * Math.cos(road.rotationY) + z * Math.sin(road.rotationY), road.position[2] - x * Math.sin(road.rotationY) + z * Math.cos(road.rotationY)];
  expect(walkSegmentAllowed(toWorld(intersection, -0.9, 0.9), toWorld(intersection, 0.9, 0.9), level.roads, level.grid)).toBe(false);
});

test("placed building geometry stays inside its cell", () => {
  for (const id of ids) for (const building of load(id).buildings) {
    expect(modelFootprintRadius(building.asset) * building.scale).toBeLessThanOrEqual(0.881);
    expect(building.position[1] + building.scale * 0.05).toBeCloseTo(0);
  }
});

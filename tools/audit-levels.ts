import fs from "node:fs";
import path from "node:path";
import type { LevelPreset, LevelSummary } from "../src/game/level";
import { advanceSession, createSession } from "../src/game/simulation";
import { planIdealLighting, playIdealPlan } from "../src/server/ideal-lighting";

const directory = path.join(process.cwd(), "data/levels");
const catalog = JSON.parse(fs.readFileSync(path.join(directory, "index.json"), "utf8")) as LevelSummary[];
for (const { id } of catalog) {
  const level = JSON.parse(fs.readFileSync(path.join(directory, `${id}.json`), "utf8")) as LevelPreset;
  const plan = planIdealLighting(level);
  if (!plan) throw new Error(`${id}: a resident cannot stay lit throughout the shift`);
  const ideal = playIdealPlan(level, plan);
  const start = { ...createSession(level), phase: "playing" as const };
  const allOn = Object.fromEntries(level.lamps.map((lamp) => [lamp.id, true]));
  const allOff = Object.fromEntries(level.lamps.map((lamp) => [lamp.id, false]));
  const onOutcome = advanceSession(level, start, allOn, level.rules.shiftSeconds);
  const offOutcome = advanceSession(level, start, allOff, level.rules.shiftSeconds);
  if (ideal.phase !== "won" || onOutcome.phase !== "lost" || offOutcome.phase !== "won") {
    throw new Error(`${id}: expected ideal win, all-on loss, and all-off win, got ${ideal.phase}/${onOutcome.phase}/${offOutcome.phase}`);
  }
  console.log(`${id.padEnd(16)} ideal: WON (${plan.switches} clicks, ${ideal.energy.toFixed(1)} kWh spare)  all on: LOST at ${onOutcome.elapsedSeconds}s  all off: WON`);
}

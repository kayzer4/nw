import fs from "node:fs";
import path from "node:path";
import type { LevelPreset, LevelSummary } from "../src/game/level";
import { findMinimumActionPlan } from "../src/server/action-planner";

const directory = path.join(process.cwd(), "data/levels");
const catalog = JSON.parse(fs.readFileSync(path.join(directory, "index.json"), "utf8")) as LevelSummary[];
for (const summary of catalog) {
  const level = JSON.parse(fs.readFileSync(path.join(directory, `${summary.id}.json`), "utf8")) as LevelPreset;
  const plan = findMinimumActionPlan(level);
  if (!plan) throw new Error(`${summary.id}: no winning plan found on a two-second decision grid`);
  console.log(`${summary.id.padEnd(16)} ${String(level.rules.shiftSeconds).padStart(2)}s  ${String(plan.actions).padStart(2)} clicks  ${plan.actionsPerMinute.toFixed(2)} APM  ${plan.remainingEnergy.toFixed(1)} kWh left`);
}

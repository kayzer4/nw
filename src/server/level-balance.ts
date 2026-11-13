import type { LevelPreset } from "../game/level";
import { findMinimumActionPlan } from "./action-planner";

/** Keep a generated seed winnable without making a passive shift sufficient. */
export function balanceGeneratedLevel(level: LevelPreset, minimumActions = 3): LevelPreset {
  const currentPlan = findMinimumActionPlan(level);
  if (currentPlan && currentPlan.actions >= minimumActions && currentPlan.actions <= 8) return level;
  const maximumLampSeconds = Math.floor(level.lamps.length * level.rules.shiftSeconds * 0.9);
  let fallback: LevelPreset | null = null;
  for (let lampSeconds = maximumLampSeconds; lampSeconds >= Math.floor(level.rules.shiftSeconds * 0.5); lampSeconds -= 2) {
    const candidate = {
      ...level,
      rules: { ...level.rules, startingEnergy: lampSeconds * level.rules.energyPerLampSecond },
    };
    const plan = findMinimumActionPlan(candidate);
    if (!plan) continue;
    fallback = candidate;
    if (plan.actions >= minimumActions && plan.actions <= 8) return candidate;
  }
  if (fallback) return fallback;
  throw new Error(`Could not balance a playable shift for seed ${level.seed}.`);
}

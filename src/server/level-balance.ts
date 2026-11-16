import type { LevelPreset } from "../game/level";
import { planIdealLighting, playIdealPlan } from "./ideal-lighting";

/** Every enabled lamp draws power; the player gets a difficulty-based margin over the ideal plan. */
export function balanceGeneratedLevel(level: LevelPreset, energyAllowance = 0.4): LevelPreset {
  const plan = planIdealLighting(level);
  if (!plan) throw new Error(`Residents cannot stay lit throughout seed ${level.seed}.`);
  const idealLampSeconds = plan.lampSeconds;
  const allOnLampSeconds = level.lamps.length * level.rules.shiftSeconds;
  if (idealLampSeconds >= allOnLampSeconds) {
    throw new Error(`Seed ${level.seed} has no rational-lighting alternative to every lamp being on.`);
  }
  const budgetLampSeconds = Math.min(idealLampSeconds * (1 + energyAllowance), allOnLampSeconds - 0.25);
  const balanced = {
    ...level,
    rules: { ...level.rules, startingEnergy: budgetLampSeconds * level.rules.energyPerLampSecond },
  };
  if (playIdealPlan(balanced, plan).phase !== "won") throw new Error(`Ideal lighting must win seed ${level.seed}.`);
  return balanced;
}

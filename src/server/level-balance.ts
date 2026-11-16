import type { LevelPreset } from "../game/level";
import { allOnWasteSeconds, planIdealLighting, playIdealPlan } from "./ideal-lighting";

/** Budget only for unnecessary lights; following residents needs no sacrifice. */
export function balanceGeneratedLevel(level: LevelPreset, wasteTolerance = 0.5): LevelPreset {
  const plan = planIdealLighting(level);
  if (!plan) throw new Error(`Residents cannot stay lit throughout seed ${level.seed}.`);
  const wasteSeconds = allOnWasteSeconds(level);
  const balanced = {
    ...level,
    rules: { ...level.rules, startingEnergy: Math.max(1, wasteSeconds * wasteTolerance) * level.rules.energyPerLampSecond },
  };
  if (playIdealPlan(balanced, plan).phase !== "won") throw new Error(`Ideal lighting must win seed ${level.seed}.`);
  return balanced;
}

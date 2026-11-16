import type { LevelPreset } from "../game/level";
import { lightingEconomy } from "../game/simulation";

interface Step { time: number; mask: number; }
interface SearchState {
  mask: number;
  actions: number;
  energy: number;
  comfort: number;
  previous: SearchState | null;
  step: Step | null;
}

const countBits = (value: number) => {
  let count = 0;
  for (let bits = value; bits; bits &= bits - 1) count++;
  return count;
};

/** Finds the fewest lamp clicks on a two-second decision grid. Used only by offline tools and validation. */
export function findMinimumActionPlan(level: LevelPreset, maxActions = 16): {
  actions: number;
  actionsPerMinute: number;
  steps: Step[];
  remainingEnergy: number;
  remainingComfort: number;
} | null {
  const { lamps, rules } = level;
  if (!lamps.length || lamps.length > 8) return null;
  const interval = 2;
  const masks = Array.from({ length: 1 << lamps.length }, (_, mask) =>
    Object.fromEntries(lamps.map((lamp, index) => [lamp.id, Boolean(mask & (1 << index))])));
  const initialMask = lamps.reduce((mask, lamp, index) => mask | (lamp.initiallyOn ? 1 << index : 0), 0);
  let frontier = new Map<string, SearchState[]>([[`${initialMask}:0`, [{
    mask: initialMask, actions: 0, energy: rules.startingEnergy,
    comfort: rules.startingSatisfaction, previous: null, step: null,
  }]]]);

  for (let start = 0; start < rules.shiftSeconds; start += interval) {
    const duration = Math.min(interval, rules.shiftSeconds - start);
    const effects = masks.map((states) => {
      const deltas: { comfort: number; energy: number }[] = [];
      for (let time = start; time < start + duration - 1e-8; time += 0.25) {
        const dt = Math.min(0.25, start + duration - time);
        const { litCount, excessLamps } = lightingEconomy(level, states, time + dt / 2);
        deltas.push({
          comfort: (litCount >= rules.requiredLitResidents ? rules.comfortGainPerSecond : -rules.comfortLossPerSecond) * dt,
          energy: excessLamps * rules.energyPerLampSecond * dt,
        });
      }
      return deltas;
    });
    const next = new Map<string, SearchState[]>();
    for (const states of frontier.values()) for (const state of states) for (let mask = 0; mask < masks.length; mask++) {
      const change = countBits(state.mask ^ mask);
      const actions = state.actions + change;
      if (actions > maxActions) continue;
      let energy = state.energy;
      let comfort = state.comfort;
      for (const effect of effects[mask]) {
        comfort = Math.min(100, comfort + effect.comfort);
        energy -= effect.energy;
        if (comfort <= rules.minimumSatisfaction + 1e-7 || energy <= 1e-7) break;
      }
      if (comfort <= rules.minimumSatisfaction + 1e-7 || energy <= 1e-7) continue;
      const key = `${mask}:${actions}`;
      const peers = next.get(key) ?? [];
      if (peers.some((peer) => peer.energy >= energy - 1e-7 && peer.comfort >= comfort - 1e-7)) continue;
      for (let index = peers.length - 1; index >= 0; index--) {
        if (energy >= peers[index].energy - 1e-7 && comfort >= peers[index].comfort - 1e-7) peers.splice(index, 1);
      }
      peers.push({ mask, actions, energy, comfort, previous: change ? state : state.previous, step: change ? { time: start, mask } : state.step });
      next.set(key, peers);
    }
    frontier = next;
    if (!frontier.size) return null;
  }

  const best = [...frontier.values()].flat().sort((a, b) => a.actions - b.actions || b.comfort - a.comfort)[0];
  if (!best) return null;
  const steps: Step[] = [];
  for (let state: SearchState | null = best; state?.step; state = state.previous) steps.push(state.step);
  steps.reverse();
  return {
    actions: best.actions,
    actionsPerMinute: Math.round(best.actions * 6000 / rules.shiftSeconds) / 100,
    steps,
    remainingEnergy: Math.round(best.energy * 100) / 100,
    remainingComfort: Math.round(best.comfort * 100) / 100,
  };
}

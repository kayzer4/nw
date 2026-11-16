import type { LevelPreset } from "../game/level";
import { countBits, coveredResidents, lampCoverageMasks, necessaryLampCount } from "../game/lighting";
import { routePosition, advanceSession, createSession, type SessionSnapshot } from "../game/simulation";

export interface LightingStep { time: number; mask: number }
export interface IdealLightingPlan { steps: LightingStep[]; switches: number; lampSeconds: number }

function coverageAt(level: LevelPreset, time: number) {
  return lampCoverageMasks(level.lamps, level.citizens.map((citizen) => routePosition(citizen, time)));
}

/** A human-paced reference policy: cover every resident, using only needed lamps. */
export function planIdealLighting(level: LevelPreset): IdealLightingPlan | null {
  const allResidents = (1 << level.citizens.length) - 1;
  const steps: LightingStep[] = [];
  let previous = level.lamps.reduce((mask, lamp, index) => mask | (lamp.initiallyOn ? 1 << index : 0), 0);
  let switches = 0, lampSeconds = 0;
  for (let time = 0; time < level.rules.shiftSeconds; time += 2) {
    const duration = Math.min(2, level.rules.shiftSeconds - time);
    const samples = [];
    for (let offset = 0; offset < duration - 1e-8; offset += 0.25) samples.push(coverageAt(level, time + offset + 0.125));
    let best = -1, bestScore = Infinity;
    for (let mask = 0; mask < 1 << level.lamps.length; mask++) {
      if (!samples.every((coverage) => coveredResidents(coverage, mask) === allResidents)) continue;
      const score = countBits(mask) * 100 + countBits(mask ^ previous);
      if (score < bestScore) { best = mask; bestScore = score; }
    }
    if (best < 0) return null;
    if (best !== previous) { steps.push({ time, mask: best }); switches += countBits(best ^ previous); }
    lampSeconds += countBits(best) * duration;
    previous = best;
  }
  return { steps, switches, lampSeconds };
}

export function allOnWasteSeconds(level: LevelPreset): number {
  const allOn = (1 << level.lamps.length) - 1;
  let waste = 0;
  for (let time = 0; time < level.rules.shiftSeconds; time += 0.25) {
    const coverage = coverageAt(level, time + 0.125);
    waste += (level.lamps.length - necessaryLampCount(coverage, allOn)) * 0.25;
  }
  return waste;
}

export function playIdealPlan(level: LevelPreset, plan: IdealLightingPlan) {
  let session: SessionSnapshot = { ...createSession(level), phase: "playing" };
  let mask = level.lamps.reduce((value, lamp, index) => value | (lamp.initiallyOn ? 1 << index : 0), 0);
  const states = () => Object.fromEntries(level.lamps.map((lamp, index) => [lamp.id, Boolean(mask & (1 << index))]));
  for (const step of plan.steps) {
    session = advanceSession(level, session, states(), step.time);
    if (session.phase !== "playing") return session;
    mask = step.mask;
  }
  return advanceSession(level, session, states(), level.rules.shiftSeconds);
}

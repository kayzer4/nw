import type { PlacedLamp, Position2 } from "./level";
import { lampLightsPoint } from "./light";

export function lampCoverageMasks(lamps: readonly PlacedLamp[], positions: readonly Position2[]): number[] {
  return lamps.map((lamp) => positions.reduce((mask, point, index) =>
    mask | (lampLightsPoint(lamp, point) ? 1 << index : 0), 0));
}

export function countBits(mask: number): number {
  let count = 0;
  for (let bits = mask; bits; bits &= bits - 1) count++;
  return count;
}

export function coveredResidents(coverage: readonly number[], lampMask: number): number {
  return coverage.reduce((residents, covered, index) => residents | (lampMask & (1 << index) ? covered : 0), 0);
}

/** The smallest subset of active lamps that serves everyone who is currently lit. */
export function necessaryLampCount(coverage: readonly number[], activeMask: number): number {
  const residents = coveredResidents(coverage, activeMask);
  if (!residents) return 0;
  let minimum = countBits(activeMask);
  for (let subset = activeMask; subset; subset = (subset - 1) & activeMask) {
    if (countBits(subset) < minimum && coveredResidents(coverage, subset) === residents) minimum = countBits(subset);
  }
  return minimum;
}

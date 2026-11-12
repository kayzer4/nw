export type Position3 = readonly [number, number, number];
export type Position2 = readonly [number, number];

export interface PlacedAsset {
  id: string;
  asset: string;
  position: Position3;
  rotationY: number;
  scale: number;
}

export interface PlacedLamp extends PlacedAsset {
  radius: number;
  initiallyOn: boolean;
}

export interface CitizenRoute {
  id: string;
  asset: string;
  scale: number;
  route: readonly Position2[];
  secondsPerPoint: number;
}

export interface GameRules {
  shiftSeconds: number;
  startingEnergy: number;
  energyPerLampSecond: number;
  startingSatisfaction: number;
  minimumSatisfaction: number;
}

export interface LevelPreset {
  id: string;
  title: string;
  subtitle: string;
  grid: { width: number; depth: number; cellSize: number };
  roads: readonly PlacedAsset[];
  buildings: readonly PlacedAsset[];
  lamps: readonly PlacedLamp[];
  citizens: readonly CitizenRoute[];
  rules: GameRules;
}

export interface LevelSummary { id: string; title: string; subtitle: string }

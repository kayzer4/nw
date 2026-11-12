import fs from "node:fs";
import path from "node:path";
import type { CitizenRoute, LevelPreset, PlacedAsset, PlacedLamp, Position2 } from "@/game/level";

type RawConfig = {
  name: string; pack: string; modelType: string; rotation?: number; scale?: number;
  offsetY?: number; gridW?: number; gridD?: number; actualWidth?: number; actualDepth?: number;
  actualHeight?: number; frontDir?: string; lights?: {
    lampModel?: string; distance?: number; scale?: number; color?: string;
    position?: [number, number, number]; rotation?: number | [number, number, number];
  }[];
};
type Catalog = { configs: Record<string, RawConfig> };
const projectRoot = process.cwd();
const catalogPath = path.join(projectRoot, "data/model-configs.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8")) as Catalog;
const coordinates = [-6, -4, -2, 0, 2, 4, 6];

function createRandom(seed: string) {
  let state = 0x811c9dc5;
  for (const character of seed) state = Math.imul(state ^ character.codePointAt(0)!, 0x01000193);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function resolveAsset(key: string) {
  const config = catalog.configs[key];
  if (!config) throw new Error(`Missing model config: ${key}`);
  const file = path.join(projectRoot, "public/models", config.pack, `${config.name}.glb`);
  if (!fs.existsSync(file)) throw new Error(`Missing GLB for ${key}: ${file}`);
  return { config, asset: `/models/${config.pack}/${config.name}.glb` };
}

function place(key: string, id: string, x: number, z: number, rotationY = 0): PlacedAsset {
  const { config, asset } = resolveAsset(key);
  const frontRotation = config.modelType === "building"
    ? ({ front: 0, right: -Math.PI / 2, back: Math.PI, left: Math.PI / 2 }[config.frontDir ?? ""] ?? 0)
    : 0;
  return {
    id, asset, position: [x, config.offsetY ?? 0, z],
    rotationY: rotationY + (config.rotation ?? 0) + frontRotation,
    scale: config.scale ?? 1,
  };
}

function buildingCatalog() {
  return Object.entries(catalog.configs)
    .filter(([, config]) => config.modelType === "building" && fs.existsSync(path.join(projectRoot, "public/models", config.pack, `${config.name}.glb`)))
    .map(([key]) => key)
    .sort();
}

function citizenCatalog() {
  return Object.entries(catalog.configs)
    .filter(([, config]) => config.modelType === "character" && fs.existsSync(path.join(projectRoot, "public/models", config.pack, `${config.name}.glb`)))
    .map(([key]) => ({ key, config: catalog.configs[key] }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function pick<T>(items: readonly T[], random: () => number): T {
  if (items.length === 0) throw new Error("No usable models found for this level category.");
  return items[Math.floor(random() * items.length)];
}

function randomRoute(direction: "horizontal" | "vertical", crossX: number, crossZ: number, reverse: boolean): Position2[] {
  const points: Position2[] = coordinates.map((coordinate) => direction === "horizontal"
    ? [coordinate, crossZ]
    : [crossX, coordinate]);
  return reverse ? points.reverse() : points;
}

export function buildLevel(seedInput: string): LevelPreset {
  const seed = seedInput.trim();
  if (!seed || seed.length > 64) throw new Error("Seed must contain 1 to 64 characters.");
  const random = createRandom(seed);
  const crossX = [-4, -2, 0, 2, 4][Math.floor(random() * 5)];
  const crossZ = [-4, -2, 0, 2, 4][Math.floor(random() * 5)];
  const roads: PlacedAsset[] = [];

  for (const x of coordinates) {
    roads.push(place(x === crossX ? "roads/road-crossroad" : "roads/road-straight", `east-west-${x + 6}`, x, crossZ));
  }
  for (const z of coordinates) {
    if (z !== crossZ) roads.push(place("roads/road-straight", `north-south-${z + 6}`, crossX, z, Math.PI / 2));
  }

  const buildingModels = buildingCatalog();
  const buildings: PlacedAsset[] = [];
  for (const xSide of [-1, 1]) {
    for (const zSide of [-1, 1]) {
      const blockCells = coordinates.filter((x) => xSide < 0 ? x < crossX : x > crossX)
        .flatMap((x) => coordinates.filter((z) => zSide < 0 ? z < crossZ : z > crossZ).map((z) => [x, z] as const));
      const [x, z] = pick(blockCells, random);
      buildings.push(place(pick(buildingModels, random), `building-${buildings.length + 1}`, x, z));
    }
  }

  const lampSource = resolveAsset("roads/road-straight").config.lights?.[0];
  const lampModel = lampSource?.lampModel ?? "light-curved";
  const lampAsset = `/models/lamps/${lampModel}.glb`;
  const lampFile = path.join(projectRoot, "public", lampAsset);
  if (!fs.existsSync(lampFile)) throw new Error(`Missing GLB for lamp ${lampModel}: ${lampFile}`);
  const lampCandidates: Position2[] = [];
  for (const x of coordinates) {
    if (x !== crossX) lampCandidates.push([x, crossZ - 1.25], [x, crossZ + 1.25]);
  }
  for (const z of coordinates) {
    if (z !== crossZ) lampCandidates.push([crossX - 1.25, z], [crossX + 1.25, z]);
  }
  const lampSlots = shuffle(lampCandidates, random).slice(0, 8);
  const lamps: PlacedLamp[] = lampSlots.map(([x, z], index) => ({
    id: `lamp-${index + 1}`, asset: lampAsset, position: [x, 0, z], rotationY: 0,
    scale: lampSource?.scale ?? 1, radius: lampSource?.distance ?? 5.5,
    initiallyOn: index < 5,
  }));

  const people = citizenCatalog();
  const citizens: CitizenRoute[] = Array.from({ length: 6 }, (_, index) => {
    const person = pick(people, random);
    const direction = index % 2 === 0 ? "horizontal" : "vertical";
    return {
      id: `walker-${String(index + 1).padStart(2, "0")}`,
      asset: `/models/${person.config.pack}/${person.config.name}.glb`,
      scale: person.config.scale ?? 0.2,
      route: randomRoute(direction, crossX, crossZ, random() < 0.5),
      secondsPerPoint: 3 + Math.floor(random() * 4),
    };
  });

  return {
    id: "first-shift", seed, title: "First Shift", subtitle: "Keep the district lit until sunrise.",
    grid: { width: 7, depth: 7, cellSize: 2 }, roads, buildings, lamps, citizens,
    rules: { shiftSeconds: 100, startingEnergy: 190, energyPerLampSecond: 0.32, startingSatisfaction: 68, minimumSatisfaction: 35 },
  };
}

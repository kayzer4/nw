import fs from "node:fs";
import path from "node:path";
import type { LevelPreset, PlacedAsset, PlacedLamp } from "@/game/level";

type RawConfig = {
  name: string; pack: string; modelType: string; rotation?: number; scale?: number;
  offsetY?: number; gridW?: number; gridD?: number; actualWidth?: number; actualDepth?: number;
  actualHeight?: number; frontDir?: string; lights?: { lampModel?: string; distance?: number; scale?: number }[];
};
type Catalog = { configs: Record<string, RawConfig> };
const projectRoot = process.cwd();
const catalogPath = path.join(projectRoot, "data/model-configs.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8")) as Catalog;

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
  return { id, asset, position: [x, config.offsetY ?? 0, z], rotationY: rotationY + (config.rotation ?? 0) + frontRotation, scale: config.scale ?? 1 };
}

export function buildLevel(): LevelPreset {
  const roads: PlacedAsset[] = [];
  for (let coordinate = -6, index = 0; coordinate <= 6; coordinate += 2, index += 1) {
    roads.push(place(coordinate === 0 ? "roads/road-crossroad" : "roads/road-straight", `horizontal-${index}`, coordinate, 0));
    if (coordinate !== 0) roads.push(place("roads/road-straight", `vertical-${index}`, 0, coordinate, Math.PI / 2));
  }

  const buildings = [
    place("Models/building-a", "residence-west-north", -4, -4),
    place("Models/building-e", "shop-east-north", 4, -4),
    place("Models/building-b", "residence-west-south", -4, 4),
    place("Models/building-c", "residence-east-south", 4, 4),
  ];
  const lampSlots = [
    [-4, -1.25], [0, -1.25], [4, -1.25], [-4, 1.25],
    [0, 1.25], [4, 1.25], [-1.25, -4], [1.25, 4],
  ] as const;
  const lamps: PlacedLamp[] = lampSlots.map(([x, z], index) => {
    const { config } = resolveAsset("roads/road-straight");
    const light = config.lights?.[0];
    const lampModel = light?.lampModel ?? "light-curved";
    const asset = `/models/lamps/${lampModel}.glb`;
    const lampFile = path.join(projectRoot, "public", asset);
    if (!fs.existsSync(lampFile)) throw new Error(`Missing GLB for lamp ${lampModel}: ${lampFile}`);
    return {
      id: `lamp-${index + 1}`, asset, position: [x, 0, z], rotationY: 0,
      scale: light?.scale ?? 1, radius: light?.distance ?? 5.5,
      initiallyOn: index < 5,
    };
  });
  const citizenModel = resolveAsset("characters/cube_guy");
  const womanModel = resolveAsset("characters/cube_woman");
  const citizens = [
    { id: "walker-01", asset: citizenModel.asset, scale: citizenModel.config.scale ?? 0.2, route: [[-5.2, 0], [-2.6, 0], [0, 0], [2.6, 0], [5.2, 0]] as const, secondsPerPoint: 4 },
    { id: "walker-02", asset: womanModel.asset, scale: womanModel.config.scale ?? 0.2, route: [[5.2, 0], [2.6, 0], [0, 0], [-2.6, 0], [-5.2, 0]] as const, secondsPerPoint: 5 },
    { id: "walker-03", asset: citizenModel.asset, scale: citizenModel.config.scale ?? 0.2, route: [[0, -5.2], [0, -2.6], [0, 0], [0, 2.6], [0, 5.2]] as const, secondsPerPoint: 4 },
    { id: "walker-04", asset: womanModel.asset, scale: womanModel.config.scale ?? 0.2, route: [[0, 5.2], [0, 2.6], [0, 0], [0, -2.6], [0, -5.2]] as const, secondsPerPoint: 5 },
    { id: "walker-05", asset: citizenModel.asset, scale: citizenModel.config.scale ?? 0.2, route: [[-5.2, 0], [-2.6, 0], [0, 0], [2.6, 0], [5.2, 0]] as const, secondsPerPoint: 6 },
    { id: "walker-06", asset: womanModel.asset, scale: womanModel.config.scale ?? 0.2, route: [[0, -5.2], [0, -2.6], [0, 0], [0, 2.6], [0, 5.2]] as const, secondsPerPoint: 6 },
  ];

  return {
    id: "first-shift", title: "First Shift", subtitle: "Keep the crossroad lit until sunrise.",
    grid: { width: 7, depth: 7, cellSize: 2 }, roads, buildings, lamps, citizens,
    rules: { shiftSeconds: 100, startingEnergy: 190, energyPerLampSecond: 0.32, startingSatisfaction: 68, minimumSatisfaction: 35 },
  };
}

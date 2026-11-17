import fs from "node:fs";
import path from "node:path";
import type { CitizenRoute, LevelPreset, PlacedAsset, PlacedLamp, Position2 } from "@/game/level";
import { lampLightsPoint } from "@/game/light";
import { coverageSamples, type CoverageSample } from "./coverage-samples";
import { assessLevel, lampExclusiveShares } from "./level-validation";
import { balanceGeneratedLevel } from "./level-balance";
import { planIdealLighting } from "./ideal-lighting";
import { modelFootprintRadius } from "./model-footprint";
import { walkSegmentAllowed } from "./walk-geometry";

type RawConfig = {
  name: string; pack: string; modelType: string; roadType?: string;
  roadConnectRight?: boolean; roadConnectBack?: boolean; roadConnectLeft?: boolean; roadConnectFront?: boolean;
  rotation?: number; scale?: number; offsetY?: number; frontDir?: string; tags?: string[];
  actualWidth?: number; actualDepth?: number; speed?: number;
  attractors?: { id: string; type: string; position: { x: number; y?: number; z: number }; directions?: number[] }[];
  lights?: { lampModel?: string; distance?: number; intensity?: number; color?: string; scale?: number; position?: [number, number, number]; rotation?: number | [number, number, number] }[];
};
type Catalog = { configs: Record<string, RawConfig> };
type Connections = [boolean, boolean, boolean, boolean];
type CellType = "road" | "building" | "empty";
type Block = { x: number; z: number; w: number; h: number };
type RoadTile = { key: string; config: RawConfig; rotationY: number; rotationSteps: number; connections: Connections };
type WalkNode = { id: string; cellX: number; cellZ: number; position: Position2; directions?: number[]; next: string[] };

const projectRoot = process.cwd();
const catalog = JSON.parse(fs.readFileSync(path.join(projectRoot, "data/model-configs.json"), "utf8")) as Catalog;
// Matches CityGenerator.DEFAULT_CONFIG from the original project.
const WIDTH = 6;
const DEPTH = 6;
const CELL_SIZE = 2;
const HALF_X = WIDTH * CELL_SIZE / 2;
const HALF_Z = DEPTH * CELL_SIZE / 2;
// All configured building GLBs have the top of their plinth at local Y = 0.05.
const BUILDING_PLINTH_HEIGHT = 0.05;
const DIRECTIONS = [
  { x: 1, z: 0 },
  { x: 0, z: 1 },
  { x: -1, z: 0 },
  { x: 0, z: -1 },
] as const;

// Same Park-Miller generator used by createSeededRandom in the source project.
function createRandom(seed: number) {
  let state = Math.abs(Math.floor(seed)) % 2_147_483_647 || 1;
  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return (state - 1) / 2_147_483_646;
  };
}

function randomInt(min: number, max: number, random: () => number) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pick<T>(items: readonly T[], random: () => number): T {
  if (items.length === 0) throw new Error("No usable models found for this level category.");
  return items[Math.floor(random() * items.length)];
}

function modelPath(config: RawConfig) {
  return path.join(projectRoot, "public/models", config.pack, `${config.name}.glb`);
}

function rotateConnections(connections: Connections, steps: number): Connections {
  let current = [...connections] as Connections;
  for (let step = 0; step < steps; step += 1) current = [current[3], current[0], current[1], current[2]];
  return current;
}

function roadTiles(): RoadTile[] {
  const result: RoadTile[] = [];
  for (const [key, config] of Object.entries(catalog.configs)) {
    if (config.modelType !== "road" || config.roadType === "none" || !fs.existsSync(modelPath(config))) continue;
    const base: Connections = [!!config.roadConnectRight, !!config.roadConnectBack, !!config.roadConnectLeft, !!config.roadConnectFront];
    for (let rotationSteps = 0; rotationSteps < 4; rotationSteps += 1) {
      result.push({
        key,
        config,
        rotationSteps,
        rotationY: -rotationSteps * Math.PI / 2 + (config.rotation ?? 0),
        connections: rotateConnections(base, rotationSteps),
      });
    }
  }
  return result;
}

function buildingModels() {
  return Object.entries(catalog.configs)
    .filter(([, config]) => config.modelType === "building"
      && (config.pack === "Models" || config.pack === "buildings")
      && !config.tags?.includes("detail")
      && fs.existsSync(modelPath(config)))
    .map(([key, config]) => ({ key, config }));
}

function characterModels() {
  return Object.values(catalog.configs)
    .filter((config) => config.modelType === "character" && fs.existsSync(modelPath(config)))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function generateBlocks(random: () => number): Block[] {
  const blocks: Block[] = [];
  let z = 0;
  while (z < DEPTH) {
    let x = 0;
    const blockHeight = Math.min(randomInt(3, 6, random), DEPTH - z);
    while (x < WIDTH) {
      const blockWidth = Math.min(randomInt(3, 6, random), WIDTH - x);
      blocks.push({ x, z, w: blockWidth, h: blockHeight });
      x += blockWidth + 1;
    }
    z += blockHeight + 1;
  }
  return blocks;
}

function createCellMap() {
  return Array.from({ length: WIDTH }, () => Array.from({ length: DEPTH }, () => "empty" as CellType));
}

function markRoadsAndBuildings(map: CellType[][], blocks: Block[]) {
  for (const block of blocks) {
    for (let bx = 0; bx < block.w; bx += 1) {
      for (let bz = 0; bz < block.h; bz += 1) {
        const x = block.x + bx;
        const z = block.z + bz;
        if (x < WIDTH && z < DEPTH) map[x][z] = "building";
      }
    }
    for (let bx = -1; bx <= block.w; bx += 1) {
      for (let bz = -1; bz <= block.h; bz += 1) {
        const x = block.x + bx;
        const z = block.z + bz;
        if (x < 0 || x >= WIDTH || z < 0 || z >= DEPTH || map[x][z] === "building") continue;
        map[x][z] = "road";
      }
    }
  }
}

function connectionsAt(x: number, z: number, map: CellType[][]): Connections {
  return DIRECTIONS.map(({ x: dx, z: dz }) => map[x + dx]?.[z + dz] === "road") as Connections;
}

function isStraight(needed: Connections) {
  return (needed[0] && needed[2] && !needed[1] && !needed[3]) || (needed[1] && needed[3] && !needed[0] && !needed[2]);
}

function shouldPlaceCrossing(needed: Connections, random: () => number) {
  if (!isStraight(needed)) return false;
  return random() < 0.35;
}

function selectRoadTile(needed: Connections, tiles: RoadTile[], random: () => number): RoadTile | null {
  const matches = tiles.filter((tile) => tile.connections.every((connected, index) => connected === needed[index]));
  if (matches.length === 0) return null;
  const crossings = matches.filter((tile) => tile.config.tags?.includes("crosswalk"));
  if (crossings.length && shouldPlaceCrossing(needed, random)) return pick(crossings, random);
  const regular = matches.filter((tile) => !tile.config.tags?.includes("crosswalk"));
  return pick(regular.length ? regular : matches, random);
}

function canPlaceAllRoads(map: CellType[][], tiles: RoadTile[], random: () => number) {
  for (let x = 0; x < WIDTH; x += 1) {
    for (let z = 0; z < DEPTH; z += 1) {
      if (map[x][z] === "road" && !selectRoadTile(connectionsAt(x, z, map), tiles, random)) return false;
    }
  }
  return true;
}

function toWorldPosition(x: number, z: number): Position2 {
  return [x * CELL_SIZE + CELL_SIZE / 2 - HALF_X, z * CELL_SIZE + CELL_SIZE / 2 - HALF_Z];
}

function nearestRoadDirection(x: number, z: number, map: CellType[][]): "left" | "right" | "front" | "back" | "none" {
  const checks = [
    { x, z: z - 1, direction: "front" as const },
    { x, z: z + 1, direction: "back" as const },
    { x: x - 1, z, direction: "left" as const },
    { x: x + 1, z, direction: "right" as const },
  ];
  return checks.find(({ x: cx, z: cz }) => map[cx]?.[cz] === "road")?.direction ?? "none";
}

function buildingRotation(direction: "left" | "right" | "front" | "back" | "none") {
  return ({ front: 0, right: -Math.PI / 2, back: Math.PI, left: Math.PI / 2, none: 0 })[direction];
}

function placeRoad(x: number, z: number, map: CellType[][], tiles: RoadTile[], random: () => number): { placed: PlacedAsset; tile: RoadTile } {
  const needed = connectionsAt(x, z, map);
  const tile = selectRoadTile(needed, tiles, random) ?? tiles.find(({ key }) => key === "roads/road-crossroad");
  if (!tile) throw new Error("No road tile model is available.");
  const [worldX, worldZ] = toWorldPosition(x, z);
  return {
    tile,
    placed: {
      id: `road-${x}-${z}`,
      asset: `/models/${tile.config.pack}/${tile.config.name}.glb`,
      position: [worldX, -0.05, worldZ],
      rotationY: tile.rotationY,
      scale: tile.config.scale ?? 1,
    },
  };
}

function placeBuildings(map: CellType[][], blocks: Block[], models: ReturnType<typeof buildingModels>, random: () => number): PlacedAsset[] {
  const placed: PlacedAsset[] = [];
  for (const block of blocks) {
    for (let bz = 0; bz < block.h; bz += 1) {
      for (let bx = 0; bx < block.w; bx += 1) {
        const x = block.x + bx;
        const z = block.z + bz;
        if (map[x]?.[z] !== "building") continue;
        const { config } = pick(models, random);
        const [worldX, worldZ] = toWorldPosition(x, z);
        const asset = `/models/${config.pack}/${config.name}.glb`;
        const scale = Math.min(CELL_SIZE / Math.max(config.actualWidth ?? 1, config.actualDepth ?? 1), 0.88 / modelFootprintRadius(asset));
        placed.push({
          id: `building-${x}-${z}`,
          asset,
          position: [worldX, -BUILDING_PLINTH_HEIGHT * scale, worldZ],
          rotationY: buildingRotation(nearestRoadDirection(x, z, map)),
          scale,
        });
      }
    }
  }
  return placed;
}

function createLampCandidates(roads: { x: number; z: number; tile: RoadTile }[]): PlacedLamp[] {
  const candidates: PlacedLamp[] = [];
  for (const { x, z, tile } of roads) {
    const [worldX, worldZ] = toWorldPosition(x, z);
    for (const light of tile.config.lights ?? []) {
      const lampModel = light.lampModel ?? "light-curved";
      if (!fs.existsSync(path.join(projectRoot, "public/models/lamps", `${lampModel}.glb`))) continue;
      const [offsetX = 0, , offsetZ = 0] = light.position ?? [0, 0, 0];
      const scale = light.scale ?? 1;
      const cosine = Math.cos(tile.rotationY);
      const sine = Math.sin(tile.rotationY);
      const localX = offsetX * (tile.config.scale ?? 1);
      const localZ = offsetZ * (tile.config.scale ?? 1);
      const lampRotation = Array.isArray(light.rotation) ? light.rotation[1] : light.rotation ?? 0;
      candidates.push({
        id: `candidate-${candidates.length + 1}`,
        asset: `/models/lamps/${lampModel}.glb`,
        position: [worldX + localX * cosine + localZ * sine, 0, worldZ - localX * sine + localZ * cosine],
        rotationY: tile.rotationY + lampRotation * Math.PI / 180,
        scale,
        radius: light.distance ?? 5.5,
        color: light.color ?? "#fff8e7",
        intensity: light.intensity ?? 2,
        initiallyOn: false,
      });
    }
  }
  return candidates;
}

function makeWalkNodes(roads: { x: number; z: number; tile: RoadTile }[]): WalkNode[] {
  const nodes: WalkNode[] = [];
  for (const { x, z, tile } of roads) {
    const center = toWorldPosition(x, z);
    const scale = tile.config.scale ?? 1;
    const cosine = Math.cos(tile.rotationY);
    const sine = Math.sin(tile.rotationY);
    const rotationDegrees = tile.rotationY * 180 / Math.PI;
    for (const attractor of tile.config.attractors ?? []) {
      if (attractor.type !== "walk") continue;
      const localX = attractor.position.x * scale;
      const localZ = attractor.position.z * scale;
      nodes.push({
        id: `${x}_${z}:${attractor.id}`,
        cellX: x,
        cellZ: z,
        position: [center[0] + localX * cosine + localZ * sine, center[1] - localX * sine + localZ * cosine],
        directions: attractor.directions?.map((direction) => ((direction - rotationDegrees) % 360 + 360) % 360),
        next: [],
      });
    }
  }
  return nodes;
}

function directionAllowed(from: WalkNode, to: WalkNode) {
  if (!from.directions || from.directions.length === 0) return true;
  const angle = Math.atan2(to.position[1] - from.position[1], to.position[0] - from.position[0]) * 180 / Math.PI;
  return from.directions.some((direction) => {
    const difference = Math.abs((((angle - direction) % 360) + 540) % 360 - 180);
    return difference <= 22.5 + 1e-9;
  });
}

function linkWalkNodes(nodes: WalkNode[], roads: readonly PlacedAsset[]) {
  for (const from of nodes) {
    for (const to of nodes) {
      if (from.id === to.id || !directionAllowed(from, to)) continue;
      const sameCell = from.cellX === to.cellX && from.cellZ === to.cellZ;
      const adjacentCells = Math.abs(from.cellX - to.cellX) + Math.abs(from.cellZ - to.cellZ) === 1;
      if (!sameCell && !adjacentCells) continue;
      if (!sameCell) {
        const lateral = from.cellX !== to.cellX
          ? Math.abs(from.position[1] - to.position[1])
          : Math.abs(from.position[0] - to.position[0]);
        if (lateral > CELL_SIZE * 0.15) continue;
      }
      if (!walkSegmentAllowed(from.position, to.position, roads, { width: WIDTH, depth: DEPTH, cellSize: CELL_SIZE })) continue;
      from.next.push(to.id);
    }
  }
}

function findWalkCycles(nodes: WalkNode[]): WalkNode[][] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const cycles: WalkNode[][] = [];
  for (const start of nodes) {
    for (const firstId of start.next) {
      const queue = [firstId];
      const parents = new Map<string, string | null>([[firstId, null]]);
      let found = false;
      while (queue.length > 0 && !found) {
        const currentId = queue.shift()!;
        if (currentId === start.id) { found = true; break; }
        for (const nextId of byId.get(currentId)?.next ?? []) {
          if (parents.has(nextId)) continue;
          parents.set(nextId, currentId);
          queue.push(nextId);
        }
      }
      if (!found) continue;
      const path = [start.id];
      let current = start.id;
      while (current !== firstId) {
        const parent = parents.get(current);
        if (!parent) break;
        current = parent;
        path.push(current);
      }
      path.reverse();
      const cycleIds = [start.id, ...path.slice(0, -1)];
      if (cycleIds.length >= 2) cycles.push(cycleIds.map((id) => byId.get(id)!).filter(Boolean));
    }
  }
  return cycles;
}

function makeCitizenRoutes(roadCells: { x: number; z: number; tile: RoadTile }[], roads: PlacedAsset[], random: () => number): CitizenRoute[] {
  const nodes = makeWalkNodes(roadCells);
  linkWalkNodes(nodes, roads);
  const cycles = findWalkCycles(nodes);
  const people = characterModels();
  if (cycles.length === 0 || people.length === 0) return [];

  return Array.from({ length: 6 }, (_, index) => {
    const person = pick(people, random);
    const cycle = pick(cycles, random);
    const offset = randomInt(0, cycle.length - 1, random);
    const ordered = [...cycle.slice(offset), ...cycle.slice(0, offset)];
    const route = ordered.map((node) => node.position);
    return {
      id: `walker-${String(index + 1).padStart(2, "0")}`,
      asset: `/models/${person.pack}/${person.name}.glb`,
      scale: person.scale ?? 0.2,
      route,
      speed: person.speed ?? 0.25,
    };
  });
}

function segmentHitsBuilding(from: Position2, to: Position2, building: PlacedAsset) {
  const halfExtent = 1.05;
  const minX = building.position[0] - halfExtent;
  const maxX = building.position[0] + halfExtent;
  const minZ = building.position[2] - halfExtent;
  const maxZ = building.position[2] + halfExtent;
  let low = 0;
  let high = 1;
  const axes: [number, number, number, number][] = [
    [from[0], to[0] - from[0], minX, maxX],
    [from[1], to[1] - from[1], minZ, maxZ],
  ];
  for (const [origin, delta, min, max] of axes) {
    if (Math.abs(delta) < 1e-6) {
      if (origin < min || origin > max) return false;
      continue;
    }
    const first = (min - origin) / delta;
    const second = (max - origin) / delta;
    low = Math.max(low, Math.min(first, second));
    high = Math.min(high, Math.max(first, second));
    if (low > high) return false;
  }
  return high > 0 && low < 1;
}

function selectCoveringLamps(candidates: PlacedLamp[], samples: CoverageSample[]) {
  const selected: PlacedLamp[] = [];
  const uncovered = new Set(samples.map((_, index) => index));
  const remaining = [...candidates];

  while (uncovered.size > 0) {
    let bestIndex = -1;
    let bestCoverage: number[] = [];
    for (let candidateIndex = 0; candidateIndex < remaining.length; candidateIndex += 1) {
      const candidate = remaining[candidateIndex];
      const covered = [...uncovered].filter((sampleIndex) => lampLightsPoint(candidate, samples[sampleIndex].position));
      if (covered.length > bestCoverage.length) {
        bestIndex = candidateIndex;
        bestCoverage = covered;
      }
    }
    if (bestIndex < 0 || bestCoverage.length === 0) break;
    selected.push(remaining.splice(bestIndex, 1)[0]);
    for (const sampleIndex of bestCoverage) uncovered.delete(sampleIndex);
  }

  return { selected, uncovered };
}

function fallbackLamp(sample: CoverageSample, source: PlacedLamp, buildings: PlacedAsset[], id: string): PlacedLamp {
  const [dx, dz] = sample.tangent;
  const normal: Position2 = [-dz, dx];
  const offsets = [0.85, -0.85, 0];
  const offset = offsets.find((distance) => {
    const x = sample.position[0] + normal[0] * distance;
    const z = sample.position[1] + normal[1] * distance;
    return !buildings.some((building) => segmentHitsBuilding([x, z], sample.position, building));
  }) ?? 0;
  return {
    ...source,
    id,
    position: [sample.position[0] + normal[0] * offset, 0, sample.position[1] + normal[1] * offset],
    initiallyOn: false,
  };
}

function completeRouteCoverage(
  candidates: PlacedLamp[], samples: CoverageSample[], buildings: PlacedAsset[],
): PlacedLamp[] {
  const { selected, uncovered } = selectCoveringLamps(candidates, samples);
  const template = candidates[0];
  if (uncovered.size > 0 && !template) throw new Error("Cannot cover roads: no configured road lamp model is available.");

  while (uncovered.size > 0) {
    const sampleIndex = uncovered.values().next().value as number;
    const sample = samples[sampleIndex];
    const lamp = fallbackLamp(sample, template!, buildings, `road-lamp-${selected.length + 1}`);
    selected.push(lamp);
    for (const index of uncovered) if (lampLightsPoint(lamp, samples[index].position)) uncovered.delete(index);
  }

  const unique = new Map<string, PlacedLamp>();
  for (const lamp of selected) {
    const key = `${lamp.position[0].toFixed(2)},${lamp.position[2].toFixed(2)},${lamp.asset}`;
    if (!unique.has(key)) unique.set(key, lamp);
  }
  const placed = [...unique.values()];
  // Greedy choices made early can become unnecessary after curbside gap fills.
  for (let index = placed.length - 1; index >= 0; index--) {
    if (samples.every(({ position }) => placed.some((lamp, other) => other !== index && lampLightsPoint(lamp, position)))) placed.splice(index, 1);
  }
  const stillUncovered = samples.filter((sample) => !placed.some((lamp) => lampLightsPoint(lamp, sample.position)));
  if (stillUncovered.length > 0) throw new Error(`Could not fully light road samples: ${stillUncovered.length}`);
  return placed.map((lamp, index) => ({ ...lamp, id: `lamp-${index + 1}` }));
}

const CHALLENGES = [
  { shiftSeconds: 40, energyAllowance: 0.4 },
  { shiftSeconds: 50, energyAllowance: 0.3 },
  { shiftSeconds: 55, energyAllowance: 0.22 },
  { shiftSeconds: 60, energyAllowance: 0.16 },
  { shiftSeconds: 65, energyAllowance: 0.1 },
] as const;

export function buildLevel(seedInput: string, challengeIndex?: number): LevelPreset {
  const seed = seedInput.trim();
  if (!/^\d{1,10}$/.test(seed) || Number(seed) > 4_294_967_295) {
    throw new Error("Seed must be a number between 0 and 4294967295.");
  }
  const random = createRandom(Number(seed));
  const tiles = roadTiles();
  const models = buildingModels();
  if (models.length === 0) throw new Error("No playable building GLBs are configured.");

  let blocks: Block[] = [];
  let map = createCellMap();
  let accepted = false;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    map = createCellMap();
    blocks = generateBlocks(random);
    markRoadsAndBuildings(map, blocks);
    if (canPlaceAllRoads(map, tiles, random)) {
      accepted = true;
      break;
    }
  }
  if (!accepted) {
    map = createCellMap();
    blocks = generateBlocks(random);
    markRoadsAndBuildings(map, blocks);
  }

  const roads: PlacedAsset[] = [];
  const roadCells: { x: number; z: number; tile: RoadTile }[] = [];
  for (let x = 0; x < WIDTH; x += 1) {
    for (let z = 0; z < DEPTH; z += 1) {
      if (map[x][z] !== "road") continue;
      const { placed, tile } = placeRoad(x, z, map, tiles, random);
      roads.push(placed);
      roadCells.push({ x, z, tile });
    }
  }

  const buildings = placeBuildings(map, blocks, models, random);
  const citizens = makeCitizenRoutes(roadCells, roads, random);
  const samples = coverageSamples(roads, citizens);
  const baseCandidates = createLampCandidates(roadCells);
  const uniformColor = baseCandidates[0]?.color ?? "#fff8e7";
  const uniformIntensity = baseCandidates[0]?.intensity ?? 2;
  let lamps: PlacedLamp[] = [];
  let bestLamps: PlacedLamp[] | null = null;
  // Start compact: three or more focused pools of light create a meaningful
  // on/off decision, unlike a two-lamp layout where every lamp is mandatory.
  const baseRadius = 2.2 + Number(seed) % 3 * 0.2;
  const targetLampCount = Math.max(3, Math.ceil(roads.length * 5 / 11));
  for (let step = 0; baseRadius + step * 0.2 <= 5.401; step++) {
    const radius = Math.round((baseRadius + step * 0.2) * 10) / 10;
    const candidates = baseCandidates.map((lamp) => ({ ...lamp, radius, color: uniformColor, intensity: uniformIntensity }));
    const candidateLamps = completeRouteCoverage(candidates, samples, buildings);
    const leastExclusive = Math.min(...lampExclusiveShares(candidateLamps, samples));
    if (!bestLamps || candidateLamps.length < bestLamps.length || (candidateLamps.length === bestLamps.length && leastExclusive > Math.min(...lampExclusiveShares(bestLamps, samples)))) bestLamps = candidateLamps;
    if (candidateLamps.length >= 3 && candidateLamps.length <= targetLampCount && leastExclusive >= 0.04) { lamps = candidateLamps; break; }
  }
  if (!lamps.length) lamps = bestLamps ?? [];
  const challenge = CHALLENGES[Math.max(0, Math.min(CHALLENGES.length - 1, challengeIndex ?? 0))];
  lamps = lamps.map((lamp) => ({ ...lamp, initiallyOn: false }));

  const level: LevelPreset = {
    id: "custom", seed, title: "Пользовательский район", subtitle: `Создан по коду ${seed}.`,
    difficulty: 1,
    grid: { width: WIDTH, depth: DEPTH, cellSize: CELL_SIZE },
    roads,
    buildings,
    lamps,
    citizens,
    rules: {
      shiftSeconds: challenge.shiftSeconds,
      startingEnergy: 0,
      energyPerLampSecond: 0.7,
      requiredLitResidents: citizens.length,
    },
  };
  while (!planIdealLighting(level) && level.lamps[0].radius < 5.4) {
    level.lamps = level.lamps.map((lamp) => ({ ...lamp, radius: Math.round((lamp.radius + 0.1) * 10) / 10 }));
  }
  const balanced = balanceGeneratedLevel(level, challenge.energyAllowance);
  return { ...balanced, difficulty: assessLevel(balanced) };
}

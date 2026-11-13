# Architecture

Nightwatcher Clean is a single Next.js project. `src/client` renders the game, `src/game` contains pure gameplay rules and shared light geometry, and `src/server` plus `tools` build and validate presets locally. The Next.js API reads checked-in JSON; it never runs the generator on requests.

## Level pipeline

`data/model-configs.json` supplies road cells, model transforms, attractors, walking vectors, resident sizes, and lamp models to `src/server/level-builder.ts`. The 6×6 block-and-street generator follows the original seeded layout algorithm. `tools/build-levels.ts` writes five ready presets in `data/levels` from the catalog. Run `bun run build:levels` to rebuild all, or `bun run build:levels --id north-gate --seed 12345` to rebuild one and update its seed. The browser can select only these catalog entries. The level selection screen loads no 3D scene; selecting a card opens the playground, and the Levels button returns to the catalog.

`coverage-samples.ts` samples every road tile on a 0.25–0.5 unit grid and every continuous resident route. The builder greedily chooses configured lamp positions, adds curbside lamps for gaps, and removes lamps whose coverage is entirely redundant. It then increases one uniform radius in 0.2-unit steps, seeking a target of five lamps for the current 11-road layout and at least 4% unique sample coverage per lamp. The target scales with road count; the search stops at radius 5.4 and retains the best complete layout if necessary. All lamps in one preset have identical radius, color and intensity. `walk-geometry.ts` checks every interpolated resident segment against the pedestrian surface of its specific road model. In particular, the intersection has two separate corner sidewalks on one side; a straight path between them is invalid. A path through the road center requires the marked `road-crossing` tile. `model-footprint.ts` reads real GLB vertex bounds so buildings, including attached bushes, fit inside their cells. `level-validation.ts` rejects uncovered roads, invalid walking segments, protruding buildings, and excessive lamps relative to road count. It simulates all-on, all-off and a simple winning switch schedule. Difficulty 1–5 comes from the fraction of lamps needed to light half the residents, the available radius, and the number of alternatives.

## Game state

`src/game/clock.ts` is the single monotonic game clock. `routePosition` uses each resident's speed in world units per second and cached segment lengths, so short and long route segments have the same walking speed. The same position drives the Three.js model and the simulation. The simulation integrates comfort in 0.25-second slices, including when a tab resumes after throttling. Lamp toggles first settle elapsed time under the old switch states, then update lighting. Energy, comfort and resident status live in the same Zustand session snapshot. The renderer mutates model transforms in `useFrame` without React timer renders; only the HUD and each relevant lamp or resident status subscribe to store updates.

`src/game/light.ts` defines the lamp head offset, footprint center, ground radius, and cone angle. The 3D spotlight and its projected ground light derive from the same `radius` as simulation and the HUD. The spotlight uses no distance attenuation, while the additive ground light remains visible almost to the footprint edge. The simulation uses that same circular footprint; buildings do not cast spotlight shadows. Resident icons show current lit/dark status.

The light footprint is rendered separately from its clickable lamp model. A pointer gesture that moves more than six screen pixels is treated as camera rotation and cannot toggle a lamp.

## Progress

Completion and last selected level ID are stored in `localStorage` under `nightwatcher-clean.progress`, schema version 2. Version 1 completion records are retained. Invalid or unavailable storage falls back to the first level.

## Commands

- `bun run build:levels` — rebuild and validate all five level JSON files.
- `bun run build:levels --id first-shift --seed 12345` — regenerate one catalog level.
- `bun run dev` — start the game.
- `bun run lint`, `bun run test` and `bun run build` — check source, game rules and production bundle.

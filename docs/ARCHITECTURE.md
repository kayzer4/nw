# Architecture

Nightwatcher Clean is a single Next.js project. `src/client` renders the game, `src/game` contains pure gameplay rules and shared light geometry, and `src/server` plus `tools` build and validate presets locally. The Next.js API reads checked-in JSON; it never runs the generator on requests.

## Level pipeline

`data/model-configs.json` supplies road cells, model transforms, attractors, walking vectors, resident sizes, and lamp models to `src/server/level-builder.ts`. The 6×6 block-and-street generator follows the original seeded layout algorithm. `tools/build-levels.ts` writes five ready presets in `data/levels` from the catalog. Run `bun run build:levels` to rebuild all, or `bun run build:levels --id north-gate --seed 12345` to rebuild one and update its seed. The browser can select only these catalog entries.

`coverage-samples.ts` samples every road tile on a 0.25–0.5 unit grid and every continuous resident route. The builder greedily chooses configured lamp positions, adds curbside lamps for gaps, and raises the shared radius if necessary. All lamps in one preset have identical radius, color and intensity. `level-validation.ts` rejects any uncovered road or route sample and any level with more than seven lamps. It simulates all-on, all-off and a simple winning switch schedule. Difficulty 1–5 comes from the fraction of lamps needed to light half the residents, the available radius, and the number of alternatives.

## Game state

`src/game/clock.ts` is the single monotonic game clock. `routePosition` computes interpolated resident positions from that time for both the Three.js model and the simulation. The simulation integrates comfort in 0.25-second slices, including when a tab resumes after throttling. Lamp toggles first settle elapsed time under the old switch states, then update lighting. Energy, comfort and resident status live in the same Zustand session snapshot. The renderer mutates model transforms in `useFrame` without React timer renders; only the HUD and each relevant lamp or resident status subscribe to store updates.

`src/game/light.ts` defines the lamp head offset, footprint center, ground radius, cone angle, and building occlusion. The 3D spotlight and its ground footprint derive from the same `radius` as simulation and the HUD. Building occlusion is a footprint approximation using building bounds. Resident icons show current lit/dark status.

## Progress

Completion and last selected level ID are stored in `localStorage` under `nightwatcher-clean.progress`, schema version 2. Version 1 completion records are retained. Invalid or unavailable storage falls back to the first level.

## Commands

- `bun run build:levels` — rebuild and validate all five level JSON files.
- `bun run build:levels --id first-shift --seed 12345` — regenerate one catalog level.
- `bun run dev` — start the game.
- `bun run lint`, `bun run test` and `bun run build` — check source, game rules and production bundle.

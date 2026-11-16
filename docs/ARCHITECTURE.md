# Architecture

Lightkeeper is a single Next.js project. `src/client` renders the game, `src/game` contains pure gameplay rules and shared light geometry, and `src/server` plus `tools` build and validate presets locally. The Next.js API reads checked-in JSON; it never runs the generator on requests.

## Level pipeline

`data/model-configs.json` supplies road cells, model transforms, attractors, walking vectors, resident sizes, and lamp models to `src/server/level-builder.ts`. The 6×6 block-and-street generator follows the original seeded layout algorithm. `tools/build-levels.ts` writes five ready presets in `data/levels` from the catalog. Run `bun run build:levels` to rebuild all, or `bun run build:levels --id north-gate --seed 12345` to rebuild one and update its seed. The browser can select only these catalog entries. Next.js routes `/levels`, `/levels/[id]/intro`, and `/levels/[id]/play` represent the selection, comic, and game screens; `/` redirects to `/levels`. Selecting a card opens a comic with all panels visible while `ScenePreloader` loads each GLB into the same cache used by the scene and the 3D code chunk loads in parallel. Start Shift is enabled as soon as loading finishes; clicking it opens the playground and starts the shift on its first rendered frame. The Levels button returns to the catalog. Unknown level IDs return 404.

`coverage-samples.ts` samples every road tile on a 0.25–0.5 unit grid and every continuous resident route. The builder greedily chooses configured lamp positions, adds curbside lamps for gaps, and removes lamps whose coverage is entirely redundant. It starts with compact light pools, seeking 3–5 lamps for the current 11-road layout and at least 4% unique sample coverage per lamp. The target scales with road count; the search stops at radius 5.4 and retains the best complete layout if necessary. All lamps in one preset have identical radius, color and intensity. `walk-geometry.ts` checks every interpolated resident segment against the pedestrian surface of its specific road model. In particular, the intersection has two separate corner sidewalks on one side; a straight path between them is invalid. A path through the road center requires the marked `road-crossing` tile. `model-footprint.ts` reads real GLB vertex bounds so buildings, including attached bushes, fit inside their cells. `ideal-lighting.ts` builds a two-second switching plan that lights every resident at every 0.25-second simulation sample; the builder expands the common lamp radius until such a plan exists. `level-balance.ts` gives the player the measured energy cost of that ideal plan plus a difficulty-dependent allowance (40% on the first level down to 10% on the last), while keeping the all-lamps-on strategy below the finish line. `level-validation.ts` replays the ideal plan and rejects invalid geometry or unwinnable presets. Difficulty 1–5 reflects ideal switching demand and the remaining energy allowance. `action-planner.ts` remains a diagnostic for the fewest winning clicks, including imperfect play.

## Game state

`src/game/clock.ts` is the single monotonic game clock. `routePosition` uses each resident's speed in world units per second and cached segment lengths, so short and long route segments have the same walking speed. The same position drives the Three.js model and the simulation. The simulation integrates comfort in 0.25-second slices, including when a tab resumes after throttling. Lamp toggles first settle elapsed time under the old switch states, then update lighting. Comfort falls when too few residents are lit. Every enabled lamp continuously drains energy; the session budget is derived offline from the ideal lighting plan, not from the renderer or current HUD. Energy, comfort and resident status live in the same Zustand session snapshot. The renderer mutates model transforms in `useFrame` without React timer renders; only the HUD and each relevant lamp or resident status subscribe to store updates.

`src/game/light.ts` defines the lamp head offset, footprint center, ground radius, and cone angle. The 3D spotlight and its projected ground light derive from the same `radius` as simulation and the HUD. The spotlight uses no distance attenuation, while the additive ground light remains visible almost to the footprint edge. The simulation uses that same circular footprint. Buildings and residents cast shadows from the lamps and the dim directional night light. Shadows are visual; they do not reduce simulated coverage. Resident icons show current lit/dark status.

Building cells share one flat sidewalk mesh generated from `level.grid.cellSize`. The sidewalk sits 1 cm above the road surface and has no separate cell edges; buildings remain within their cells, so the surface meets road tiles without overlapping them. During local generation, buildings are sunk by their scaled 0.05-unit plinth height so the foundation meets the sidewalk.

The light footprint is rendered separately from its clickable lamp model. A pointer gesture that moves more than six screen pixels is treated as camera rotation and cannot toggle a lamp.

## Progress

Completion and last selected level ID are stored in `localStorage` under `lightkeeper.progress` (with legacy save compatibility), schema version 2. Version 1 completion records are retained. Invalid or unavailable storage falls back to the first level.

## Commands

- `bun run build:levels` — rebuild and validate all five level JSON files.
- `bun run build:levels --id first-shift --seed 12345` — regenerate one catalog level.
- `bun run measure:apm` — report the minimum winning clicks and APM for saved levels.
- `bun run audit:levels` — replay all five presets under full resident coverage, all lamps on, and all lamps off.
- `bun run dev` — start the game.
- `bun run lint`, `bun run test` and `bun run build` — check source, game rules and production bundle.

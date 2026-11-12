# Architecture

Nightwatcher Clean is one Next.js 16 App Router project. The UI lives under `src/client/`; pages are under `src/app/`; Route Handlers are the backend interface.

## Level pipeline

`data/model-configs.json` is input only for the server-side seeded generator in `src/server/level-builder.ts`. `GET /api/levels` lists four named seed presets. `GET /api/levels/[id]` builds the selected catalog entry, while `GET /api/levels/generate?seed=...` builds a custom seed. Both return normalized presets. The client receives only model URLs, transforms, routes, and game values; it never imports model tags or generator rules. `tools/build-levels.ts` produces a checked-in example preset without changing the catalog. Client modules never import `src/server/` or `data/model-configs.json`.

## Game state

`src/game/simulation.ts` owns deterministic session transitions and builds a citizen route point to nearby, unobstructed lamp index once when a level loads. Each one-second tick checks only those candidate lamps and updates energy, resident comfort, and shift phase. `src/game/game-store.ts` exposes these transitions through Zustand.

The HUD subscribes to session values; each lamp subscribes only to its own on/off value. The 3D scene and its static GLB placements do not subscribe to the timer or energy. NPC position interpolation mutates Three.js groups in `useFrame` and never sets React state. The WebGL scene uses a Client Component dynamic import with SSR disabled, following the local Next.js client-boundary guide. React Strict Mode is disabled in development because R3F 9.7 schedules `forceContextLoss()` during its Canvas effect cleanup; Next dev replays that cleanup after mount, leaving a white canvas. Re-enable Strict Mode after upgrading R3F to a version that handles the replay correctly.

## Progress

Campaign completion and the last used seed are saved under `nightwatcher-clean.progress` in `localStorage`, with schema version `1`. Invalid, unavailable, or outdated storage falls back to the initial campaign state.

## Commands

- `bun run build:levels` — rebuild checked-in level JSON from the model catalog.
- `bun run dev` — start Next.js locally.
- `bun run lint` — lint the source.
- `bun run build` — create the production build.

# Nightwatcher Clean MVP Implementation Plan

> **For agentic workers:** Implement task-by-task in this session using executing-plans. Steps use checkbox syntax for tracking.

**Goal:** Build a clean Next.js city-night game where the player manages lamps through one playable shift and progress persists locally.

**Architecture:** One Next.js app provides the UI and API Route Handlers. An offline builder turns server-only model metadata into checked-in level presets; the API serves those presets, while pure game rules and client rendering consume only the public preset contract.

**Tech Stack:** Next.js 16.3, React 19, TypeScript, Three.js, React Three Fiber, Drei, Ant Design, Bun.

**Spec:** `docs/superpowers/specs/2026-11-12-nightwatcher-clean-design.md`

## Global Constraints

- Use one repository and one Next.js project; API endpoints live in `app/api`.
- Keep model selection metadata and level building outside the client import graph.
- Serve deterministic checked-in JSON levels; do not generate a city in an API request.
- Persist campaign progress in versioned `localStorage`; no accounts or database.
- Keep simulation off the render loop; only discrete actions and a fixed one-second simulation tick update gameplay.
- Preserve the original repository and its uncommitted changes.

---

### Task 1: Establish the Next.js app shell

**Files:** `package.json`, `bun.lock`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `README.md`.

- [x] Copy the compatible Next/React/R3F dependency manifest and lockfile from the source project, rename the package, remove obsolete test scripts, and create the minimal App Router shell.
- [x] Add the product-facing README with install, development, level-build, lint, and production build commands.
- [x] Confirm the dependency manifest and Next configuration parse; run lint/build once the source files exist.

### Task 2: Define the public level contract and offline builder

**Files:** `src/game/level.ts`, `src/server/level-builder.ts`, `tools/build-levels.ts`, `data/model-configs.json`, `data/levels/level-01.json`, `data/levels/index.json`, `app/api/levels/route.ts`, `app/api/levels/[id]/route.ts`.

- [x] Define `LevelPreset`, `PlacedBuilding`, `PlacedLamp`, `CitizenRoute`, and `GameRules` as serializable values with asset URLs and transforms only.
- [x] Copy the source model config JSON to server-only builder input and select the smallest useful GLB subset for roads, buildings, lamps, and citizens.
- [x] Implement deterministic hand-authored grid placement from the config catalog; normalize only render/game fields and validate every referenced model file.
- [x] Generate and check in one playable preset plus a level index.
- [x] Implement GET handlers that read generated JSON and return 404 for unknown IDs; they never import the builder or raw model config.
- [x] Run the builder twice and compare generated output; run lint/build.

### Task 3: Implement pure gameplay and local campaign state

**Files:** `src/game/session.ts`, `src/game/simulation.ts`, `src/game/progress.ts`, `src/game/game-store.ts`.

- [x] Define immutable session state for phase, elapsed shift time, energy, satisfaction, and lamp switches.
- [x] Implement pure reducer functions for starting a shift, toggling a lamp, advancing one fixed tick, and resolving win/loss.
- [x] Precompute citizen-to-lamp coverage once per level using spatial buckets and segment/building occlusion checks; each tick aggregates existing coverage instead of testing every citizen against every lamp and building.
- [x] Implement versioned local progress load/save with safe defaults on unavailable or invalid browser storage.
- [x] Keep high-frequency visual state outside the gameplay store; emit snapshots only on discrete action/tick boundaries.
- [x] Run lint/build.

### Task 4: Build the playable city and HUD

**Files:** `src/client/GameScreen.tsx`, `src/client/CityScene.tsx`, `src/client/BuildingView.tsx`, `src/client/LampView.tsx`, `src/client/CitizenView.tsx`, `src/client/GameHud.tsx`, `src/client/LevelSelect.tsx`, `app/page.tsx`.

- [x] Load level list and a selected preset from the API with clear loading/error states.
- [x] Build static geometry once from preset placements; use instancing for repeated simple lamps/citizens when asset format allows.
- [x] Render lamps from discrete on/off state; use frame callbacks only for object interpolation and never set React state from them.
- [x] Keep HUD subscriptions focused on energy, satisfaction, and shift time; add start, lamp toggle, restart, and continue controls.
- [x] Show win/loss and unlocked level state; persist campaign progress after meaningful transitions.
- [x] Run lint/build and launch the app locally to check the main route and API responses.

### Task 5: Copy required content and finalize the repo

**Files:** `public/models/**`, generated level data, `README.md`, `docs/ARCHITECTURE.md`.

- [x] Copy only GLBs referenced by the generated preset; do not copy source editor or simulation code.
- [x] Document the level preset boundary, builder invocation, API endpoints, and gameplay state flow.
- [x] Run the builder, lint, and production build; inspect git status to confirm the source repository is untouched and no unused model packs entered the new repo.

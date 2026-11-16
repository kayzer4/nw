# Infinite Grid and Energy-Only Gameplay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a flicker-free, visually endless ground grid and make energy depletion the only loss condition.

**Architecture:** A single camera-centred shader plane draws and fades the grid before its geometric boundary. The game contract drops comfort from rules and sessions; simulation, planning, generated levels, and HUD operate on energy plus informational citizen-light state.

**Tech Stack:** Next.js 16, React 19, React Three Fiber, Three.js, TypeScript, Bun test.

**Spec:** `docs/superpowers/specs/2026-11-17-infinite-grid-and-energy-only-design.md`

## Global Constraints

- Keep grid lines world-aligned while moving its small render plane with the camera.
- Render exactly one ground-grid surface; fade it to transparency before its edge.
- A session can only lose when `energy <= 0`; it wins at shift end when energy remains.
- Keep `citizenLit` strictly informational.
- Remove all persisted comfort fields from generated levels and all comfort UI copy.

---

### Task 1: Replace coplanar grid meshes with one faded render surface

**Files:**
- Modify: `src/client/scene-effects.ts`
- Modify: `src/client/CityScene.tsx:25-125`
- Test: `tests/scene-effects.test.mjs`

**Interfaces:**
- Produces: `infiniteGridSurface(): { size: number; fadeStart: number; fadeEnd: number }`
- Consumes: camera X/Z coordinates via `gridCenterAtCamera(cameraX, cameraZ)`.

- [ ] **Step 1: Write the failing grid configuration test**

```js
test("grid fades before its small camera-centred plane can show an edge", () => {
  expect(sceneEffects.infiniteGridSurface?.()).toEqual({
    size: 96,
    fadeStart: 32,
    fadeEnd: 42,
  });
});
```

- [ ] **Step 2: Verify the test fails**

Run: `bun test tests/scene-effects.test.mjs`

Expected: FAIL because `infiniteGridSurface` still exposes the old large, two-layer configuration.

- [ ] **Step 3: Implement the single-surface configuration and shader fade**

```ts
export function infiniteGridSurface() {
  return { size: 96, fadeStart: 32, fadeEnd: 42 };
}
```

Pass `fadeStart` and `fadeEnd` to the grid shader as uniforms. In the fragment shader, derive `distanceToCamera` from `vWorldPosition.xz - cameraPosition.xz`, calculate `1.0 - smoothstep(fadeStart, fadeEnd, distanceToCamera)`, multiply the grid alpha by it, and `discard` when it reaches zero. Render one transparent `<mesh>` with one `<planeGeometry args={[size, size]} />`; remove the base `meshStandardMaterial` plane and the line offset. Keep its group at `y = -0.08`, rotated flat, and update its X/Z centre from the camera every frame.

- [ ] **Step 4: Verify the focused test passes**

Run: `bun test tests/scene-effects.test.mjs`

Expected: PASS with the grid configuration and camera-centering tests green.

- [ ] **Step 5: Commit the isolated grid change**

```bash
git add src/client/CityScene.tsx src/client/scene-effects.ts tests/scene-effects.test.mjs
git commit -m "fix: render a faded camera-centred grid"
```

### Task 2: Remove comfort from the core game contract and simulation

**Files:**
- Modify: `src/game/level.ts:24-36`
- Modify: `src/game/simulation.ts:4-67`
- Test: `tests/lighting-economy.test.mjs`

**Interfaces:**
- Produces: `GameRules` without satisfaction fields and `SessionSnapshot` without `satisfaction`.
- Produces: `advanceSession(level, current, states, elapsed)` where only energy depletion returns `phase: "lost"`.
- Consumes: existing `citizenLighting` for visual status only.

- [ ] **Step 1: Replace the comfort-loss test with energy-only behavior**

```js
test("darkness does not end a shift while the energy supply remains", () => {
  const start = { ...createSession(level), phase: "playing" };
  const result = advanceSession(level, start, { near: false, extra: false }, 30);
  expect(result.phase).toBe("won");
  expect(result.energy).toBe(10);
});

test("energy depletion remains the only loss condition", () => {
  const start = { ...createSession(level), phase: "playing" };
  expect(advanceSession(level, start, { near: true, extra: true }, 5).phase).toBe("lost");
});
```

- [ ] **Step 2: Verify the tests fail**

Run: `bun test tests/lighting-economy.test.mjs`

Expected: the darkness case fails because the current simulation loses through minimum satisfaction.

- [ ] **Step 3: Remove the satisfaction state and update simulation**

Remove `startingSatisfaction`, `minimumSatisfaction`, `comfortGainPerSecond`, and `comfortLossPerSecond` from `GameRules`; remove `satisfaction` from `SessionSnapshot` and `createSession`. In `advanceSession`, integrate only lamp energy, return `lost` only at `energy <= 0`, and otherwise return `won` at `shiftSeconds`. Retain `citizenLit` updates.

- [ ] **Step 4: Verify the focused test passes**

Run: `bun test tests/lighting-economy.test.mjs`

Expected: PASS with both darkness and depletion outcomes covered.

- [ ] **Step 5: Commit the core rules change**

```bash
git add src/game/level.ts src/game/simulation.ts tests/lighting-economy.test.mjs
git commit -m "feat: make energy the only loss condition"
```

### Task 3: Align planning, generation, and level data with energy-only rules

**Files:**
- Modify: `src/server/action-planner.ts`
- Modify: `src/server/level-builder.ts:457-550`
- Modify: `tests/game-state.test.mjs`
- Modify: `data/levels/first-shift.json`
- Modify: `data/levels/market-lights.json`
- Modify: `data/levels/north-gate.json`
- Modify: `data/levels/west-end.json`
- Modify: `data/levels/south-crossing.json`

**Interfaces:**
- Produces: planner results containing `actions`, `actionsPerMinute`, `steps`, and `remainingEnergy`, with no comfort fields.
- Consumes: `bun run build:levels` to regenerate the catalog using the revised `GameRules` shape.

- [ ] **Step 1: Update catalog contract tests first**

Replace comfort assertions with these energy-only outcomes:

```js
const darkOutcome = advanceSession(level, start, allOff, level.rules.shiftSeconds);
expect(darkOutcome.phase).toBe("won");
expect(darkOutcome.energy).toBe(level.rules.startingEnergy);
expect(advanceSession(level, start, allOn, level.rules.shiftSeconds).phase).toBe("lost");
expect("minimumSatisfaction" in level.rules).toBe(false);
```

Remove assertions about `remainingComfort` and tests that require every resident to stay lit as a win condition. Keep tests that validate lamp geometry, coverage, the energy budget, and an ideal lighting plan.

- [ ] **Step 2: Verify catalog tests fail**

Run: `bun test tests/game-state.test.mjs`

Expected: FAIL because saved levels still contain comfort fields and darkness still loses.

- [ ] **Step 3: Simplify the planner and generator**

Remove `comfort` from `SearchState`, effect deltas, frontier comparisons, sort order, and returned planner values. Keep the energy transition and energy-dominance pruning. Remove `minimumSatisfaction` from challenge entries and omit all comfort fields when creating `rules` in `buildLevel`.

- [ ] **Step 4: Regenerate saved levels**

Run: `bun run build:levels`

Expected: each catalog JSON has `rules` containing only shift duration, energy settings, and `requiredLitResidents`; no comfort properties remain.

- [ ] **Step 5: Verify the focused test passes**

Run: `bun test tests/game-state.test.mjs`

Expected: PASS for all catalog and generated-level contracts.

- [ ] **Step 6: Commit the data-contract migration**

```bash
git add src/server/action-planner.ts src/server/level-builder.ts tests/game-state.test.mjs data/levels
git commit -m "refactor: remove comfort from level planning"
```

### Task 4: Remove comfort and level-detail copy from the HUD

**Files:**
- Modify: `src/client/GameHud.tsx:35-50`
- Modify: `src/app/globals.css:38-45`
- Modify: `README.md:12`
- Test: `tests/russian-localization.test.mjs`

**Interfaces:**
- Consumes: energy-only `SessionSnapshot` and `GameRules` from Task 2.
- Produces: HUD with energy plus informational illuminated-resident count only.

- [ ] **Step 1: Write the failing UI-copy contract test**

```js
test("game HUD omits removed complexity, radius, and comfort copy", () => {
  const hud = fs.readFileSync("src/client/GameHud.tsx", "utf8");
  expect(hud).not.toContain("СЛОЖНОСТЬ");
  expect(hud).not.toContain("РАДИУС СВЕТА");
  expect(hud).not.toContain("КОМФОРТ ЖИТЕЛЕЙ");
  expect(hud).toContain("ЭНЕРГИЯ СЕТИ");
});
```

- [ ] **Step 2: Verify the test fails**

Run: `bun test tests/russian-localization.test.mjs`

Expected: FAIL because the current HUD renders all three removed labels.

- [ ] **Step 3: Remove the obsolete HUD elements and style**

Delete the `level-facts` row and comfort meter. Change the active instruction to energy-management copy that does not require lighting every resident. Remove the unused `.comfort-fill` rule. Update the README sentence so it explains that energy is the only failure condition and illuminated-resident count is informational.

- [ ] **Step 4: Verify the focused test passes**

Run: `bun test tests/russian-localization.test.mjs`

Expected: PASS with the removed and retained labels verified.

- [ ] **Step 5: Commit the HUD cleanup**

```bash
git add src/client/GameHud.tsx src/app/globals.css README.md tests/russian-localization.test.mjs
git commit -m "feat: simplify the energy-only HUD"
```

### Task 5: Run the complete verification suite

**Files:**
- Verify: `src`, `tests`, `data/levels`, `README.md`

- [ ] **Step 1: Run every automated test**

Run: `bun test`

Expected: all tests pass with no failure, error, or skipped comfort contract.

- [ ] **Step 2: Run static checks**

Run: `bun run lint`

Expected: ESLint completes with exit code 0.

- [ ] **Step 3: Run the production build when the active Next.js process releases its lock**

Run: `bun run build`

Expected: Next.js build completes with exit code 0. If the current development server owns the `.next` lock, report the lock rather than deleting it.

- [ ] **Step 4: Inspect the final diff**

Run: `git diff --check HEAD~4..HEAD && git status --short`

Expected: no whitespace errors and no unintended file changes staged by the implementation.

## Plan Self-Review

- Spec coverage: Task 1 implements the single faded grid; Tasks 2 and 3 remove comfort from runtime and saved contracts; Task 4 removes all requested HUD descriptions; Task 5 verifies every requirement.
- Placeholder scan: no incomplete implementation steps or unspecified tests remain.
- Type consistency: `GameRules`, `SessionSnapshot`, planner results, generated JSON, and HUD references all remove the same comfort properties.

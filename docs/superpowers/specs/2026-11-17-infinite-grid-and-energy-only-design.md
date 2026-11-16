# Infinite Grid and Energy-Only Gameplay Design

## Goal

Make the ground grid appear endless without flicker or a visible square edge. Simplify gameplay by removing the resident-comfort mechanic: a shift is lost only when the energy supply is exhausted.

## Grid rendering

`CityScene` will render one small grid plane that follows the camera in the X/Z axes. The plane's grid shader will draw both the faint ground tint and the grid lines, so no two coplanar surfaces compete for the same pixels.

The shader will fade its alpha to zero before the plane boundary. The fade distance is shorter than the plane's half-size and matches the scene's fog range, so the grid ends visually in darkness rather than at a geometric seam. The plane remains centred under the camera while panning; its line coordinates remain world-aligned, so the grid does not slide or jump.

## Gameplay rules

Remove satisfaction/comfort from the persisted `GameRules` and `SessionSnapshot` contracts. Remove comfort integration from the simulation and remove it as a loss condition. A session transitions to `lost` only when energy reaches zero; it transitions to `won` when the shift duration finishes with energy remaining.

Resident lighting remains available for scene markers and the HUD count, but is informational only: it does not alter energy, success, or failure.

The offline action planner will optimize lamp actions and remaining energy without tracking comfort. The level generator and checked-in level JSON files will omit former comfort fields.

## HUD

Remove the level-facts strip containing difficulty, light radius, and minimum comfort. Remove the resident-comfort meter. Keep the energy meter and the count of residents currently in light.

The active-shift copy will describe energy management rather than presenting resident lighting as a mandatory objective.

## Verification

Tests will cover the camera-centred, faded grid configuration and the lack of coplanar grid layers. Simulation tests will establish that darkness alone does not end a shift, while energy depletion does. Existing catalog, generator, planner, and UI tests will be updated to the energy-only level contract.

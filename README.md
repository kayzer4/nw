# Lightkeeper

A small 3D night-shift game built with Next.js 16, React 19, Three.js, and React Three Fiber.

## Run

```bash
bun install
bun run dev
```

Open http://localhost:3000; it redirects to `/levels`. Choose one of five districts at `/levels`, read its comic at `/levels/<id>/intro`, then press **Начать смену** to play at `/levels/<id>/play`. Each screen has its own URL, and a play URL can be opened directly. Use **LEVELS** to return to the catalog. Toggle lamps during the shift: leaving all of them on exhausts energy, while leaving them all off makes residents uncomfortable. The radius shown in the HUD matches the simulated and drawn ground footprint. Progress is saved in local storage.

## Generate levels locally

```bash
bun run build:levels
bun run build:levels --id north-gate --seed 12345
```

The tool reads `data/model-configs.json`, validates road coverage and the win/loss scenarios, then writes the JSON presets used by `GET /api/levels` and `GET /api/levels/[id]`. The server serves these files and does no generation at request time. See [architecture](docs/ARCHITECTURE.md) for details.

To measure the minimum number of lamp clicks needed to win each saved level on a two-second decision grid, run `bun run measure:apm`. It prints clicks, APM, and remaining energy. The current shifts last 40–65 seconds; each lamp consumes 0.7 kWh per second while on.

## Checks

```bash
bun run lint
bun run test
bun run build
```

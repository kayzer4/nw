# Nightwatcher Clean

A small 3D night-shift game built with Next.js 16, React 19, Three.js, and React Three Fiber.

## Run

```bash
bun install
bun run build:levels
bun run dev
```

Open http://localhost:3000. Choose a district from the in-game selector or enter a numeric seed from `0` to `4294967295`. The server uses the original 6×6 block-and-street generator and selects matching cell models from `data/model-configs.json`. It also places enough lamps to cover every resident route; the client receives only the ready preset. `GET /api/levels` lists districts, `GET /api/levels/[id]` generates the selected catalog preset, and `GET /api/levels/generate?seed=12345` builds a custom one. `bun run build:levels` writes the checked-in example preset.

## Checks

```bash
bun run lint
bun run build
```

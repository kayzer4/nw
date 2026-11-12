# Nightwatcher Clean

A small 3D night-shift game built with Next.js 16, React 19, Three.js, and React Three Fiber.

## Run

```bash
bun install
bun run build:levels
bun run dev
```

Open http://localhost:3000. Choose a district from the in-game selector or type a custom seed. `GET /api/levels` lists districts, `GET /api/levels/[id]` generates the selected catalog preset, and `GET /api/levels/generate?seed=...` builds a custom one. The client receives only the ready preset; model metadata stays on the server. `bun run build:levels` writes the checked-in example preset.

## Checks

```bash
bun run lint
bun run build
```

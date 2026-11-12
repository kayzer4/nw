# Nightwatcher Clean

A small 3D night-shift game built with Next.js 16, React 19, Three.js, and React Three Fiber.

## Run

```bash
bun install
bun run build:levels
bun run dev
```

Open http://localhost:3000. Generate a seeded district with `GET /api/levels/generate?seed=night-01`; the client receives a ready preset. Model metadata stays on the server. The offline builder writes the default example preset.

## Checks

```bash
bun run lint
bun run build
```

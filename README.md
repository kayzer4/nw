# Nightwatcher Clean

A small 3D night-shift game built with Next.js 16, React 19, Three.js, and React Three Fiber.

## Run

```bash
bun install
bun run build:levels
bun run dev
```

Open http://localhost:3000. The API serves checked-in level presets from `/api/levels`; model metadata is only used by the offline level builder.

## Checks

```bash
bun run lint
bun run build
```

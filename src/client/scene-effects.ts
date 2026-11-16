export function hoverRingState(hovered: boolean, elapsedSeconds: number) {
  if (!hovered) return { scale: 0, opacity: 0 };
  const pulse = (Math.sin(elapsedSeconds * 4) + 1) / 2;
  return { scale: 1 + pulse * 0.12, opacity: 0.72 + pulse * 0.22 };
}

export function infiniteGridOptions() {
  return { size: 20, fadeDistance: 35, fadeStrength: 1.5 };
}

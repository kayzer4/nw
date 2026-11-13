let startedAt = 0;
let stoppedAt = 0;
export const gameClock = {
  start() { startedAt = performance.now(); stoppedAt = 0; },
  stop() { if (startedAt && !stoppedAt) stoppedAt = performance.now(); },
  reset() { startedAt = 0; stoppedAt = 0; },
  elapsed() { return startedAt ? ((stoppedAt || performance.now()) - startedAt) / 1000 : 0; },
};

import { expect, test } from "bun:test";
import { useLampHoverStore } from "../src/client/lamp-hover-store";

test("lamp hover selects one lamp and ignores a stale pointer leave", () => {
  const hover = useLampHoverStore.getState();
  hover.setHoveredLamp("lamp-a");
  hover.setHoveredLamp("lamp-b");
  hover.clearHoveredLamp("lamp-a");
  expect(useLampHoverStore.getState().hoveredLampId).toBe("lamp-b");
  hover.clearHoveredLamp("lamp-b");
  expect(useLampHoverStore.getState().hoveredLampId).toBeNull();
});

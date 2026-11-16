import { expect, test } from "bun:test";
import * as result from "../src/client/GameHud";

test("a won shift receives a victory plaque", () => {
  expect(result.shiftResult?.("won")).toEqual({
    title: "СМЕНА ЗАВЕРШЕНА",
    detail: "Ты дождался рассвета.",
    tone: "won",
  });
});

test("an exhausted grid receives a defeat plaque", () => {
  expect(result.shiftResult?.("lost")).toEqual({
    title: "СМЕНА ПРОВАЛЕНА",
    detail: "Энергия закончилась.",
    tone: "lost",
  });
});

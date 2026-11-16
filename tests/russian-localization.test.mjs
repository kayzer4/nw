import { expect, test } from "bun:test";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

test("level catalog is presented in Russian", () => {
  const expected = {
    "first-shift": ["Первая смена", "Освети район до рассвета."],
    "market-lights": ["Огни рынка", "Проследи за улицами у ночного рынка."],
    "north-gate": ["Северные ворота", "Удержи освещённым северный переход."],
    "west-end": ["Западный квартал", "Проведи жителей западного района до утра."],
    "south-crossing": ["Южный переход", "Проведи последних жителей через южные улицы."],
  };
  for (const [id, [title, subtitle]] of Object.entries(expected)) {
    const level = JSON.parse(read(`data/levels/${id}.json`));
    expect([level.title, level.subtitle]).toEqual([title, subtitle]);
  }
});

test("public interface declares Russian locale", () => {
  expect(read("src/app/layout.tsx")).toContain('<html lang="ru" suppressHydrationWarning>');
  expect(read("src/client/GameHud.tsx")).toContain("ЭНЕРГИЯ СЕТИ");
  expect(read("src/client/LevelPicker.tsx")).toContain("Выбери район");
});

test("game HUD omits removed complexity, radius, and comfort copy", () => {
  const hud = read("src/client/GameHud.tsx");
  expect(hud).not.toContain("СЛОЖНОСТЬ");
  expect(hud).not.toContain("РАДИУС СВЕТА");
  expect(hud).not.toContain("КОМФОРТ ЖИТЕЛЕЙ");
  expect(hud).toContain("ЭНЕРГИЯ СЕТИ");
});

import { describe, expect, test } from "bun:test";
import { comicChapters, getComicChapter } from "../src/game/comics";

const levelIds = ["first-shift", "market-lights", "north-gate", "west-end", "south-crossing"];

describe("comic chapter contracts", () => {
  test("covers every playable district in story order", () => {
    expect(comicChapters).toHaveLength(levelIds.length);
    expect(comicChapters.map((chapter) => chapter.levelId)).toEqual(levelIds);
  });

  test("returns the matching chapter and safely falls back for unknown levels", () => {
    expect(getComicChapter("first-shift")?.title).toBe("Первая смена");
    expect(getComicChapter("unknown-level")).toBeUndefined();
  });
});

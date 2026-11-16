import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ComicIntro from "../src/client/ComicIntro";

const level = { id: "first-shift", title: "First Shift", subtitle: "Test", seed: "1001" };

test("play button is available as soon as level assets are ready", () => {
  const html = renderToStaticMarkup(createElement(ComicIntro, {
    level, levels: [level], ready: true, error: null, onStart: () => {}, onBack: () => {},
  }));
  const playButton = html.match(/<button[^>]*>Начать смену →<\/button>/)?.[0];
  expect(playButton).toBeDefined();
  expect(/\sdisabled(?:=|>)/.test(playButton)).toBe(false);
});

test("play button waits only for assets, not comic reading", () => {
  const html = renderToStaticMarkup(createElement(ComicIntro, {
    level, levels: [level], ready: false, error: null, onStart: () => {}, onBack: () => {},
  }));
  const playButton = html.match(/<button[^>]*>Начать смену →<\/button>/)?.[0];
  expect(playButton).toBeDefined();
  expect(/\sdisabled(?:=|>)/.test(playButton)).toBe(true);
});

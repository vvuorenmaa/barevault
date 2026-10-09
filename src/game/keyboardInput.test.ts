import { describe, expect, it } from "vitest";
import { findHeroActionForKey } from "./keyboardInput";

const NO_MODIFIERS = { altKey: false, ctrlKey: false, metaKey: false, shiftKey: false };

describe("findHeroActionForKey", () => {
  it.each([
    ["ArrowUp", "up"],
    ["ArrowDown", "down"],
    ["ArrowLeft", "left"],
    ["ArrowRight", "right"],
    [" ", "wait"],
    [".", "wait"],
  ])("maps %j to %s", (key, expectedAction) => {
    expect(findHeroActionForKey({ key, ...NO_MODIFIERS })).toBe(expectedAction);
  });

  it.each(["a", "Enter", "constructor", "toString", "__proto__"])("ignores %s", (key) => {
    expect(findHeroActionForKey({ key, ...NO_MODIFIERS })).toBeUndefined();
  });

  it.each(["altKey", "ctrlKey", "metaKey", "shiftKey"] as const)(
    "leaves keys alone to the browser when %s is held",
    (modifier) => {
      expect(findHeroActionForKey({ key: "ArrowLeft", ...NO_MODIFIERS, [modifier]: true })).toBeUndefined();
      expect(findHeroActionForKey({ key: " ", ...NO_MODIFIERS, [modifier]: true })).toBeUndefined();
    },
  );
});

import { describe, expect, it } from "vitest";
import { findDirectionForKey } from "./keyboardInput";

const NO_MODIFIERS = { altKey: false, ctrlKey: false, metaKey: false, shiftKey: false };

describe("findDirectionForKey", () => {
  it.each([
    ["ArrowUp", "up"],
    ["ArrowDown", "down"],
    ["ArrowLeft", "left"],
    ["ArrowRight", "right"],
  ])("maps %s to %s", (key, expectedDirection) => {
    expect(findDirectionForKey({ key, ...NO_MODIFIERS })).toBe(expectedDirection);
  });

  it.each(["a", "Enter", "constructor", "toString", "__proto__"])("ignores %s", (key) => {
    expect(findDirectionForKey({ key, ...NO_MODIFIERS })).toBeUndefined();
  });

  it.each(["altKey", "ctrlKey", "metaKey", "shiftKey"] as const)(
    "leaves arrow keys alone to the browser when %s is held",
    (modifier) => {
      expect(findDirectionForKey({ key: "ArrowLeft", ...NO_MODIFIERS, [modifier]: true })).toBeUndefined();
    },
  );
});

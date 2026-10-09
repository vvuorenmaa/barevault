import type { HeroAction } from "../engine/turn";

export interface KeyPress {
  readonly key: string;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
}

// A Map avoids inherited object keys such as "constructor" counting as a mapped key
const ACTION_BY_KEY: ReadonlyMap<string, HeroAction> = new Map([
  ["ArrowUp", "up"],
  ["ArrowDown", "down"],
  ["ArrowLeft", "left"],
  ["ArrowRight", "right"],
  [" ", "wait"],
  [".", "wait"],
]);

export function findHeroActionForKey(keyPress: KeyPress): HeroAction | undefined {
  // Modified keys belong to the browser (back navigation, text selection)
  if (keyPress.altKey || keyPress.ctrlKey || keyPress.metaKey || keyPress.shiftKey) {
    return undefined;
  }
  return ACTION_BY_KEY.get(keyPress.key);
}

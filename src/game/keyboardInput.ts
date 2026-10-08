import type { Direction } from "../engine/turn";

export interface KeyPress {
  readonly key: string;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
}

// A Map avoids inherited object keys such as "constructor" counting as a mapped key
const DIRECTION_BY_KEY: ReadonlyMap<string, Direction> = new Map([
  ["ArrowUp", "up"],
  ["ArrowDown", "down"],
  ["ArrowLeft", "left"],
  ["ArrowRight", "right"],
]);

export function findDirectionForKey(keyPress: KeyPress): Direction | undefined {
  // Modified arrow keys belong to the browser (back navigation, text selection)
  if (keyPress.altKey || keyPress.ctrlKey || keyPress.metaKey || keyPress.shiftKey) {
    return undefined;
  }
  return DIRECTION_BY_KEY.get(keyPress.key);
}

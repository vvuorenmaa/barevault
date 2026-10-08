export interface RandomGeneratorState {
  readonly state: number;
}

export interface RandomGenerator {
  nextFloat(): number;
  nextIntegerInRange(minimum: number, maximum: number): number;
  pickFrom<Item>(items: readonly Item[]): Item;
  getState(): RandomGeneratorState;
}

const MAX_UNSIGNED_32 = 0xffffffff;
const MAX_RANGE_SPAN = MAX_UNSIGNED_32 + 1;

// FNV-1a: spreads similar strings ("abc", "abd") over unrelated 32-bit states
function hashSeedToUnsigned32(seed: string | number): number {
  let hash = 0x811c9dc5;
  for (const character of String(seed)) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// mulberry32: small, fast and good enough for game randomness; not for cryptography
function createGeneratorFromState(initialState: number): RandomGenerator {
  let state = initialState >>> 0;

  function nextFloat(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  }

  function nextIntegerInRange(minimum: number, maximum: number): number {
    if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || minimum > maximum) {
      throw new RangeError("Range must be two safe integers with minimum <= maximum");
    }
    // The source has 32 bits of entropy, so a wider span would silently skip values
    if (maximum - minimum + 1 > MAX_RANGE_SPAN) {
      throw new RangeError("Range spans more values than the 32-bit source can cover");
    }
    return minimum + Math.floor(nextFloat() * (maximum - minimum + 1));
  }

  return {
    nextFloat,
    nextIntegerInRange,
    pickFrom<Item>(items: readonly Item[]): Item {
      if (items.length === 0) {
        throw new RangeError("Cannot pick from an empty list");
      }
      // The index is always within bounds; the cast keeps lists that contain undefined valid
      return items[nextIntegerInRange(0, items.length - 1)] as Item;
    },
    getState: () => ({ state }),
  };
}

export function createRandomGenerator(seed: string | number): RandomGenerator {
  return createGeneratorFromState(hashSeedToUnsigned32(seed));
}

function isValidSavedState(savedState: unknown): savedState is RandomGeneratorState {
  if (typeof savedState !== "object" || savedState === null) {
    return false;
  }
  const { state } = savedState as { state?: unknown };
  return typeof state === "number" && Number.isInteger(state) && state >= 0 && state <= MAX_UNSIGNED_32;
}

// Saved state comes from JSON, so it is untrusted input
export function restoreRandomGenerator(savedState: unknown): RandomGenerator {
  if (!isValidSavedState(savedState)) {
    throw new RangeError("Saved random generator state must be { state: unsigned 32-bit integer }");
  }
  return createGeneratorFromState(savedState.state);
}

export interface RandomGeneratorState {
  readonly state: number;
}

export interface RandomGenerator {
  nextFloat(): number;
  nextIntegerInRange(minimum: number, maximum: number): number;
  pickFrom<Item>(items: readonly Item[]): Item;
  getState(): RandomGeneratorState;
}

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
    if (!Number.isInteger(minimum) || !Number.isInteger(maximum) || minimum > maximum) {
      throw new RangeError("Range must be two integers with minimum <= maximum");
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
      return items[nextIntegerInRange(0, items.length - 1)] as Item;
    },
    getState: () => ({ state }),
  };
}

export function createRandomGenerator(seed: string | number): RandomGenerator {
  return createGeneratorFromState(hashSeedToUnsigned32(seed));
}

export function restoreRandomGenerator(savedState: RandomGeneratorState): RandomGenerator {
  if (!Number.isInteger(savedState.state)) {
    throw new RangeError("Saved random generator state must be an integer");
  }
  return createGeneratorFromState(savedState.state);
}

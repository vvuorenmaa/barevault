import { describe, expect, it } from "vitest";
import { createRandomGenerator, restoreRandomGenerator } from "./randomGenerator";

function drawFloats(seed: string | number, count: number): number[] {
  const generator = createRandomGenerator(seed);
  return Array.from({ length: count }, () => generator.nextFloat());
}

describe("createRandomGenerator", () => {
  it("produces the same sequence for the same seed", () => {
    expect(drawFloats("abc", 20)).toEqual(drawFloats("abc", 20));
  });

  it("produces different sequences for different seeds", () => {
    expect(drawFloats("abc", 20)).not.toEqual(drawFloats("abd", 20));
    expect(drawFloats(1, 20)).not.toEqual(drawFloats(2, 20));
  });

  it("keeps floats within [0, 1)", () => {
    for (const value of drawFloats("range", 5000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("draws integers within the inclusive range and reaches both ends", () => {
    const generator = createRandomGenerator("integers");
    const drawnValues = new Set(
      Array.from({ length: 2000 }, () => generator.nextIntegerInRange(3, 6)),
    );
    expect([...drawnValues].sort((first, second) => first - second)).toEqual([3, 4, 5, 6]);
  });

  it.each([
    [5, 4],
    [1.5, 3],
    [1, Number.NaN],
  ])("rejects an invalid integer range (%s, %s)", (minimum, maximum) => {
    const generator = createRandomGenerator("invalid");
    expect(() => generator.nextIntegerInRange(minimum, maximum)).toThrow(RangeError);
  });

  it("picks only elements of the given list", () => {
    const generator = createRandomGenerator("pick");
    const items = ["wall", "floor", "vault"];
    for (let attempt = 0; attempt < 200; attempt += 1) {
      expect(items).toContain(generator.pickFrom(items));
    }
  });

  it("refuses to pick from an empty list", () => {
    expect(() => createRandomGenerator("empty").pickFrom([])).toThrow(RangeError);
  });

  // Shared seeds (e.g. ?seed=bare-vault) must keep producing the same dungeon across versions.
  // Expected values come from an independent textbook FNV-1a + mulberry32 implementation.
  it("keeps producing the known sequence for a given seed", () => {
    const generator = createRandomGenerator("bare-vault");
    expect(Array.from({ length: 5 }, () => generator.nextFloat())).toEqual([
      0.43168465443886817, 0.5719305030070245, 0.17260272707790136, 0.9459652891382575,
      0.4631401321385056,
    ]);
  });

  it("continues the same sequence after its state is saved as JSON and restored", () => {
    const original = createRandomGenerator("save-me");
    original.nextFloat();
    original.nextFloat();

    const savedState = JSON.stringify(original.getState());
    const restored = restoreRandomGenerator(JSON.parse(savedState));

    expect(Array.from({ length: 10 }, () => restored.nextFloat())).toEqual(
      Array.from({ length: 10 }, () => original.nextFloat()),
    );
  });
});

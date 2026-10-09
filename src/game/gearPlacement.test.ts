import { describe, expect, it } from "vitest";
import { createGridFromRows } from "../engine/grid";
import { placeStartingGear } from "./gearPlacement";

describe("placeStartingGear", () => {
  const hero = { column: 2, row: 1 };

  it("puts the weapon and the armor on free floor tiles next to the hero", () => {
    const grid = createGridFromRows(["#####", "#...#", "#####"]);
    const items = placeStartingGear(grid, hero);
    expect(items.map((item) => [item.kind, item.position])).toEqual([
      ["weapon", { column: 3, row: 1 }],
      ["armor", { column: 1, row: 1 }],
    ]);
  });

  it("skips walls", () => {
    const grid = createGridFromRows(["###", "#..", "#.#", "###"].map((row) => row.padEnd(5, "#")));
    const items = placeStartingGear(grid, { column: 1, row: 1 });
    expect(items.map((item) => item.position)).toEqual([
      { column: 2, row: 1 },
      { column: 1, row: 2 },
    ]);
  });

  it("places fewer items when there is no room", () => {
    const grid = createGridFromRows(["###", "#.#", "###"]);
    expect(placeStartingGear(grid, { column: 1, row: 1 })).toEqual([]);
  });
});

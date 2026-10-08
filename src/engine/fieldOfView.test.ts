import { describe, expect, it } from "vitest";
import { computeFieldOfView } from "./fieldOfView";
import { createGridFromRows, type TilePosition } from "./grid";

function isVisible(visibleTiles: readonly TilePosition[], column: number, row: number): boolean {
  return visibleTiles.some((tile) => tile.column === column && tile.row === row);
}

describe("computeFieldOfView", () => {
  it("always includes the origin", () => {
    const grid = createGridFromRows(["###", "#.#", "###"]);
    expect(isVisible(computeFieldOfView(grid, { column: 1, row: 1 }, 5), 1, 1)).toBe(true);
  });

  it("sees the whole of an open room, including its surrounding walls", () => {
    const grid = createGridFromRows(["#####", "#...#", "#...#", "#...#", "#####"]);
    const visibleTiles = computeFieldOfView(grid, { column: 2, row: 2 }, 10);
    expect(visibleTiles).toHaveLength(25);
  });

  it("does not see beyond the radius", () => {
    const grid = createGridFromRows(["..........."]);
    const visibleTiles = computeFieldOfView(grid, { column: 0, row: 0 }, 3);
    expect(isVisible(visibleTiles, 3, 0)).toBe(true);
    expect(isVisible(visibleTiles, 4, 0)).toBe(false);
  });

  it("sees a wall but not what lies behind it", () => {
    const grid = createGridFromRows(["..#.."]);
    const visibleTiles = computeFieldOfView(grid, { column: 0, row: 0 }, 10);
    expect(isVisible(visibleTiles, 1, 0)).toBe(true);
    expect(isVisible(visibleTiles, 2, 0)).toBe(true);
    expect(isVisible(visibleTiles, 3, 0)).toBe(false);
    expect(isVisible(visibleTiles, 4, 0)).toBe(false);
  });

  it("is blocked diagonally by walls too", () => {
    const grid = createGridFromRows(["...", ".#.", "..."]);
    const visibleTiles = computeFieldOfView(grid, { column: 0, row: 0 }, 10);
    expect(isVisible(visibleTiles, 1, 1)).toBe(true);
    expect(isVisible(visibleTiles, 2, 2)).toBe(false);
  });

  it("does not report tiles outside the grid", () => {
    const grid = createGridFromRows(["..", ".."]);
    const visibleTiles = computeFieldOfView(grid, { column: 0, row: 0 }, 10);
    expect(visibleTiles).toHaveLength(4);
  });

  it("rejects an origin outside the grid and an invalid radius", () => {
    const grid = createGridFromRows(["..", ".."]);
    expect(() => computeFieldOfView(grid, { column: 2, row: 0 }, 3)).toThrow(RangeError);
    expect(() => computeFieldOfView(grid, { column: 0, row: 0 }, -1)).toThrow(RangeError);
    expect(() => computeFieldOfView(grid, { column: 0, row: 0 }, 1.5)).toThrow(RangeError);
  });
});

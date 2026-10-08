import { describe, expect, it } from "vitest";
import { createGrid, createGridFromRows, getTile, setTile } from "./grid";

describe("createGrid", () => {
  it("fills every tile with the given tile kind", () => {
    const grid = createGrid(3, 2, "wall");
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        expect(getTile(grid, column, row)).toBe("wall");
      }
    }
  });

  it("reports its dimensions", () => {
    const grid = createGrid(4, 5, "floor");
    expect(grid.columnCount).toBe(4);
    expect(grid.rowCount).toBe(5);
  });

  it.each([
    [0, 3],
    [3, 0],
    [-1, 3],
    [2.5, 3],
    [Number.NaN, 3],
  ])("rejects invalid dimensions (%s x %s)", (columnCount, rowCount) => {
    expect(() => createGrid(columnCount, rowCount, "wall")).toThrow(RangeError);
  });
});

describe("setTile", () => {
  it("changes only the addressed tile", () => {
    const grid = createGrid(3, 2, "wall");
    setTile(grid, 2, 1, "floor");
    expect(getTile(grid, 2, 1)).toBe("floor");
    expect(getTile(grid, 1, 1)).toBe("wall");
    expect(getTile(grid, 2, 0)).toBe("wall");
  });

  it("rejects writes outside the grid", () => {
    const grid = createGrid(3, 2, "wall");
    expect(() => setTile(grid, 3, 0, "floor")).toThrow(RangeError);
  });
});

describe("createGridFromRows", () => {
  it("reads # as wall and . as floor, row by row", () => {
    const grid = createGridFromRows(["#.#", "..#"]);
    expect(grid.columnCount).toBe(3);
    expect(grid.rowCount).toBe(2);
    expect(getTile(grid, 0, 0)).toBe("wall");
    expect(getTile(grid, 1, 0)).toBe("floor");
    expect(getTile(grid, 2, 0)).toBe("wall");
    expect(getTile(grid, 0, 1)).toBe("floor");
    expect(getTile(grid, 2, 1)).toBe("wall");
  });

  it.each([
    [[]],
    [["#.#", "#."]],
    [["#x#"]],
  ])("rejects empty, ragged or unknown-character input (%j)", (rows) => {
    expect(() => createGridFromRows(rows)).toThrow(RangeError);
  });
});

describe("getTile", () => {
  it.each([
    [-1, 0],
    [0, -1],
    [3, 0],
    [0, 2],
    [1.5, 0],
  ])("rejects access outside the grid (%s, %s)", (column, row) => {
    const grid = createGrid(3, 2, "floor");
    expect(() => getTile(grid, column, row)).toThrow(RangeError);
  });
});

import { describe, expect, it } from "vitest";
import { createGridFromRows } from "./grid";
import { findNextStepToward } from "./pathfinding";

describe("findNextStepToward", () => {
  it("steps one tile along a straight corridor", () => {
    const grid = createGridFromRows(["#####", "#...#", "#####"]);
    expect(findNextStepToward(grid, { column: 1, row: 1 }, { column: 3, row: 1 }, [])).toEqual({
      column: 2,
      row: 1,
    });
  });

  it("goes around a wall by the shortest route", () => {
    const grid = createGridFromRows(["#####", "#.#.#", "#...#", "#####"]);
    // Straight line is blocked at column 2, so the first step has to be down
    expect(findNextStepToward(grid, { column: 1, row: 1 }, { column: 3, row: 1 }, [])).toEqual({
      column: 1,
      row: 2,
    });
  });

  it("stays put next to the target instead of stepping onto it", () => {
    const grid = createGridFromRows(["#####", "#...#", "#####"]);
    expect(findNextStepToward(grid, { column: 2, row: 1 }, { column: 3, row: 1 }, [])).toBeUndefined();
  });

  it("stays put when it is already on the target", () => {
    const grid = createGridFromRows(["###", "#.#", "###"]);
    expect(findNextStepToward(grid, { column: 1, row: 1 }, { column: 1, row: 1 }, [])).toBeUndefined();
  });

  it("has no step when the target cannot be reached", () => {
    const grid = createGridFromRows(["#####", "#.#.#", "#####"]);
    expect(findNextStepToward(grid, { column: 1, row: 1 }, { column: 3, row: 1 }, [])).toBeUndefined();
  });

  it("walks around tiles occupied by others", () => {
    const grid = createGridFromRows(["#####", "#...#", "#...#", "#####"]);
    const step = findNextStepToward(grid, { column: 1, row: 1 }, { column: 3, row: 1 }, [
      { column: 2, row: 1 },
    ]);
    expect(step).toEqual({ column: 1, row: 2 });
  });

  it("has no step when occupied tiles seal the only route", () => {
    const grid = createGridFromRows(["#####", "#...#", "#####"]);
    expect(
      findNextStepToward(grid, { column: 1, row: 1 }, { column: 3, row: 1 }, [{ column: 2, row: 1 }]),
    ).toBeUndefined();
  });

  it("is deterministic when several shortest routes exist", () => {
    const grid = createGridFromRows(["#####", "#...#", "#...#", "#####"]);
    const firstAnswer = findNextStepToward(grid, { column: 1, row: 1 }, { column: 3, row: 2 }, []);
    const secondAnswer = findNextStepToward(grid, { column: 1, row: 1 }, { column: 3, row: 2 }, []);
    expect(firstAnswer).toEqual(secondAnswer);
  });
});

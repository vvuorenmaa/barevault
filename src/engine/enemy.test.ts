import { describe, expect, it } from "vitest";
import { chaseHeroTurn } from "./enemy";
import { createGridFromRows } from "./grid";
import { createWorld, playTurn } from "./turn";

const LONG_CORRIDOR = ["#########", "#.......#", "#########"];

describe("chaseHeroTurn", () => {
  it("moves an enemy one step toward the hero", () => {
    const grid = createGridFromRows(LONG_CORRIDOR);
    const world = createWorld(grid, { column: 1, row: 1 }, 8, [{ position: { column: 6, row: 1 } }]);
    expect(chaseHeroTurn(world).enemies).toEqual([{ position: { column: 5, row: 1 } }]);
  });

  it("stops next to the hero instead of stepping onto the hero", () => {
    const grid = createGridFromRows(LONG_CORRIDOR);
    const world = createWorld(grid, { column: 1, row: 1 }, 8, [{ position: { column: 2, row: 1 } }]);
    expect(chaseHeroTurn(world).enemies).toEqual([{ position: { column: 2, row: 1 } }]);
  });

  it("goes around walls", () => {
    const grid = createGridFromRows(["#####", "#.#.#", "#...#", "#####"]);
    const world = createWorld(grid, { column: 1, row: 1 }, 8, [{ position: { column: 3, row: 1 } }]);
    expect(chaseHeroTurn(world).enemies).toEqual([{ position: { column: 3, row: 2 } }]);
  });

  it("leaves an enemy alone when the hero cannot be reached", () => {
    const grid = createGridFromRows(["#####", "#.#.#", "#####"]);
    const world = createWorld(grid, { column: 1, row: 1 }, 8, [{ position: { column: 3, row: 1 } }]);
    expect(chaseHeroTurn(world).enemies).toEqual([{ position: { column: 3, row: 1 } }]);
  });

  it("never lets two enemies end up on the same tile", () => {
    const grid = createGridFromRows(["#####", "#...#", "#####"]);
    const world = createWorld(grid, { column: 1, row: 1 }, 8, [
      { position: { column: 3, row: 1 } },
      { position: { column: 3, row: 1 } },
    ]);
    const positions = chaseHeroTurn(world).enemies.map((enemy) => `${enemy.position.column},${enemy.position.row}`);
    expect(new Set(positions).size).toBe(positions.length);
  });

  it("does not change the previous world", () => {
    const grid = createGridFromRows(LONG_CORRIDOR);
    const world = createWorld(grid, { column: 1, row: 1 }, 8, [{ position: { column: 6, row: 1 } }]);
    chaseHeroTurn(world);
    expect(world.enemies).toEqual([{ position: { column: 6, row: 1 } }]);
  });
});

describe("enemies in the turn loop", () => {
  it("closes in after each turn the hero takes", () => {
    const grid = createGridFromRows(LONG_CORRIDOR);
    const world = createWorld(grid, { column: 1, row: 1 }, 8, [{ position: { column: 7, row: 1 } }]);
    const result = playTurn(world, "right", [chaseHeroTurn]);
    expect(result.world.hero).toEqual({ column: 2, row: 1 });
    expect(result.world.enemies).toEqual([{ position: { column: 6, row: 1 } }]);
  });

  it("does not move when the hero bumps into a wall", () => {
    const grid = createGridFromRows(LONG_CORRIDOR);
    const world = createWorld(grid, { column: 1, row: 1 }, 8, [{ position: { column: 7, row: 1 } }]);
    const result = playTurn(world, "up", [chaseHeroTurn]);
    expect(result.turnTaken).toBe(false);
    expect(result.world.enemies).toEqual([{ position: { column: 7, row: 1 } }]);
  });
});

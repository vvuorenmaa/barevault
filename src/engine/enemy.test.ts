import { describe, expect, it } from "vitest";
import { chaseHeroTurn } from "./enemy";
import { createGridFromRows, type TilePosition } from "./grid";
import { createWorld, playTurn, type World } from "./turn";

const LONG_CORRIDOR = ["#########", "#.......#", "#########"];
const HERO_AT_WEST_END: TilePosition = { column: 1, row: 1 };

function createWorldWithEnemies(
  rows: readonly string[],
  hero: TilePosition,
  enemyPositions: readonly TilePosition[],
): World {
  return createWorld(createGridFromRows(rows), hero, {
    enemies: enemyPositions.map((position) => ({ position })),
  });
}

function listEnemyPositions(world: World): TilePosition[] {
  return world.enemies.map((enemy) => enemy.position);
}

describe("chaseHeroTurn", () => {
  it("moves an enemy one step toward the hero", () => {
    const world = createWorldWithEnemies(LONG_CORRIDOR, HERO_AT_WEST_END, [{ column: 6, row: 1 }]);
    expect(listEnemyPositions(chaseHeroTurn(world))).toEqual([{ column: 5, row: 1 }]);
  });

  it("stops next to the hero instead of stepping onto the hero", () => {
    const world = createWorldWithEnemies(LONG_CORRIDOR, HERO_AT_WEST_END, [{ column: 2, row: 1 }]);
    expect(listEnemyPositions(chaseHeroTurn(world))).toEqual([{ column: 2, row: 1 }]);
  });

  it("goes around walls", () => {
    const world = createWorldWithEnemies(
      ["#####", "#.#.#", "#...#", "#####"],
      HERO_AT_WEST_END,
      [{ column: 3, row: 1 }],
    );
    expect(listEnemyPositions(chaseHeroTurn(world))).toEqual([{ column: 3, row: 2 }]);
  });

  it("leaves an enemy alone when the hero cannot be reached", () => {
    const world = createWorldWithEnemies(["#####", "#.#.#", "#####"], HERO_AT_WEST_END, [
      { column: 3, row: 1 },
    ]);
    expect(listEnemyPositions(chaseHeroTurn(world))).toEqual([{ column: 3, row: 1 }]);
  });

  it("lets enemies queue up behind each other in a corridor", () => {
    const world = createWorldWithEnemies(LONG_CORRIDOR, HERO_AT_WEST_END, [
      { column: 3, row: 1 },
      { column: 4, row: 1 },
    ]);
    expect(listEnemyPositions(chaseHeroTurn(world))).toEqual([
      { column: 2, row: 1 },
      { column: 3, row: 1 },
    ]);
  });

  it("sends a second enemy around the first when both want the same tile", () => {
    const world = createWorldWithEnemies(
      ["#####", "#...#", "#...#", "#####"],
      HERO_AT_WEST_END,
      [
        { column: 3, row: 1 },
        { column: 2, row: 2 },
      ],
    );
    // The first enemy takes (2,1), so the second has to approach through (1,2)
    expect(listEnemyPositions(chaseHeroTurn(world))).toEqual([
      { column: 2, row: 1 },
      { column: 1, row: 2 },
    ]);
  });

  it("does not change the previous world", () => {
    const world = createWorldWithEnemies(LONG_CORRIDOR, HERO_AT_WEST_END, [{ column: 6, row: 1 }]);
    chaseHeroTurn(world);
    expect(listEnemyPositions(world)).toEqual([{ column: 6, row: 1 }]);
  });
});

describe("enemies in the turn loop", () => {
  it("closes in after each turn the hero takes", () => {
    const world = createWorldWithEnemies(LONG_CORRIDOR, HERO_AT_WEST_END, [{ column: 7, row: 1 }]);
    const result = playTurn(world, "right", [chaseHeroTurn]);
    expect(result.world.hero).toEqual({ column: 2, row: 1 });
    expect(listEnemyPositions(result.world)).toEqual([{ column: 6, row: 1 }]);
  });

  it("keeps the hero from stepping onto an enemy and costs no turn", () => {
    const world = createWorldWithEnemies(LONG_CORRIDOR, HERO_AT_WEST_END, [{ column: 2, row: 1 }]);
    const result = playTurn(world, "right", [chaseHeroTurn]);
    expect(result.turnTaken).toBe(false);
    expect(result.world.hero).toEqual(HERO_AT_WEST_END);
  });

  it("does not move when the hero bumps into a wall", () => {
    const world = createWorldWithEnemies(LONG_CORRIDOR, HERO_AT_WEST_END, [{ column: 7, row: 1 }]);
    const result = playTurn(world, "up", [chaseHeroTurn]);
    expect(result.turnTaken).toBe(false);
    expect(listEnemyPositions(result.world)).toEqual([{ column: 7, row: 1 }]);
  });
});

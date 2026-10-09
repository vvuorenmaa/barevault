import { describe, expect, it } from "vitest";
import { ENEMY_STARTING_HIT_POINTS } from "./combat";
import { enemiesTurn } from "./enemy";
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
    enemies: enemyPositions.map((position) => ({ position, hitPoints: ENEMY_STARTING_HIT_POINTS, hasNoticedHero: true })),
  });
}

function listEnemyPositions(world: World): TilePosition[] {
  return world.enemies.map((enemy) => enemy.position);
}

describe("enemiesTurn", () => {
  it("moves an enemy one step toward the hero", () => {
    const world = createWorldWithEnemies(LONG_CORRIDOR, HERO_AT_WEST_END, [{ column: 6, row: 1 }]);
    expect(listEnemyPositions(enemiesTurn(world))).toEqual([{ column: 5, row: 1 }]);
  });

  it("stops next to the hero instead of stepping onto the hero", () => {
    const world = createWorldWithEnemies(LONG_CORRIDOR, HERO_AT_WEST_END, [{ column: 2, row: 1 }]);
    expect(listEnemyPositions(enemiesTurn(world))).toEqual([{ column: 2, row: 1 }]);
  });

  it("goes around walls", () => {
    const world = createWorldWithEnemies(
      ["#####", "#.#.#", "#...#", "#####"],
      HERO_AT_WEST_END,
      [{ column: 3, row: 1 }],
    );
    expect(listEnemyPositions(enemiesTurn(world))).toEqual([{ column: 3, row: 2 }]);
  });

  it("leaves an enemy alone when the hero cannot be reached", () => {
    const world = createWorldWithEnemies(["#####", "#.#.#", "#####"], HERO_AT_WEST_END, [
      { column: 3, row: 1 },
    ]);
    expect(listEnemyPositions(enemiesTurn(world))).toEqual([{ column: 3, row: 1 }]);
  });

  it("lets enemies queue up behind each other in a corridor", () => {
    const world = createWorldWithEnemies(LONG_CORRIDOR, HERO_AT_WEST_END, [
      { column: 3, row: 1 },
      { column: 4, row: 1 },
    ]);
    expect(listEnemyPositions(enemiesTurn(world))).toEqual([
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
    expect(listEnemyPositions(enemiesTurn(world))).toEqual([
      { column: 2, row: 1 },
      { column: 1, row: 2 },
    ]);
  });

  it("does not change the previous world", () => {
    const world = createWorldWithEnemies(LONG_CORRIDOR, HERO_AT_WEST_END, [{ column: 6, row: 1 }]);
    enemiesTurn(world);
    expect(listEnemyPositions(world)).toEqual([{ column: 6, row: 1 }]);
  });
});

describe("enemies in the turn loop", () => {
  it("closes in after each turn the hero takes", () => {
    const world = createWorldWithEnemies(LONG_CORRIDOR, HERO_AT_WEST_END, [{ column: 7, row: 1 }]);
    const result = playTurn(world, "right", [enemiesTurn]);
    expect(result.world.hero).toEqual({ column: 2, row: 1 });
    expect(listEnemyPositions(result.world)).toEqual([{ column: 6, row: 1 }]);
  });

  it("does not move when the hero bumps into a wall", () => {
    const world = createWorldWithEnemies(LONG_CORRIDOR, HERO_AT_WEST_END, [{ column: 7, row: 1 }]);
    const result = playTurn(world, "up", [enemiesTurn]);
    expect(result.turnTaken).toBe(false);
    expect(listEnemyPositions(result.world)).toEqual([{ column: 7, row: 1 }]);
  });
});

describe("enemies that have not noticed the hero", () => {
  const FAR_CORRIDOR = ["#".repeat(22), `#${".".repeat(20)}#`, "#".repeat(22)];

  function createWorldWithEnemyAt(position: TilePosition, hasNoticedHero: boolean): World {
    return createWorld(createGridFromRows(FAR_CORRIDOR), HERO_AT_WEST_END, {
      enemies: [{ position, hitPoints: ENEMY_STARTING_HIT_POINTS, hasNoticedHero }],
    });
  }

  it("stay where they are while out of the hero's sight", () => {
    const world = createWorldWithEnemyAt({ column: 15, row: 1 }, false);
    expect(listEnemyPositions(enemiesTurn(world))).toEqual([{ column: 15, row: 1 }]);
  });

  it("start chasing as soon as the hero sees them", () => {
    // Sight radius is 8, so the enemy 9 tiles away comes into view when the hero steps right
    const world = createWorldWithEnemyAt({ column: 10, row: 1 }, false);
    const result = playTurn(world, "right", [enemiesTurn]);
    expect(listEnemyPositions(result.world)).toEqual([{ column: 9, row: 1 }]);
  });

  it("stay put just outside the sight radius when the hero does not come closer", () => {
    const world = createWorldWithEnemyAt({ column: 10, row: 1 }, false);
    const result = playTurn(world, "wait", [enemiesTurn]);
    expect(listEnemyPositions(result.world)).toEqual([{ column: 10, row: 1 }]);
  });

  it("wake at exactly the sight radius", () => {
    const world = createWorldWithEnemyAt({ column: 9, row: 1 }, false);
    expect(world.enemies[0]?.hasNoticedHero).toBe(true);
  });

  it("stay put behind a wall even when within the sight radius", () => {
    const world = createWorld(createGridFromRows(["#####", "#.#.#", "#####"]), HERO_AT_WEST_END, {
      enemies: [{ position: { column: 3, row: 1 }, hitPoints: ENEMY_STARTING_HIT_POINTS, hasNoticedHero: false }],
    });
    expect(listEnemyPositions(playTurn(world, "wait", [enemiesTurn]).world)).toEqual([{ column: 3, row: 1 }]);
  });

  it("keep chasing after the hero is out of sight again", () => {
    const world = createWorldWithEnemyAt({ column: 15, row: 1 }, true);
    expect(listEnemyPositions(enemiesTurn(world))).toEqual([{ column: 14, row: 1 }]);
  });

  it("notice the hero straight away when already in sight at the start", () => {
    const world = createWorldWithEnemyAt({ column: 2, row: 1 }, false);
    expect(world.enemies[0]?.hasNoticedHero).toBe(true);
  });
});

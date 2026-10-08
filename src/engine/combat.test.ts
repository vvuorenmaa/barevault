import { describe, expect, it } from "vitest";
import {
  ENEMY_ATTACK_DAMAGE,
  ENEMY_STARTING_HIT_POINTS,
  HERO_ATTACK_DAMAGE,
  HERO_STARTING_HIT_POINTS,
} from "./combat";
import { enemiesTurn } from "./enemy";
import { createGridFromRows, type TilePosition } from "./grid";
import { createWorld, isHeroDead, playTurn, type World } from "./turn";

const CORRIDOR = ["#########", "#.......#", "#########"];
const HERO_POSITION: TilePosition = { column: 1, row: 1 };

function createCorridorWorld(enemyHitPoints: readonly number[], enemyColumns: readonly number[]): World {
  return createWorld(createGridFromRows(CORRIDOR), HERO_POSITION, {
    enemies: enemyColumns.map((column, index) => ({
      position: { column, row: 1 },
      hitPoints: enemyHitPoints[index] ?? ENEMY_STARTING_HIT_POINTS,
    })),
  });
}

const OPEN_ROOM = ["#####", "#...#", "#...#", "#...#", "#####"];

function createRoomWorld(heroPosition: TilePosition, enemyPositions: readonly TilePosition[]): World {
  return createWorld(createGridFromRows(OPEN_ROOM), heroPosition, {
    enemies: enemyPositions.map((position) => ({ position, hitPoints: ENEMY_STARTING_HIT_POINTS })),
  });
}

describe("enemies attacking", () => {
  it("hurts the hero from an adjacent tile instead of moving", () => {
    const world = createRoomWorld({ column: 2, row: 2 }, [{ column: 3, row: 2 }]);
    const after = enemiesTurn(world);
    expect(after.heroHitPoints).toBe(HERO_STARTING_HIT_POINTS - ENEMY_ATTACK_DAMAGE);
    expect(after.enemies.map((enemy) => enemy.position)).toEqual([{ column: 3, row: 2 }]);
  });

  it("walks up to the hero first when not adjacent, without hurting them", () => {
    const world = createRoomWorld({ column: 1, row: 1 }, [{ column: 3, row: 1 }]);
    const after = enemiesTurn(world);
    expect(after.heroHitPoints).toBe(HERO_STARTING_HIT_POINTS);
    expect(after.enemies.map((enemy) => enemy.position)).toEqual([{ column: 2, row: 1 }]);
  });

  it("does not attack diagonally", () => {
    const world = createRoomWorld({ column: 1, row: 1 }, [{ column: 2, row: 2 }]);
    expect(enemiesTurn(world).heroHitPoints).toBe(HERO_STARTING_HIT_POINTS);
  });

  it("lets every adjacent enemy attack", () => {
    const world = createRoomWorld({ column: 2, row: 2 }, [
      { column: 1, row: 2 },
      { column: 3, row: 2 },
    ]);
    expect(enemiesTurn(world).heroHitPoints).toBe(HERO_STARTING_HIT_POINTS - 2 * ENEMY_ATTACK_DAMAGE);
  });

  it("strikes back after surviving the hero's attack", () => {
    const world = createRoomWorld({ column: 2, row: 2 }, [{ column: 3, row: 2 }]);
    const result = playTurn(world, "right", [enemiesTurn]);
    expect(result.world.heroHitPoints).toBe(HERO_STARTING_HIT_POINTS - ENEMY_ATTACK_DAMAGE);
  });

  it("does not strike back when the hero's attack kills it", () => {
    const weakEnemyWorld = createWorld(createGridFromRows(OPEN_ROOM), { column: 2, row: 2 }, {
      enemies: [{ position: { column: 3, row: 2 }, hitPoints: HERO_ATTACK_DAMAGE }],
    });
    const result = playTurn(weakEnemyWorld, "right", [enemiesTurn]);
    expect(result.world.enemies).toEqual([]);
    expect(result.world.heroHitPoints).toBe(HERO_STARTING_HIT_POINTS);
  });
});

describe("a whole fight", () => {
  it("can be won by a bare-handed hero against one enemy, at a cost", () => {
    let world = createCorridorWorld([ENEMY_STARTING_HIT_POINTS], [6]);
    for (let turn = 0; turn < 50 && world.enemies.length > 0 && !isHeroDead(world); turn += 1) {
      world = playTurn(world, "right", [enemiesTurn]).world;
    }
    expect(world.enemies).toEqual([]);
    expect(isHeroDead(world)).toBe(false);
    expect(world.heroHitPoints).toBeLessThan(HERO_STARTING_HIT_POINTS);
  });

  it("is lost by a hero who never fights back", () => {
    let world = createCorridorWorld([ENEMY_STARTING_HIT_POINTS], [2]);
    for (let turn = 0; turn < 50 && !isHeroDead(world); turn += 1) {
      // Running only the enemy phase stands in for a hero who takes hits without answering
      world = enemiesTurn(world);
    }
    expect(isHeroDead(world)).toBe(true);
  });

  it("keeps the previous world untouched when the hero attacks", () => {
    const world = createCorridorWorld([ENEMY_STARTING_HIT_POINTS], [2]);
    playTurn(world, "right", [enemiesTurn]);
    expect(world.enemies).toEqual([{ position: { column: 2, row: 1 }, hitPoints: ENEMY_STARTING_HIT_POINTS }]);
    expect(world.heroHitPoints).toBe(HERO_STARTING_HIT_POINTS);
  });
});

describe("the hero dying", () => {
  function createWorldWithHeroHitPoints(heroHitPoints: number): World {
    return createWorld(createGridFromRows(OPEN_ROOM), { column: 2, row: 2 }, {
      heroHitPoints,
      enemies: [{ position: { column: 3, row: 2 }, hitPoints: ENEMY_STARTING_HIT_POINTS }],
    });
  }

  it("is alive with hit points left and dead at zero", () => {
    expect(isHeroDead(createWorldWithHeroHitPoints(1))).toBe(false);
    expect(isHeroDead(createWorldWithHeroHitPoints(0))).toBe(true);
  });

  it("dies from a blow that takes the last hit points, and hit points never go below zero", () => {
    const world = createWorldWithHeroHitPoints(1);
    const after = enemiesTurn(world);
    expect(after.heroHitPoints).toBe(0);
    expect(isHeroDead(after)).toBe(true);
  });

  it("never goes below zero hit points even when several enemies strike at once", () => {
    const world = createWorld(createGridFromRows(OPEN_ROOM), { column: 2, row: 2 }, {
      heroHitPoints: 1,
      enemies: [
        { position: { column: 1, row: 2 }, hitPoints: ENEMY_STARTING_HIT_POINTS },
        { position: { column: 3, row: 2 }, hitPoints: ENEMY_STARTING_HIT_POINTS },
      ],
    });
    expect(enemiesTurn(world).heroHitPoints).toBe(0);
  });

  it("ends the run: a dead hero cannot act and nobody else acts either", () => {
    const deadWorld = createWorldWithHeroHitPoints(0);
    const result = playTurn(deadWorld, "left", [enemiesTurn]);
    expect(result.turnTaken).toBe(false);
    expect(result.world).toBe(deadWorld);
  });

  it("still lets the hero act while alive after being hurt", () => {
    const hurtWorld = createWorldWithHeroHitPoints(HERO_STARTING_HIT_POINTS - ENEMY_ATTACK_DAMAGE);
    expect(playTurn(hurtWorld, "left", []).turnTaken).toBe(true);
  });
});

describe("the hero attacking", () => {
  it("hurts the enemy it moves into instead of moving, and uses the turn", () => {
    const world = createCorridorWorld([ENEMY_STARTING_HIT_POINTS], [2]);
    const result = playTurn(world, "right", []);
    expect(result.turnTaken).toBe(true);
    expect(result.world.hero).toEqual(HERO_POSITION);
    expect(result.world.enemies).toEqual([
      { position: { column: 2, row: 1 }, hitPoints: ENEMY_STARTING_HIT_POINTS - HERO_ATTACK_DAMAGE },
    ]);
  });

  it("removes an enemy whose hit points reach zero", () => {
    const world = createCorridorWorld([HERO_ATTACK_DAMAGE], [2]);
    expect(playTurn(world, "right", []).world.enemies).toEqual([]);
  });

  it("only hurts the enemy that was attacked", () => {
    const world = createCorridorWorld([ENEMY_STARTING_HIT_POINTS, ENEMY_STARTING_HIT_POINTS], [2, 5]);
    const hitPointsAfter = playTurn(world, "right", []).world.enemies.map((enemy) => enemy.hitPoints);
    expect(hitPointsAfter).toEqual([ENEMY_STARTING_HIT_POINTS - HERO_ATTACK_DAMAGE, ENEMY_STARTING_HIT_POINTS]);
  });

  it("starts the hero with full hit points", () => {
    expect(createCorridorWorld([], []).heroHitPoints).toBe(HERO_STARTING_HIT_POINTS);
  });
});

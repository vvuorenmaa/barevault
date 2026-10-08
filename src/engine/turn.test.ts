import { describe, expect, it } from "vitest";
import { createGridFromRows } from "./grid";
import {
  createWorld,
  isTileExplored,
  isTileVisible,
  playTurn,
  type ActorTurn,
  type World,
} from "./turn";

// Hero starts at column 1, row 1
function createCorridorWorld(): World {
  const grid = createGridFromRows(["####", "#..#", "####"]);
  return createWorld(grid, { column: 1, row: 1 });
}

describe("what the hero sees", () => {
  // A long corridor with the hero at its west end and a sight radius of 2
  function createLongCorridorWorld(): World {
    const grid = createGridFromRows(["#########", "#.......#", "#########"]);
    return createWorld(grid, { column: 1, row: 1 }, 2);
  }

  it("starts with only the surroundings of the hero seen", () => {
    const world = createLongCorridorWorld();
    expect(isTileVisible(world, 3, 1)).toBe(true);
    expect(isTileVisible(world, 4, 1)).toBe(false);
    expect(isTileExplored(world, 3, 1)).toBe(true);
    expect(isTileExplored(world, 4, 1)).toBe(false);
  });

  it("updates what is visible after the hero moves", () => {
    let world = createLongCorridorWorld();
    for (let step = 0; step < 3; step += 1) {
      world = playTurn(world, "right", []).world;
    }
    expect(isTileVisible(world, 6, 1)).toBe(true);
    expect(isTileVisible(world, 1, 1)).toBe(false);
  });

  it("remembers tiles that have gone out of sight", () => {
    let world = createLongCorridorWorld();
    for (let step = 0; step < 3; step += 1) {
      world = playTurn(world, "right", []).world;
    }
    expect(isTileVisible(world, 1, 1)).toBe(false);
    expect(isTileExplored(world, 1, 1)).toBe(true);
    expect(isTileExplored(world, 8, 1)).toBe(false);
  });

  it("keeps the previous world's memory untouched", () => {
    const world = createLongCorridorWorld();
    playTurn(world, "right", []);
    expect(isTileExplored(world, 4, 1)).toBe(false);
  });

  it("rejects reading outside the grid", () => {
    expect(() => isTileVisible(createLongCorridorWorld(), 99, 0)).toThrow(RangeError);
    expect(() => isTileExplored(createLongCorridorWorld(), 0, 99)).toThrow(RangeError);
  });
});

describe("playTurn other actors", () => {
  function createRecordingActor(name: string, log: string[]): ActorTurn {
    return (world) => {
      log.push(`${name} saw hero at ${world.hero.column},${world.hero.row}`);
      return world;
    };
  }

  it("lets every other actor act once, in order, after the hero has moved", () => {
    const log: string[] = [];
    playTurn(createCorridorWorld(), "right", [
      createRecordingActor("first", log),
      createRecordingActor("second", log),
    ]);
    expect(log).toEqual(["first saw hero at 2,1", "second saw hero at 2,1"]);
  });

  it("passes each actor the world left by the previous one", () => {
    const pushHeroBack: ActorTurn = (world) => ({ ...world, hero: { column: 1, row: 1 } });
    const observedHeroPositions: unknown[] = [];
    const observer: ActorTurn = (world) => {
      observedHeroPositions.push(world.hero);
      return world;
    };
    const result = playTurn(createCorridorWorld(), "right", [pushHeroBack, observer]);
    expect(observedHeroPositions).toEqual([{ column: 1, row: 1 }]);
    expect(result.world.hero).toEqual({ column: 1, row: 1 });
  });

  it("gives other actors no turn when the hero bumps into a wall", () => {
    const log: string[] = [];
    const result = playTurn(createCorridorWorld(), "up", [createRecordingActor("idle", log)]);
    expect(result.turnTaken).toBe(false);
    expect(log).toEqual([]);
  });
});

describe("playTurn hero movement", () => {
  it("moves the hero one tile onto floor and takes the turn", () => {
    const result = playTurn(createCorridorWorld(), "right", []);
    expect(result.turnTaken).toBe(true);
    expect(result.world.hero).toEqual({ column: 2, row: 1 });
  });

  it.each(["up", "down", "left"] as const)("does not walk into a wall (%s)", (direction) => {
    const world = createCorridorWorld();
    const result = playTurn(world, direction, []);
    expect(result.turnTaken).toBe(false);
    expect(result.world.hero).toEqual({ column: 1, row: 1 });
  });

  it("treats the edge of the grid as blocked", () => {
    const grid = createGridFromRows(["..", ".."]);
    const world = createWorld(grid, { column: 0, row: 0 });
    expect(playTurn(world, "left", []).turnTaken).toBe(false);
    expect(playTurn(world, "up", []).turnTaken).toBe(false);
  });

  it("leaves the previous world untouched", () => {
    const world = createCorridorWorld();
    playTurn(world, "right", []);
    expect(world.hero).toEqual({ column: 1, row: 1 });
  });
});

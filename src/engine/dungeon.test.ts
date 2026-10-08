import { describe, expect, it } from "vitest";
import { generateDungeon, type Room } from "./dungeon";
import { getTile } from "./grid";

const COLUMN_COUNT = 40;
const ROW_COUNT = 25;

function generate(seed: string) {
  return generateDungeon({ seed, columnCount: COLUMN_COUNT, rowCount: ROW_COUNT });
}

const SEEDS_TO_CHECK = Array.from({ length: 50 }, (_, index) => `seed-${index}`);

// Rooms must keep at least one wall tile between each other
function roomsTouchOrOverlap(first: Room, second: Room): boolean {
  return (
    first.column - 1 < second.column + second.width &&
    second.column - 1 < first.column + first.width &&
    first.row - 1 < second.row + second.height &&
    second.row - 1 < first.row + first.height
  );
}

describe("generateDungeon rooms", () => {
  it("places several rooms for every seed", () => {
    for (const seed of SEEDS_TO_CHECK) {
      expect(generate(seed).rooms.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("keeps every room inside the grid, leaving the outer edge as wall", () => {
    for (const seed of SEEDS_TO_CHECK) {
      for (const room of generate(seed).rooms) {
        expect(room.column).toBeGreaterThanOrEqual(1);
        expect(room.row).toBeGreaterThanOrEqual(1);
        expect(room.column + room.width).toBeLessThanOrEqual(COLUMN_COUNT - 1);
        expect(room.row + room.height).toBeLessThanOrEqual(ROW_COUNT - 1);
      }
    }
  });

  it("never lets two rooms overlap or touch", () => {
    for (const seed of SEEDS_TO_CHECK) {
      const { rooms } = generate(seed);
      for (let first = 0; first < rooms.length; first += 1) {
        for (let second = first + 1; second < rooms.length; second += 1) {
          expect(roomsTouchOrOverlap(rooms[first] as Room, rooms[second] as Room)).toBe(false);
        }
      }
    }
  });

  it("makes exactly the room tiles floor and everything else wall", () => {
    for (const seed of SEEDS_TO_CHECK) {
      const { grid, rooms } = generate(seed);
      expect(grid.columnCount).toBe(COLUMN_COUNT);
      expect(grid.rowCount).toBe(ROW_COUNT);
      for (let row = 0; row < ROW_COUNT; row += 1) {
        for (let column = 0; column < COLUMN_COUNT; column += 1) {
          const insideRoom = rooms.some(
            (room) =>
              column >= room.column &&
              column < room.column + room.width &&
              row >= room.row &&
              row < room.row + room.height,
          );
          expect(getTile(grid, column, row)).toBe(insideRoom ? "floor" : "wall");
        }
      }
    }
  });
});

describe("generateDungeon on a grid too small for a room", () => {
  it("returns an all-wall grid without rooms", () => {
    const { grid, rooms } = generateDungeon({ seed: "tiny", columnCount: 5, rowCount: 5 });
    expect(rooms).toEqual([]);
    expect(grid.tiles.every((tile) => tile === "wall")).toBe(true);
  });

  it("rejects invalid grid dimensions", () => {
    expect(() => generateDungeon({ seed: "bad", columnCount: 0, rowCount: 5 })).toThrow(RangeError);
  });
});

describe("generateDungeon", () => {
  it("produces an identical dungeon for the same seed", () => {
    expect(generate("bare-vault")).toEqual(generate("bare-vault"));
  });

  it("produces different dungeons for different seeds", () => {
    const seeds = ["a", "b", "c", "d", "e"];
    const distinctDungeons = new Set(seeds.map((seed) => JSON.stringify(generate(seed))));
    expect(distinctDungeons.size).toBe(seeds.length);
  });
});

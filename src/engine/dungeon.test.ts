import { describe, expect, it } from "vitest";
import { generateDungeon, type Room } from "./dungeon";
import { getTile, isInsideGrid, type Grid } from "./grid";

const COLUMN_COUNT = 40;
const ROW_COUNT = 25;
const SEEDS_TO_CHECK = Array.from({ length: 50 }, (_, index) => `seed-${index}`);
// A 40x25 grid fits many rooms; a lower count would mean the placement loop is effectively broken
const MIN_EXPECTED_ROOM_COUNT = 4;

function generateDungeonForSeed(seed: string) {
  return generateDungeon({ seed, columnCount: COLUMN_COUNT, rowCount: ROW_COUNT });
}

function isInsideRoom(room: Room, column: number, row: number): boolean {
  return (
    column >= room.column &&
    column < room.column + room.width &&
    row >= room.row &&
    row < room.row + room.height
  );
}

function findRoomIndexAt(rooms: readonly Room[], column: number, row: number): number {
  return rooms.findIndex((room) => isInsideRoom(room, column, row));
}

// Judged tile by tile, independently of the generator's own overlap rule: two different rooms
// touching or overlapping shows up as a floor tile next to a floor tile of another room.
function findTouchingRoomTiles(grid: Grid, rooms: readonly Room[]): string[] {
  const offendingTiles: string[] = [];
  for (let row = 0; row < grid.rowCount; row += 1) {
    for (let column = 0; column < grid.columnCount; column += 1) {
      const roomIndex = findRoomIndexAt(rooms, column, row);
      if (roomIndex === -1) {
        continue;
      }
      for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
        for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
          const neighborColumn = column + columnOffset;
          const neighborRow = row + rowOffset;
          if (!isInsideGrid(grid, neighborColumn, neighborRow)) {
            continue;
          }
          const neighborRoomIndex = findRoomIndexAt(rooms, neighborColumn, neighborRow);
          if (neighborRoomIndex !== -1 && neighborRoomIndex !== roomIndex) {
            offendingTiles.push(`(${column}, ${row}) next to (${neighborColumn}, ${neighborRow})`);
          }
        }
      }
    }
  }
  return offendingTiles;
}

describe("generateDungeon rooms", () => {
  it("places several rooms for every seed", () => {
    for (const seed of SEEDS_TO_CHECK) {
      expect(generateDungeonForSeed(seed).rooms.length).toBeGreaterThanOrEqual(MIN_EXPECTED_ROOM_COUNT);
    }
  });

  it("keeps every room inside the grid, leaving the outer edge as wall", () => {
    for (const seed of SEEDS_TO_CHECK) {
      for (const room of generateDungeonForSeed(seed).rooms) {
        expect(room.column).toBeGreaterThanOrEqual(1);
        expect(room.row).toBeGreaterThanOrEqual(1);
        expect(room.column + room.width).toBeLessThanOrEqual(COLUMN_COUNT - 1);
        expect(room.row + room.height).toBeLessThanOrEqual(ROW_COUNT - 1);
      }
    }
  });

  it("never lets two rooms overlap or touch, even diagonally", () => {
    for (const seed of SEEDS_TO_CHECK) {
      const { grid, rooms } = generateDungeonForSeed(seed);
      expect(findTouchingRoomTiles(grid, rooms)).toEqual([]);
    }
  });

  it("makes exactly the room tiles floor and everything else wall", () => {
    for (const seed of SEEDS_TO_CHECK) {
      const { grid, rooms } = generateDungeonForSeed(seed);
      expect(grid.columnCount).toBe(COLUMN_COUNT);
      expect(grid.rowCount).toBe(ROW_COUNT);
      for (let row = 0; row < ROW_COUNT; row += 1) {
        for (let column = 0; column < COLUMN_COUNT; column += 1) {
          const expectedTile = findRoomIndexAt(rooms, column, row) === -1 ? "wall" : "floor";
          expect(getTile(grid, column, row)).toBe(expectedTile);
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
    expect(generateDungeonForSeed("bare-vault")).toEqual(generateDungeonForSeed("bare-vault"));
  });

  it("produces different dungeons for different seeds", () => {
    const seeds = ["a", "b", "c", "d", "e"];
    const distinctDungeons = new Set(seeds.map((seed) => JSON.stringify(generateDungeonForSeed(seed))));
    expect(distinctDungeons.size).toBe(seeds.length);
  });
});

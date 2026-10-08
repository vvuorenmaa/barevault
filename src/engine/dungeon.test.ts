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

  it("makes every room tile floor and adds corridor floor outside the rooms", () => {
    for (const seed of SEEDS_TO_CHECK) {
      const { grid, rooms } = generateDungeonForSeed(seed);
      expect(grid.columnCount).toBe(COLUMN_COUNT);
      expect(grid.rowCount).toBe(ROW_COUNT);
      let corridorTileCount = 0;
      for (let row = 0; row < ROW_COUNT; row += 1) {
        for (let column = 0; column < COLUMN_COUNT; column += 1) {
          const isRoomTile = findRoomIndexAt(rooms, column, row) !== -1;
          const isFloor = getTile(grid, column, row) === "floor";
          if (isRoomTile) {
            expect(isFloor).toBe(true);
          } else if (isFloor) {
            corridorTileCount += 1;
          }
        }
      }
      expect(corridorTileCount).toBeGreaterThan(0);
    }
  });
});

function countReachableFloorTiles(grid: Grid, startColumn: number, startRow: number): number {
  const visitedTileKeys = new Set<string>([`${startColumn},${startRow}`]);
  const pendingTiles: Array<[number, number]> = [[startColumn, startRow]];
  const orthogonalOffsets: Array<[number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  for (let pendingIndex = 0; pendingIndex < pendingTiles.length; pendingIndex += 1) {
    const [column, row] = pendingTiles[pendingIndex] ?? [startColumn, startRow];
    for (const [columnOffset, rowOffset] of orthogonalOffsets) {
      const neighborColumn = column + columnOffset;
      const neighborRow = row + rowOffset;
      const neighborKey = `${neighborColumn},${neighborRow}`;
      if (
        !isInsideGrid(grid, neighborColumn, neighborRow) ||
        visitedTileKeys.has(neighborKey) ||
        getTile(grid, neighborColumn, neighborRow) !== "floor"
      ) {
        continue;
      }
      visitedTileKeys.add(neighborKey);
      pendingTiles.push([neighborColumn, neighborRow]);
    }
  }
  return visitedTileKeys.size;
}

describe("generateDungeon connectivity", () => {
  it("lets the hero walk from any floor tile to any other", () => {
    for (const seed of SEEDS_TO_CHECK) {
      const { grid, rooms } = generateDungeonForSeed(seed);
      expect(rooms.length).toBeGreaterThanOrEqual(2);
      const firstRoom = rooms[0];
      expect(firstRoom).toBeDefined();
      if (firstRoom === undefined) {
        continue;
      }
      const totalFloorTiles = grid.tiles.filter((tile) => tile === "floor").length;
      expect(countReachableFloorTiles(grid, firstRoom.column, firstRoom.row)).toBe(totalFloorTiles);
    }
  });

  it("keeps the outer edge of the grid as wall", () => {
    for (const seed of SEEDS_TO_CHECK) {
      const { grid } = generateDungeonForSeed(seed);
      for (let column = 0; column < COLUMN_COUNT; column += 1) {
        expect(getTile(grid, column, 0)).toBe("wall");
        expect(getTile(grid, column, ROW_COUNT - 1)).toBe("wall");
      }
      for (let row = 0; row < ROW_COUNT; row += 1) {
        expect(getTile(grid, 0, row)).toBe("wall");
        expect(getTile(grid, COLUMN_COUNT - 1, row)).toBe("wall");
      }
    }
  });
});

describe("generateDungeon on a grid that fits exactly one room", () => {
  it("carves only that room and no corridor", () => {
    const { grid, rooms } = generateDungeon({ seed: "single", columnCount: 6, rowCount: 6 });
    expect(rooms).toEqual([{ column: 1, row: 1, width: 4, height: 4 }]);
    expect(grid.tiles.filter((tile) => tile === "floor")).toHaveLength(16);
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

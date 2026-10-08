import { createGrid, setTile, type Grid, type TilePosition } from "./grid";
import { createRandomGenerator, type RandomGenerator } from "./randomGenerator";

export interface Room {
  readonly column: number;
  readonly row: number;
  readonly width: number;
  readonly height: number;
}

export interface Dungeon {
  readonly grid: Grid;
  readonly rooms: Room[];
}

export interface DungeonOptions {
  readonly seed: string | number;
  readonly columnCount: number;
  readonly rowCount: number;
}

const MIN_ROOM_SIZE = 4;
const MAX_ROOM_SIZE = 10;
const ROOM_PLACEMENT_ATTEMPTS = 80;
const HORIZONTAL_FIRST_PROBABILITY = 0.5;

// Rooms keep at least one wall tile between each other, so corridors can later run between them
function roomsTouchOrOverlap(first: Room, second: Room): boolean {
  return (
    first.column - 1 < second.column + second.width &&
    second.column - 1 < first.column + first.width &&
    first.row - 1 < second.row + second.height &&
    second.row - 1 < first.row + first.height
  );
}

function proposeRoom(randomGenerator: RandomGenerator, columnCount: number, rowCount: number): Room | null {
  // The outer tile ring stays wall, so a room needs at least its size plus two border tiles
  const maxWidth = Math.min(MAX_ROOM_SIZE, columnCount - 2);
  const maxHeight = Math.min(MAX_ROOM_SIZE, rowCount - 2);
  if (maxWidth < MIN_ROOM_SIZE || maxHeight < MIN_ROOM_SIZE) {
    return null;
  }

  const width = randomGenerator.nextIntegerInRange(MIN_ROOM_SIZE, maxWidth);
  const height = randomGenerator.nextIntegerInRange(MIN_ROOM_SIZE, maxHeight);
  return {
    column: randomGenerator.nextIntegerInRange(1, columnCount - width - 1),
    row: randomGenerator.nextIntegerInRange(1, rowCount - height - 1),
    width,
    height,
  };
}

function carveRoom(grid: Grid, room: Room): void {
  for (let row = room.row; row < room.row + room.height; row += 1) {
    for (let column = room.column; column < room.column + room.width; column += 1) {
      setTile(grid, column, row, "floor");
    }
  }
}

export function findRoomCenter(room: Room): TilePosition {
  return {
    column: room.column + Math.floor(room.width / 2),
    row: room.row + Math.floor(room.height / 2),
  };
}

function measureManhattanDistance(from: TilePosition, to: TilePosition): number {
  return Math.abs(from.column - to.column) + Math.abs(from.row - to.row);
}

function carveHorizontalCorridor(grid: Grid, row: number, fromColumn: number, toColumn: number): void {
  for (let column = Math.min(fromColumn, toColumn); column <= Math.max(fromColumn, toColumn); column += 1) {
    setTile(grid, column, row, "floor");
  }
}

function carveVerticalCorridor(grid: Grid, column: number, fromRow: number, toRow: number): void {
  for (let row = Math.min(fromRow, toRow); row <= Math.max(fromRow, toRow); row += 1) {
    setTile(grid, column, row, "floor");
  }
}

// An L-shaped path between two room centers stays inside their bounding box, so it never
// reaches the outer tile ring, which belongs to the rooms' margin.
function carveCorridor(grid: Grid, from: TilePosition, to: TilePosition, horizontalFirst: boolean): void {
  if (horizontalFirst) {
    carveHorizontalCorridor(grid, from.row, from.column, to.column);
    carveVerticalCorridor(grid, to.column, from.row, to.row);
    return;
  }
  carveVerticalCorridor(grid, from.column, from.row, to.row);
  carveHorizontalCorridor(grid, to.row, from.column, to.column);
}

// On equal distances the earliest candidate wins, which keeps generation deterministic
function findNearestCenter(target: TilePosition, candidates: readonly TilePosition[]): TilePosition | undefined {
  let nearestCenter: TilePosition | undefined;
  for (const candidate of candidates) {
    if (
      nearestCenter === undefined ||
      measureManhattanDistance(target, candidate) < measureManhattanDistance(target, nearestCenter)
    ) {
      nearestCenter = candidate;
    }
  }
  return nearestCenter;
}

// Joining each room to the nearest earlier room links all rooms into one connected tree
function connectRooms(grid: Grid, rooms: readonly Room[], randomGenerator: RandomGenerator): void {
  const roomCenters = rooms.map(findRoomCenter);
  roomCenters.forEach((roomCenter, roomIndex) => {
    const nearestEarlierCenter = findNearestCenter(roomCenter, roomCenters.slice(0, roomIndex));
    if (nearestEarlierCenter === undefined) {
      return;
    }
    const isHorizontalFirst = randomGenerator.nextFloat() < HORIZONTAL_FIRST_PROBABILITY;
    carveCorridor(grid, roomCenter, nearestEarlierCenter, isHorizontalFirst);
  });
}

export function generateDungeon(options: DungeonOptions): Dungeon {
  const { seed, columnCount, rowCount } = options;
  const randomGenerator = createRandomGenerator(seed);
  const grid = createGrid(columnCount, rowCount, "wall");
  const rooms: Room[] = [];

  for (let attempt = 0; attempt < ROOM_PLACEMENT_ATTEMPTS; attempt += 1) {
    const candidate = proposeRoom(randomGenerator, columnCount, rowCount);
    if (candidate === null) {
      break;
    }
    if (rooms.some((placedRoom) => roomsTouchOrOverlap(placedRoom, candidate))) {
      continue;
    }
    rooms.push(candidate);
    carveRoom(grid, candidate);
  }

  connectRooms(grid, rooms, randomGenerator);

  return { grid, rooms };
}

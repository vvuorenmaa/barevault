import { createGrid, setTile, type Grid } from "./grid";
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

  return { grid, rooms };
}

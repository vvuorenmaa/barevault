import { computeFieldOfView } from "./fieldOfView";
import { getTile, isInsideGrid, type Grid, type TilePosition } from "./grid";

export type Direction = "up" | "down" | "left" | "right";

export interface World {
  readonly grid: Grid;
  readonly hero: TilePosition;
  readonly sightRadius: number;
  // One flag per grid tile, in the same order as the grid's tiles
  readonly visibleTiles: readonly boolean[];
  readonly exploredTiles: readonly boolean[];
}

const DEFAULT_SIGHT_RADIUS = 8;

export interface TurnResult {
  readonly world: World;
  readonly turnTaken: boolean;
}

const OFFSET_BY_DIRECTION: Readonly<Record<Direction, TilePosition>> = {
  up: { column: 0, row: -1 },
  down: { column: 0, row: 1 },
  left: { column: -1, row: 0 },
  right: { column: 1, row: 0 },
};

function updateVision(world: World): World {
  const visibleTiles = world.grid.tiles.map(() => false);
  const exploredTiles = [...world.exploredTiles];
  for (const { column, row } of computeFieldOfView(world.grid, world.hero, world.sightRadius)) {
    const tileIndex = row * world.grid.columnCount + column;
    visibleTiles[tileIndex] = true;
    exploredTiles[tileIndex] = true;
  }
  return { ...world, visibleTiles, exploredTiles };
}

export function createWorld(
  grid: Grid,
  hero: TilePosition,
  sightRadius: number = DEFAULT_SIGHT_RADIUS,
): World {
  const unseenTiles = grid.tiles.map(() => false);
  return updateVision({
    grid,
    hero,
    sightRadius,
    visibleTiles: unseenTiles,
    exploredTiles: unseenTiles,
  });
}

function readTileFlag(world: World, flags: readonly boolean[], column: number, row: number): boolean {
  if (!isInsideGrid(world.grid, column, row)) {
    throw new RangeError(`Tile (${column}, ${row}) is outside the grid`);
  }
  return flags[row * world.grid.columnCount + column] === true;
}

export function isTileVisible(world: World, column: number, row: number): boolean {
  return readTileFlag(world, world.visibleTiles, column, row);
}

export function isTileExplored(world: World, column: number, row: number): boolean {
  return readTileFlag(world, world.exploredTiles, column, row);
}

function isWalkable(grid: Grid, position: TilePosition): boolean {
  return isInsideGrid(grid, position.column, position.row) && getTile(grid, position.column, position.row) === "floor";
}

// Behaviour is passed in rather than stored in the world, which keeps the world plain data (ADR-0002)
export type ActorTurn = (world: World) => World;

// A turn is only spent when the hero actually moves; bumping into a wall costs nothing
export function playTurn(
  world: World,
  direction: Direction,
  otherActors: readonly ActorTurn[],
): TurnResult {
  const offset = OFFSET_BY_DIRECTION[direction];
  const destination: TilePosition = {
    column: world.hero.column + offset.column,
    row: world.hero.row + offset.row,
  };
  if (!isWalkable(world.grid, destination)) {
    return { world, turnTaken: false };
  }

  const worldAfterHeroMoved = updateVision({ ...world, hero: destination });
  const worldAfterAllActors = otherActors.reduce(
    (currentWorld, takeActorTurn) => takeActorTurn(currentWorld),
    worldAfterHeroMoved,
  );
  return { world: worldAfterAllActors, turnTaken: true };
}

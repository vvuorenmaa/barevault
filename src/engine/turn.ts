import { getTile, isInsideGrid, type Grid, type TilePosition } from "./grid";

export type Direction = "up" | "down" | "left" | "right";

export interface World {
  readonly grid: Grid;
  readonly hero: TilePosition;
}

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

export function createWorld(grid: Grid, hero: TilePosition): World {
  return { grid, hero };
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

  const worldAfterHeroMoved: World = { ...world, hero: destination };
  const worldAfterAllActors = otherActors.reduce(
    (currentWorld, takeActorTurn) => takeActorTurn(currentWorld),
    worldAfterHeroMoved,
  );
  return { world: worldAfterAllActors, turnTaken: true };
}

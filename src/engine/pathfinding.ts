import { getTile, isInsideGrid, type Grid, type TilePosition } from "./grid";

// A fixed neighbour order keeps the choice between equally short routes deterministic
const ORTHOGONAL_OFFSETS: readonly TilePosition[] = [
  { column: 0, row: -1 },
  { column: 0, row: 1 },
  { column: -1, row: 0 },
  { column: 1, row: 0 },
];

function toPositionKey(position: TilePosition): string {
  return `${position.column},${position.row}`;
}

function isSamePosition(first: TilePosition, second: TilePosition): boolean {
  return first.column === second.column && first.row === second.row;
}

// Walks the breadth-first search tree back from the target and returns the tile right after `from`
function findFirstStepOfRoute(
  previousPositionByKey: ReadonlyMap<string, TilePosition>,
  from: TilePosition,
  target: TilePosition,
): TilePosition | undefined {
  let firstStep: TilePosition | undefined;
  let position: TilePosition | undefined = target;
  while (position !== undefined && !isSamePosition(position, from)) {
    firstStep = position;
    position = previousPositionByKey.get(toPositionKey(position));
  }
  return firstStep;
}

// Returns the first tile of a shortest route from `from` to `target`, or undefined when there is
// nothing to do: already at the target or next to it (it never steps onto the target), or no route.
export function findNextStepToward(
  grid: Grid,
  from: TilePosition,
  target: TilePosition,
  occupiedPositions: readonly TilePosition[],
): TilePosition | undefined {
  const occupiedKeys = new Set(occupiedPositions.map(toPositionKey));
  const previousPositionByKey = new Map<string, TilePosition>();
  const visitedKeys = new Set<string>([toPositionKey(from)]);
  const pendingPositions: TilePosition[] = [from];

  // The array doubles as the search queue: positions appended inside the loop are visited later
  for (const current of pendingPositions) {
    if (isSamePosition(current, target)) {
      const firstStep = findFirstStepOfRoute(previousPositionByKey, from, target);
      return firstStep !== undefined && !isSamePosition(firstStep, target) ? firstStep : undefined;
    }
    for (const offset of ORTHOGONAL_OFFSETS) {
      const neighbor: TilePosition = {
        column: current.column + offset.column,
        row: current.row + offset.row,
      };
      const neighborKey = toPositionKey(neighbor);
      const isBlockedByOthers = occupiedKeys.has(neighborKey) && !isSamePosition(neighbor, target);
      if (
        visitedKeys.has(neighborKey) ||
        !isInsideGrid(grid, neighbor.column, neighbor.row) ||
        getTile(grid, neighbor.column, neighbor.row) !== "floor" ||
        isBlockedByOthers
      ) {
        continue;
      }
      visitedKeys.add(neighborKey);
      previousPositionByKey.set(neighborKey, current);
      pendingPositions.push(neighbor);
    }
  }
  return undefined;
}

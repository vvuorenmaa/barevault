import { getTile, isInsideGrid, type Grid, type TilePosition } from "./grid";

// Walks Bresenham's line between two tiles; only the tiles strictly between them can block sight,
// so a wall is visible itself but hides everything behind it.
function hasLineOfSight(grid: Grid, from: TilePosition, to: TilePosition): boolean {
  const columnStep = Math.sign(to.column - from.column);
  const rowStep = Math.sign(to.row - from.row);
  const columnDistance = Math.abs(to.column - from.column);
  const rowDistance = Math.abs(to.row - from.row);

  let column = from.column;
  let row = from.row;
  let error = columnDistance - rowDistance;

  while (column !== to.column || row !== to.row) {
    const doubledError = 2 * error;
    if (doubledError > -rowDistance) {
      error -= rowDistance;
      column += columnStep;
    }
    if (doubledError < columnDistance) {
      error += columnDistance;
      row += rowStep;
    }
    const reachedTarget = column === to.column && row === to.row;
    if (!reachedTarget && getTile(grid, column, row) === "wall") {
      return false;
    }
  }
  return true;
}

export function computeFieldOfView(grid: Grid, origin: TilePosition, radius: number): TilePosition[] {
  if (!isInsideGrid(grid, origin.column, origin.row)) {
    throw new RangeError("Field of view origin must be inside the grid");
  }
  if (!Number.isInteger(radius) || radius < 0) {
    throw new RangeError("Field of view radius must be a non-negative integer");
  }

  const visibleTiles: TilePosition[] = [];
  for (let row = origin.row - radius; row <= origin.row + radius; row += 1) {
    for (let column = origin.column - radius; column <= origin.column + radius; column += 1) {
      if (!isInsideGrid(grid, column, row)) {
        continue;
      }
      const squaredDistance = (column - origin.column) ** 2 + (row - origin.row) ** 2;
      if (squaredDistance > radius ** 2) {
        continue;
      }
      if (hasLineOfSight(grid, origin, { column, row })) {
        visibleTiles.push({ column, row });
      }
    }
  }
  return visibleTiles;
}

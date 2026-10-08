export type TileKind = "wall" | "floor";

export interface TilePosition {
  readonly column: number;
  readonly row: number;
}

// Plain data so a grid can be serialized as-is (ADR-0002)
export interface Grid {
  readonly columnCount: number;
  readonly rowCount: number;
  readonly tiles: TileKind[];
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

export function createGrid(columnCount: number, rowCount: number, fillTile: TileKind): Grid {
  if (!isPositiveInteger(columnCount) || !isPositiveInteger(rowCount)) {
    throw new RangeError("Grid dimensions must be positive integers");
  }
  return {
    columnCount,
    rowCount,
    tiles: Array.from({ length: columnCount * rowCount }, () => fillTile),
  };
}

export function isInsideGrid(grid: Grid, column: number, row: number): boolean {
  return (
    Number.isInteger(column) &&
    Number.isInteger(row) &&
    column >= 0 &&
    column < grid.columnCount &&
    row >= 0 &&
    row < grid.rowCount
  );
}

export function toTileIndex(grid: Grid, column: number, row: number): number {
  if (!isInsideGrid(grid, column, row)) {
    throw new RangeError(`Tile (${column}, ${row}) is outside the ${grid.columnCount}x${grid.rowCount} grid`);
  }
  return row * grid.columnCount + column;
}

export function getTile(grid: Grid, column: number, row: number): TileKind {
  // The index is validated by toTileIndex, so the lookup cannot be undefined
  return grid.tiles[toTileIndex(grid, column, row)] as TileKind;
}

export function setTile(grid: Grid, column: number, row: number, tile: TileKind): void {
  grid.tiles[toTileIndex(grid, column, row)] = tile;
}

const TILE_KIND_BY_CHARACTER: Readonly<Record<string, TileKind>> = {
  "#": "wall",
  ".": "floor",
};

export function createGridFromRows(rows: readonly string[]): Grid {
  const characterRows = rows.map((row) => [...row]);
  const [firstRow] = characterRows;
  if (firstRow === undefined) {
    throw new RangeError("A grid needs at least one row");
  }
  if (characterRows.some((row) => row.length !== firstRow.length)) {
    throw new RangeError("All grid rows must have the same length");
  }

  const grid = createGrid(firstRow.length, characterRows.length, "wall");
  characterRows.forEach((row, rowIndex) => {
    row.forEach((character, columnIndex) => {
      const tile = TILE_KIND_BY_CHARACTER[character];
      if (tile === undefined) {
        throw new RangeError(`Unknown tile character "${character}"`);
      }
      setTile(grid, columnIndex, rowIndex, tile);
    });
  });
  return grid;
}

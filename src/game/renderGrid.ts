import { getTile, type Grid, type TileKind } from "../engine/grid";

// Placeholder colours until pixel art sprites replace them
const PLACEHOLDER_COLOR_BY_TILE: Readonly<Record<TileKind, string>> = {
  wall: "#3d3d56",
  floor: "#8c7f66",
};

export function renderGrid(
  drawingContext: CanvasRenderingContext2D,
  grid: Grid,
  tileSizeInPixels: number,
): void {
  for (let row = 0; row < grid.rowCount; row += 1) {
    for (let column = 0; column < grid.columnCount; column += 1) {
      drawingContext.fillStyle = PLACEHOLDER_COLOR_BY_TILE[getTile(grid, column, row)];
      drawingContext.fillRect(
        column * tileSizeInPixels,
        row * tileSizeInPixels,
        tileSizeInPixels,
        tileSizeInPixels,
      );
    }
  }
}

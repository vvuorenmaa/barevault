import { getTile, type TileKind } from "../engine/grid";
import { isTileExplored, isTileVisible, type World } from "../engine/turn";

// Placeholder colours until pixel art sprites replace them
const VISIBLE_COLOR_BY_TILE: Readonly<Record<TileKind, string>> = {
  wall: "#3d3d56",
  floor: "#8c7f66",
};

const REMEMBERED_COLOR_BY_TILE: Readonly<Record<TileKind, string>> = {
  wall: "#1d1d2a",
  floor: "#3a362d",
};

const UNSEEN_COLOR = "#000";

export function renderGrid(
  drawingContext: CanvasRenderingContext2D,
  world: World,
  tileSizeInPixels: number,
): void {
  const { grid } = world;
  for (let row = 0; row < grid.rowCount; row += 1) {
    for (let column = 0; column < grid.columnCount; column += 1) {
      drawingContext.fillStyle = chooseTileColor(world, column, row);
      drawingContext.fillRect(
        column * tileSizeInPixels,
        row * tileSizeInPixels,
        tileSizeInPixels,
        tileSizeInPixels,
      );
    }
  }
}

function chooseTileColor(world: World, column: number, row: number): string {
  const tile = getTile(world.grid, column, row);
  if (isTileVisible(world, column, row)) {
    return VISIBLE_COLOR_BY_TILE[tile];
  }
  if (isTileExplored(world, column, row)) {
    return REMEMBERED_COLOR_BY_TILE[tile];
  }
  return UNSEEN_COLOR;
}

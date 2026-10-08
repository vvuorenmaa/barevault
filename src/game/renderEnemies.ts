import { isTileVisible, type World } from "../engine/turn";

// Placeholder colour until the enemy sprite replaces it
const ENEMY_PLACEHOLDER_COLOR = "#c0392b";

// Enemies out of the hero's sight stay hidden, as the dungeon around them is
export function renderEnemies(
  drawingContext: CanvasRenderingContext2D,
  world: World,
  tileSizeInPixels: number,
): void {
  drawingContext.fillStyle = ENEMY_PLACEHOLDER_COLOR;
  for (const { position } of world.enemies) {
    if (!isTileVisible(world, position.column, position.row)) {
      continue;
    }
    drawingContext.fillRect(
      position.column * tileSizeInPixels,
      position.row * tileSizeInPixels,
      tileSizeInPixels,
      tileSizeInPixels,
    );
  }
}

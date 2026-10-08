import type { TilePosition } from "../engine/grid";

// Placeholder colour until the hero sprite replaces it
const HERO_PLACEHOLDER_COLOR = "#e8c547";

export function renderHero(
  drawingContext: CanvasRenderingContext2D,
  hero: TilePosition,
  tileSizeInPixels: number,
): void {
  drawingContext.fillStyle = HERO_PLACEHOLDER_COLOR;
  drawingContext.fillRect(
    hero.column * tileSizeInPixels,
    hero.row * tileSizeInPixels,
    tileSizeInPixels,
    tileSizeInPixels,
  );
}

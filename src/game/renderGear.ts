import { isTileVisible, type GearKind, type World } from "../engine/turn";

// Placeholder colours until the gear sprites replace them
const GEAR_PLACEHOLDER_COLORS: Readonly<Record<GearKind, string>> = {
  weapon: "#f1c40f",
  armor: "#3498db",
};

// Gear out of the hero's sight stays hidden, as the dungeon around it is
export function renderGear(
  drawingContext: CanvasRenderingContext2D,
  world: World,
  tileSizeInPixels: number,
): void {
  for (const { position, kind } of world.gearItems) {
    if (!isTileVisible(world, position.column, position.row)) {
      continue;
    }
    drawingContext.fillStyle = GEAR_PLACEHOLDER_COLORS[kind];
    drawingContext.fillRect(
      position.column * tileSizeInPixels,
      position.row * tileSizeInPixels,
      tileSizeInPixels,
      tileSizeInPixels,
    );
  }
}

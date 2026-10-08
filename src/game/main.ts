import { calculateCanvasPixelSize } from "../engine/canvasSize";
import { renderGrid } from "./renderGrid";
import { createSampleLevel } from "./sampleLevel";

const TILE_SIZE_IN_PIXELS = 16;
const CANVAS_SCALE = 3;

function mountSampleLevel(): void {
  const canvasElement = document.querySelector<HTMLCanvasElement>("#game-canvas");
  if (!canvasElement) {
    throw new Error("Canvas element #game-canvas not found");
  }
  const drawingContext = canvasElement.getContext("2d");
  if (!drawingContext) {
    throw new Error("2D canvas context is not available");
  }

  const level = createSampleLevel();
  const { width, height } = calculateCanvasPixelSize(
    level.columnCount,
    level.rowCount,
    TILE_SIZE_IN_PIXELS,
  );
  canvasElement.width = width;
  canvasElement.height = height;
  // Integer scaling keeps pixel art edges sharp
  canvasElement.style.width = `${width * CANVAS_SCALE}px`;
  canvasElement.style.height = `${height * CANVAS_SCALE}px`;

  renderGrid(drawingContext, level, TILE_SIZE_IN_PIXELS);
}

mountSampleLevel();

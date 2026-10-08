import { calculateCanvasPixelSize } from "../engine/canvasSize";

const GRID_COLUMN_COUNT = 40;
const GRID_ROW_COUNT = 25;
const TILE_SIZE_IN_PIXELS = 16;
const CANVAS_SCALE = 2;

function mountEmptyCanvas(): void {
  const canvasElement = document.querySelector<HTMLCanvasElement>("#game-canvas");
  if (!canvasElement) {
    throw new Error("Canvas element #game-canvas not found");
  }
  const drawingContext = canvasElement.getContext("2d");
  if (!drawingContext) {
    throw new Error("2D canvas context is not available");
  }

  const { width, height } = calculateCanvasPixelSize(
    GRID_COLUMN_COUNT,
    GRID_ROW_COUNT,
    TILE_SIZE_IN_PIXELS,
  );
  canvasElement.width = width;
  canvasElement.height = height;
  // Integer scaling keeps pixel art edges sharp
  canvasElement.style.width = `${width * CANVAS_SCALE}px`;
  canvasElement.style.height = `${height * CANVAS_SCALE}px`;

  drawingContext.fillStyle = "#000";
  drawingContext.fillRect(0, 0, width, height);
}

mountEmptyCanvas();

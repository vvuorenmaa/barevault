import { calculateCanvasPixelSize } from "../engine/canvasSize";
import { generateDungeon } from "../engine/dungeon";
import { renderGrid } from "./renderGrid";

const TILE_SIZE_IN_PIXELS = 16;
const CANVAS_SCALE = 2;
const DUNGEON_COLUMN_COUNT = 40;
const DUNGEON_ROW_COUNT = 25;
const DEFAULT_SEED = "bare-vault";

function readSeedFromUrl(): string {
  const seedParameter = new URLSearchParams(window.location.search).get("seed");
  return seedParameter === null || seedParameter === "" ? DEFAULT_SEED : seedParameter;
}

function mountDungeon(): void {
  const canvasElement = document.querySelector<HTMLCanvasElement>("#game-canvas");
  if (!canvasElement) {
    throw new Error("Canvas element #game-canvas not found");
  }
  const drawingContext = canvasElement.getContext("2d");
  if (!drawingContext) {
    throw new Error("2D canvas context is not available");
  }

  const { grid } = generateDungeon({
    seed: readSeedFromUrl(),
    columnCount: DUNGEON_COLUMN_COUNT,
    rowCount: DUNGEON_ROW_COUNT,
  });
  const { width, height } = calculateCanvasPixelSize(
    grid.columnCount,
    grid.rowCount,
    TILE_SIZE_IN_PIXELS,
  );
  canvasElement.width = width;
  canvasElement.height = height;
  // Integer scaling keeps pixel art edges sharp
  canvasElement.style.width = `${width * CANVAS_SCALE}px`;
  canvasElement.style.height = `${height * CANVAS_SCALE}px`;

  renderGrid(drawingContext, grid, TILE_SIZE_IN_PIXELS);
}

mountDungeon();

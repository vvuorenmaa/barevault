import { calculateCanvasPixelSize } from "../engine/canvasSize";
import { findEnemyStartPosition, findRoomCenter, generateDungeon } from "../engine/dungeon";
import { chaseHeroTurn } from "../engine/enemy";
import { createWorld, playTurn, type World } from "../engine/turn";
import { findDirectionForKey } from "./keyboardInput";
import { renderEnemies } from "./renderEnemies";
import { renderGrid } from "./renderGrid";
import { renderHero } from "./renderHero";

const TILE_SIZE_IN_PIXELS = 16;
const CANVAS_SCALE = 2;
const DUNGEON_COLUMN_COUNT = 40;
const DUNGEON_ROW_COUNT = 25;
const DEFAULT_SEED = "bare-vault";

function readSeedFromUrl(): string {
  const seedParameter = new URLSearchParams(window.location.search).get("seed");
  return seedParameter === null || seedParameter === "" ? DEFAULT_SEED : seedParameter;
}

function createStartingWorld(): World {
  const { grid, rooms } = generateDungeon({
    seed: readSeedFromUrl(),
    columnCount: DUNGEON_COLUMN_COUNT,
    rowCount: DUNGEON_ROW_COUNT,
  });
  const [startingRoom] = rooms;
  if (startingRoom === undefined) {
    throw new Error("The generated dungeon has no room to start in");
  }
  const enemyStartPosition = findEnemyStartPosition(rooms);
  const enemies = enemyStartPosition === undefined ? [] : [{ position: enemyStartPosition }];
  return createWorld(grid, findRoomCenter(startingRoom), undefined, enemies);
}

function mountGame(): void {
  const canvasElement = document.querySelector<HTMLCanvasElement>("#game-canvas");
  if (!canvasElement) {
    throw new Error("Canvas element #game-canvas not found");
  }
  const drawingContext = canvasElement.getContext("2d");
  if (!drawingContext) {
    throw new Error("2D canvas context is not available");
  }

  let world = createStartingWorld();
  const { width, height } = calculateCanvasPixelSize(
    world.grid.columnCount,
    world.grid.rowCount,
    TILE_SIZE_IN_PIXELS,
  );
  canvasElement.width = width;
  canvasElement.height = height;
  // Integer scaling keeps pixel art edges sharp
  canvasElement.style.width = `${width * CANVAS_SCALE}px`;
  canvasElement.style.height = `${height * CANVAS_SCALE}px`;

  // An arrow function keeps the null check on drawingContext in scope, unlike a hoisted declaration
  const render = (): void => {
    renderGrid(drawingContext, world, TILE_SIZE_IN_PIXELS);
    renderEnemies(drawingContext, world, TILE_SIZE_IN_PIXELS);
    renderHero(drawingContext, world.hero, TILE_SIZE_IN_PIXELS);
  };

  window.addEventListener("keydown", (keyboardEvent) => {
    const direction = findDirectionForKey(keyboardEvent);
    if (direction === undefined) {
      return;
    }
    // Arrow keys would otherwise scroll the page
    keyboardEvent.preventDefault();
    const turnResult = playTurn(world, direction, [chaseHeroTurn]);
    if (!turnResult.turnTaken) {
      return;
    }
    world = turnResult.world;
    render();
  });

  render();
}

mountGame();

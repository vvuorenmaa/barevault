import { calculateCanvasPixelSize } from "../engine/canvasSize";
import { findRoomCenter, findVaultEnemyPositions, generateDungeon } from "../engine/dungeon";
import { ENEMY_STARTING_HIT_POINTS } from "../engine/combat";
import { enemiesTurn } from "../engine/enemy";
import { createWorld, playTurn, type World } from "../engine/turn";
import { placeStartingGear } from "./gearPlacement";
import { describeHeroStatus } from "./heroStatus";
import { findHeroActionForKey } from "./keyboardInput";
import { renderEnemies } from "./renderEnemies";
import { renderGear } from "./renderGear";
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
  const enemies = findVaultEnemyPositions(rooms).map((position) => ({
    position,
    hitPoints: ENEMY_STARTING_HIT_POINTS,
    hasNoticedHero: false,
  }));
  const heroStart = findRoomCenter(startingRoom);
  return createWorld(grid, heroStart, { enemies, gearItems: placeStartingGear(grid, heroStart) });
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
  const heroStatusElement = document.querySelector<HTMLElement>("#hero-status");
  if (!heroStatusElement) {
    throw new Error("Status element #hero-status not found");
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
    renderGear(drawingContext, world, TILE_SIZE_IN_PIXELS);
    renderEnemies(drawingContext, world, TILE_SIZE_IN_PIXELS);
    renderHero(drawingContext, world.hero, TILE_SIZE_IN_PIXELS);
    heroStatusElement.textContent = describeHeroStatus(world);
  };

  window.addEventListener("keydown", (keyboardEvent) => {
    const heroAction = findHeroActionForKey(keyboardEvent);
    if (heroAction === undefined) {
      return;
    }
    // Arrow keys and space would otherwise scroll the page
    keyboardEvent.preventDefault();
    const turnResult = playTurn(world, heroAction, [enemiesTurn]);
    if (!turnResult.turnTaken) {
      return;
    }
    world = turnResult.world;
    render();
  });

  render();
}

mountGame();

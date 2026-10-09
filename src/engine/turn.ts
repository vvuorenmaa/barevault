import { HERO_ATTACK_DAMAGE, HERO_STARTING_HIT_POINTS } from "./combat";
import { computeFieldOfView } from "./fieldOfView";
import { getTile, isInsideGrid, toTileIndex, type Grid, type TilePosition } from "./grid";

export type Direction = "up" | "down" | "left" | "right";

// Waiting spends the turn without moving, so the hero can let enemies come to them
export type HeroAction = Direction | "wait";

export interface Enemy {
  readonly position: TilePosition;
  readonly hitPoints: number;
  // Enemies wait in place until the hero comes into their sight; after that they never lose track
  readonly hasNoticedHero: boolean;
}

export type GearKind = "weapon" | "armor";

// Gear lying on the map until the hero steps onto it
export interface GearItem {
  readonly position: TilePosition;
  readonly kind: GearKind;
  readonly strength: number;
}

// What the hero carries: a bare start is all zeros
export interface HeroGear {
  readonly weaponDamageBonus: number;
  readonly armorProtection: number;
}

const BARE_HERO_GEAR: HeroGear = { weaponDamageBonus: 0, armorProtection: 0 };

export interface World {
  readonly grid: Grid;
  readonly hero: TilePosition;
  readonly heroHitPoints: number;
  readonly heroGear: HeroGear;
  readonly gearItems: readonly GearItem[];
  readonly enemies: readonly Enemy[];
  readonly sightRadius: number;
  // One flag per grid tile, in the same order as the grid's tiles
  readonly visibleTiles: readonly boolean[];
  readonly exploredTiles: readonly boolean[];
}

const DEFAULT_SIGHT_RADIUS = 8;

export interface TurnResult {
  readonly world: World;
  readonly turnTaken: boolean;
}

const OFFSET_BY_DIRECTION: Readonly<Record<Direction, TilePosition>> = {
  up: { column: 0, row: -1 },
  down: { column: 0, row: 1 },
  left: { column: -1, row: 0 },
  right: { column: 1, row: 0 },
};

function updateVision(world: World): World {
  const visibleTiles = world.grid.tiles.map(() => false);
  const exploredTiles = [...world.exploredTiles];
  for (const { column, row } of computeFieldOfView(world.grid, world.hero, world.sightRadius)) {
    const tileIndex = toTileIndex(world.grid, column, row);
    visibleTiles[tileIndex] = true;
    exploredTiles[tileIndex] = true;
  }
  const enemies = world.enemies.map((enemy) => {
    if (enemy.hasNoticedHero) {
      return enemy;
    }
    const isInSight = visibleTiles[toTileIndex(world.grid, enemy.position.column, enemy.position.row)] === true;
    return isInSight ? { ...enemy, hasNoticedHero: true } : enemy;
  });
  return { ...world, enemies, visibleTiles, exploredTiles };
}

export interface WorldOptions {
  readonly sightRadius?: number;
  readonly enemies?: readonly Enemy[];
  readonly heroHitPoints?: number;
  readonly heroGear?: HeroGear;
  readonly gearItems?: readonly GearItem[];
}

export function createWorld(grid: Grid, hero: TilePosition, options: WorldOptions = {}): World {
  const {
    sightRadius = DEFAULT_SIGHT_RADIUS,
    enemies = [],
    heroHitPoints = HERO_STARTING_HIT_POINTS,
    heroGear = BARE_HERO_GEAR,
    gearItems = [],
  } = options;
  const unseenTiles = grid.tiles.map(() => false);
  return updateVision({
    grid,
    hero,
    heroHitPoints,
    heroGear,
    gearItems,
    enemies,
    sightRadius,
    visibleTiles: unseenTiles,
    exploredTiles: unseenTiles,
  });
}

function readTileFlag(world: World, flags: readonly boolean[], column: number, row: number): boolean {
  return flags[toTileIndex(world.grid, column, row)] === true;
}

export function isTileVisible(world: World, column: number, row: number): boolean {
  return readTileFlag(world, world.visibleTiles, column, row);
}

export function isTileExplored(world: World, column: number, row: number): boolean {
  return readTileFlag(world, world.exploredTiles, column, row);
}

function isWalkable(grid: Grid, position: TilePosition): boolean {
  return isInsideGrid(grid, position.column, position.row) && getTile(grid, position.column, position.row) === "floor";
}

// Behaviour is passed in rather than stored in the world, which keeps the world plain data (ADR-0002)
export type ActorTurn = (world: World) => World;

function attackEnemy(world: World, targetIndex: number): World {
  const survivingEnemies = world.enemies
    .map((enemy, index) =>
      index === targetIndex ? { ...enemy, hitPoints: enemy.hitPoints - (HERO_ATTACK_DAMAGE + world.heroGear.weaponDamageBonus) } : enemy,
    )
    .filter((enemy) => enemy.hitPoints > 0);
  return { ...world, enemies: survivingEnemies };
}

// Gear of a kind the hero already carries is replaced, not added to
function pickUpGearAt(world: World, position: TilePosition): World {
  const item = world.gearItems.find(
    (gearItem) => gearItem.position.column === position.column && gearItem.position.row === position.row,
  );
  if (item === undefined) {
    return world;
  }
  const heroGear =
    item.kind === "weapon"
      ? { ...world.heroGear, weaponDamageBonus: item.strength }
      : { ...world.heroGear, armorProtection: item.strength };
  return { ...world, heroGear, gearItems: world.gearItems.filter((gearItem) => gearItem !== item) };
}

// Returns the world after the hero's own action, or undefined when the action costs no turn
function performHeroAction(world: World, action: HeroAction): World | undefined {
  if (action === "wait") {
    return world;
  }
  const offset = OFFSET_BY_DIRECTION[action];
  const destination: TilePosition = {
    column: world.hero.column + offset.column,
    row: world.hero.row + offset.row,
  };

  const targetIndex = world.enemies.findIndex(
    (enemy) => enemy.position.column === destination.column && enemy.position.row === destination.row,
  );
  if (targetIndex !== -1) {
    return attackEnemy(world, targetIndex);
  }
  if (!isWalkable(world.grid, destination)) {
    return undefined;
  }
  return updateVision(pickUpGearAt({ ...world, hero: destination }, destination));
}

export function isHeroDead(world: World): boolean {
  return world.heroHitPoints <= 0;
}

// A turn is only spent when the hero moves, attacks or waits; bumping into a wall costs nothing,
// and once the hero is dead the run is over, so nothing happens any more
export function playTurn(
  world: World,
  action: HeroAction,
  otherActors: readonly ActorTurn[],
): TurnResult {
  if (isHeroDead(world)) {
    return { world, turnTaken: false };
  }
  const worldAfterHeroActed = performHeroAction(world, action);
  if (worldAfterHeroActed === undefined) {
    return { world, turnTaken: false };
  }

  const worldAfterAllActors = otherActors.reduce(
    (currentWorld, takeActorTurn) => takeActorTurn(currentWorld),
    worldAfterHeroActed,
  );
  return { world: worldAfterAllActors, turnTaken: true };
}

import { ENEMY_ATTACK_DAMAGE, MINIMUM_DAMAGE_TAKEN } from "./combat";
import type { Grid, TilePosition } from "./grid";
import { findNextStepToward } from "./pathfinding";
import type { ActorTurn, Enemy } from "./turn";

function isSamePosition(first: TilePosition, second: TilePosition): boolean {
  return first.column === second.column && first.row === second.row;
}

// Attacks only reach straight up, down, left or right, the same directions the hero moves in
function isOrthogonallyAdjacent(first: TilePosition, second: TilePosition): boolean {
  return Math.abs(first.column - second.column) + Math.abs(first.row - second.row) === 1;
}

// Prefers a route around the other enemies. When they seal the way (a corridor), it falls back to
// the plain shortest route so the enemy still queues up behind them, as long as the step is free.
function chooseStepTowardHero(
  grid: Grid,
  enemy: Enemy,
  hero: TilePosition,
  otherEnemyPositions: readonly TilePosition[],
): TilePosition | undefined {
  const stepAroundOthers = findNextStepToward(grid, enemy.position, hero, otherEnemyPositions);
  if (stepAroundOthers !== undefined) {
    return stepAroundOthers;
  }
  const plainStep = findNextStepToward(grid, enemy.position, hero, []);
  const isPlainStepFree =
    plainStep !== undefined && !otherEnemyPositions.some((position) => isSamePosition(position, plainStep));
  return isPlainStepFree ? plainStep : undefined;
}

// Each enemy either attacks the hero from an adjacent tile or walks toward them. They act one at a
// time so each sees where the others already stand and they never share a tile.
export const enemiesTurn: ActorTurn = (world) => {
  const enemiesAfterActing: Enemy[] = [...world.enemies];
  let heroHitPoints = world.heroHitPoints;

  world.enemies.forEach((enemy, enemyIndex) => {
    if (!enemy.hasNoticedHero) {
      return;
    }
    if (isOrthogonallyAdjacent(enemy.position, world.hero)) {
      heroHitPoints -= Math.max(MINIMUM_DAMAGE_TAKEN, ENEMY_ATTACK_DAMAGE - world.heroGear.armorProtection);
      return;
    }
    const otherEnemyPositions = enemiesAfterActing
      .filter((_, otherIndex) => otherIndex !== enemyIndex)
      .map((otherEnemy) => otherEnemy.position);
    const nextStep = chooseStepTowardHero(world.grid, enemy, world.hero, otherEnemyPositions);
    if (nextStep !== undefined) {
      enemiesAfterActing[enemyIndex] = { ...enemy, position: nextStep };
    }
  });

  return { ...world, enemies: enemiesAfterActing, heroHitPoints: Math.max(0, heroHitPoints) };
};

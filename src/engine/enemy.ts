import type { Grid, TilePosition } from "./grid";
import { findNextStepToward } from "./pathfinding";
import type { ActorTurn, Enemy } from "./turn";

function isSamePosition(first: TilePosition, second: TilePosition): boolean {
  return first.column === second.column && first.row === second.row;
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

// Enemies move one at a time so each sees where the others already stand and they never share a tile
export const chaseHeroTurn: ActorTurn = (world) => {
  const enemiesAfterMoving: Enemy[] = [...world.enemies];

  world.enemies.forEach((enemy, enemyIndex) => {
    const otherEnemyPositions = enemiesAfterMoving
      .filter((_, otherIndex) => otherIndex !== enemyIndex)
      .map((otherEnemy) => otherEnemy.position);
    const nextStep = chooseStepTowardHero(world.grid, enemy, world.hero, otherEnemyPositions);
    if (nextStep !== undefined) {
      enemiesAfterMoving[enemyIndex] = { ...enemy, position: nextStep };
    }
  });

  return { ...world, enemies: enemiesAfterMoving };
};

import { findNextStepToward } from "./pathfinding";
import type { ActorTurn, Enemy } from "./turn";

// Enemies move one at a time so each sees where the others already stand and they never share a tile
export const chaseHeroTurn: ActorTurn = (world) => {
  const enemiesAfterMoving: Enemy[] = [...world.enemies];

  world.enemies.forEach((enemy, enemyIndex) => {
    const otherEnemyPositions = enemiesAfterMoving
      .filter((_, otherIndex) => otherIndex !== enemyIndex)
      .map((otherEnemy) => otherEnemy.position);
    const nextStep = findNextStepToward(world.grid, enemy.position, world.hero, otherEnemyPositions);
    if (nextStep !== undefined) {
      enemiesAfterMoving[enemyIndex] = { ...enemy, position: nextStep };
    }
  });

  return { ...world, enemies: enemiesAfterMoving };
};

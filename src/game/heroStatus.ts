import { isHeroDead, type World } from "../engine/turn";

export function describeHeroStatus(world: World): string {
  if (isHeroDead(world)) {
    return "You died. Reload the page to start a new run.";
  }
  return `HP: ${world.heroHitPoints}`;
}

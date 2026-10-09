import { isHeroDead, type World } from "../engine/turn";

export function describeHeroStatus(world: World): string {
  if (isHeroDead(world)) {
    return "You died. Reload the page to start a new run.";
  }
  const { weaponDamageBonus, armorProtection } = world.heroGear;
  const statusParts = [`HP: ${world.heroHitPoints}`];
  if (weaponDamageBonus > 0) {
    statusParts.push(`Weapon +${weaponDamageBonus}`);
  }
  if (armorProtection > 0) {
    statusParts.push(`Armor ${armorProtection}`);
  }
  return statusParts.join(" | ");
}

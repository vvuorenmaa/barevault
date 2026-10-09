import { describe, expect, it } from "vitest";
import { ENEMY_STARTING_HIT_POINTS } from "./combat";
import { enemiesTurn } from "./enemy";
import { createGridFromRows, type TilePosition } from "./grid";
import { createWorld, playTurn, type GearItem, type World } from "./turn";

const CORRIDOR = ["#######", "#.....#", "#######"];
const HERO_POSITION: TilePosition = { column: 1, row: 1 };

function gearAt(column: number, kind: GearItem["kind"], strength: number): GearItem {
  return { position: { column, row: 1 }, kind, strength };
}

function createCorridorWorld(gearItems: readonly GearItem[]): World {
  return createWorld(createGridFromRows(CORRIDOR), HERO_POSITION, { gearItems });
}

describe("gear", () => {
  it("is not carried at the start of a run", () => {
    expect(createCorridorWorld([]).heroGear).toEqual({ weaponDamageBonus: 0, armorProtection: 0 });
  });

  it("is picked up as part of the move onto its tile and leaves the map", () => {
    const world = createCorridorWorld([gearAt(2, "weapon", 2)]);
    const after = playTurn(world, "right", []).world;
    expect(after.hero).toEqual({ column: 2, row: 1 });
    expect(after.heroGear).toEqual({ weaponDamageBonus: 2, armorProtection: 0 });
    expect(after.gearItems).toEqual([]);
  });

  it("is left alone while the hero is on other tiles", () => {
    const world = createCorridorWorld([gearAt(4, "armor", 1)]);
    const after = playTurn(world, "right", []).world;
    expect(after.heroGear).toEqual({ weaponDamageBonus: 0, armorProtection: 0 });
    expect(after.gearItems).toEqual([gearAt(4, "armor", 1)]);
  });

  it("replaces gear of the same kind the hero already carries instead of stacking", () => {
    const world = createCorridorWorld([gearAt(2, "armor", 1), gearAt(3, "armor", 2)]);
    const afterFirst = playTurn(world, "right", []).world;
    const afterSecond = playTurn(afterFirst, "right", []).world;
    expect(afterSecond.heroGear.armorProtection).toBe(2);
  });

  it("replaces a carried weapon with the one picked up later", () => {
    const world = createCorridorWorld([gearAt(2, "weapon", 3), gearAt(3, "weapon", 1)]);
    const afterBoth = playTurn(playTurn(world, "right", []).world, "right", []).world;
    expect(afterBoth.heroGear.weaponDamageBonus).toBe(1);
  });

  it("stays on the map when the hero attacks an enemy standing on it", () => {
    const enemy = { position: { column: 2, row: 1 }, hitPoints: ENEMY_STARTING_HIT_POINTS, hasNoticedHero: false };
    const world = createWorld(createGridFromRows(CORRIDOR), HERO_POSITION, {
      enemies: [enemy],
      gearItems: [gearAt(2, "weapon", 2)],
    });
    const after = playTurn(world, "right", []).world;
    expect(after.hero).toEqual(HERO_POSITION);
    expect(after.heroGear.weaponDamageBonus).toBe(0);
    expect(after.gearItems).toEqual([gearAt(2, "weapon", 2)]);
  });

  it("makes a weapon-wielding hero kill an enemy in one blow that takes bare hands several", () => {
    const enemy = { position: { column: 3, row: 1 }, hitPoints: ENEMY_STARTING_HIT_POINTS, hasNoticedHero: false };
    const bareHanded = createWorld(createGridFromRows(CORRIDOR), { column: 2, row: 1 }, { enemies: [enemy] });
    const armed = createWorld(createGridFromRows(CORRIDOR), { column: 2, row: 1 }, {
      enemies: [enemy],
      heroGear: { weaponDamageBonus: 2, armorProtection: 0 },
    });
    expect(playTurn(bareHanded, "right", []).world.enemies).toHaveLength(1);
    expect(playTurn(armed, "right", []).world.enemies).toEqual([]);
  });
});

describe("armor", () => {
  function createWorldWithAdjacentEnemy(armorProtection: number): World {
    return createWorld(createGridFromRows(CORRIDOR), HERO_POSITION, {
      heroHitPoints: 10,
      heroGear: { weaponDamageBonus: 0, armorProtection },
      enemies: [{ position: { column: 2, row: 1 }, hitPoints: ENEMY_STARTING_HIT_POINTS, hasNoticedHero: true }],
    });
  }

  it("reduces the damage a hit deals", () => {
    expect(enemiesTurn(createWorldWithAdjacentEnemy(1)).heroHitPoints).toBe(9);
  });

  it("never lowers a hit below 1 damage", () => {
    expect(enemiesTurn(createWorldWithAdjacentEnemy(50)).heroHitPoints).toBe(9);
  });

  it("changes nothing without armor", () => {
    expect(enemiesTurn(createWorldWithAdjacentEnemy(0)).heroHitPoints).toBe(8);
  });
});

import { describe, expect, it } from "vitest";
import { createGridFromRows } from "../engine/grid";
import { createWorld } from "../engine/turn";
import { describeHeroStatus } from "./heroStatus";

function createWorldWithHeroHitPoints(heroHitPoints: number) {
  return createWorld(createGridFromRows(["###", "#.#", "###"]), { column: 1, row: 1 }, { heroHitPoints });
}

describe("describeHeroStatus", () => {
  it("shows the hit points while the hero lives", () => {
    expect(describeHeroStatus(createWorldWithHeroHitPoints(7))).toBe("HP: 7");
  });

  it("announces death and how to start a new run", () => {
    const status = describeHeroStatus(createWorldWithHeroHitPoints(0));
    expect(status).toContain("You died");
    expect(status).toContain("Reload");
  });
});

describe("describeHeroStatus with gear", () => {
  const room = createGridFromRows(["###", "#.#", "###"]);
  const hero = { column: 1, row: 1 };

  it("lists the weapon and armor the hero carries", () => {
    const world = createWorld(room, hero, {
      heroHitPoints: 7,
      heroGear: { weaponDamageBonus: 2, armorProtection: 1 },
    });
    expect(describeHeroStatus(world)).toBe("HP: 7 | Weapon +2 | Armor 1");
  });

  it("lists only what is carried", () => {
    const world = createWorld(room, hero, {
      heroHitPoints: 7,
      heroGear: { weaponDamageBonus: 0, armorProtection: 1 },
    });
    expect(describeHeroStatus(world)).toBe("HP: 7 | Armor 1");
  });
});

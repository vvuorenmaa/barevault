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

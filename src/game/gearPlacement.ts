import { getTile, isInsideGrid, type Grid, type TilePosition } from "../engine/grid";
import type { GearItem, GearKind } from "../engine/turn";

const WEAPON_DAMAGE_BONUS = 2;
const ARMOR_PROTECTION = 1;

// Right, left, down, up: the order only decides which free tile gets which item
const NEIGHBOUR_OFFSETS: readonly TilePosition[] = [
  { column: 1, row: 0 },
  { column: -1, row: 0 },
  { column: 0, row: 1 },
  { column: 0, row: -1 },
];

const STARTING_GEAR: readonly { kind: GearKind; strength: number }[] = [
  { kind: "weapon", strength: WEAPON_DAMAGE_BONUS },
  { kind: "armor", strength: ARMOR_PROTECTION },
];

// Stand-in until gear lies in the vault: puts it next to the hero so its effect can be seen straight away
export function placeStartingGear(grid: Grid, hero: TilePosition): GearItem[] {
  const freeTiles = NEIGHBOUR_OFFSETS.map((offset) => ({
    column: hero.column + offset.column,
    row: hero.row + offset.row,
  })).filter(
    (position) => isInsideGrid(grid, position.column, position.row) && getTile(grid, position.column, position.row) === "floor",
  );
  return STARTING_GEAR.flatMap((gear, index) => {
    const position = freeTiles[index];
    return position === undefined ? [] : [{ position, ...gear }];
  });
}

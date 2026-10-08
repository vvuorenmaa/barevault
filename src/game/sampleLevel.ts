import { createGridFromRows, type Grid } from "../engine/grid";

const SAMPLE_LEVEL_ROWS: readonly string[] = [
  "####################",
  "#......#...........#",
  "#......#...........#",
  "#..........####....#",
  "#......#...#..#....#",
  "###.####...#..#....#",
  "#.........##..#....#",
  "#.....#.......#....#",
  "#.....#...##########",
  "#.....#...........##",
  "#.................##",
  "####################",
];

export function createSampleLevel(): Grid {
  return createGridFromRows(SAMPLE_LEVEL_ROWS);
}

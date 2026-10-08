import { describe, expect, it } from "vitest";
import { calculateCanvasPixelSize } from "./canvasSize";

describe("calculateCanvasPixelSize", () => {
  it("multiplies the grid dimensions by the tile size", () => {
    expect(calculateCanvasPixelSize(40, 25, 16)).toEqual({ width: 640, height: 400 });
  });

  it.each([
    [0, 25, 16],
    [40, -1, 16],
    [40, 25, 1.5],
  ])("rejects non-positive-integer input (%s, %s, %s)", (columns, rows, tileSize) => {
    expect(() => calculateCanvasPixelSize(columns, rows, tileSize)).toThrow(RangeError);
  });
});

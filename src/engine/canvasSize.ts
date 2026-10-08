export interface PixelSize {
  readonly width: number;
  readonly height: number;
}

export function calculateCanvasPixelSize(
  columnCount: number,
  rowCount: number,
  tileSizeInPixels: number,
): PixelSize {
  const isPositiveInteger = (value: number): boolean => Number.isInteger(value) && value > 0;
  if (![columnCount, rowCount, tileSizeInPixels].every(isPositiveInteger)) {
    throw new RangeError("Column count, row count and tile size must be positive integers");
  }
  return { width: columnCount * tileSizeInPixels, height: rowCount * tileSizeInPixels };
}

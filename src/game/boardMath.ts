import { BASE_BOARD_COLUMNS, BASE_BOARD_ROWS, createBoardBounds, createCellId, parseCellId } from "./boardLayout";
import type { BoardBounds, OutputDirection } from "./types";

const ORTHOGONAL_NEIGHBORS = [
  { columnOffset: 0, direction: "up", rowOffset: -1 },
  { columnOffset: 1, direction: "right", rowOffset: 0 },
  { columnOffset: 0, direction: "down", rowOffset: 1 },
  { columnOffset: -1, direction: "left", rowOffset: 0 }
] as const;

const defaultBounds = createBoardBounds(undefined, BASE_BOARD_ROWS, BASE_BOARD_COLUMNS);

export function getCell(cellId: string, bounds: BoardBounds = defaultBounds) {
  const cell = parseCellId(cellId);

  if (
    !cell ||
    cell.row < bounds.minRow ||
    cell.row > bounds.maxRow ||
    cell.column < bounds.minColumn ||
    cell.column > bounds.maxColumn
  ) {
    return null;
  }

  return cell;
}

export function getOrthogonalNeighborIds(
  cellId: string,
  bounds: BoardBounds = defaultBounds
): string[] {
  const cell = getCell(cellId, bounds);

  if (!cell) {
    return [];
  }

  return ORTHOGONAL_NEIGHBORS.map(({ columnOffset, rowOffset }) => {
    const row = cell.row + rowOffset;
    const column = cell.column + columnOffset;

    if (
      row < bounds.minRow ||
      row > bounds.maxRow ||
      column < bounds.minColumn ||
      column > bounds.maxColumn
    ) {
      return null;
    }

    return createCellId(row, column);
  }).filter((neighborId): neighborId is string => neighborId !== null);
}

export function getDirectionalNeighborId(
  cellId: string,
  direction: OutputDirection,
  bounds: BoardBounds = defaultBounds
): string | null {
  if (direction === "none") {
    return null;
  }

  const cell = getCell(cellId, bounds);

  if (!cell) {
    return null;
  }

  const offset = ORTHOGONAL_NEIGHBORS.find((neighbor) => neighbor.direction === direction);

  if (!offset) {
    return null;
  }

  const row = cell.row + offset.rowOffset;
  const column = cell.column + offset.columnOffset;

  if (
    row < bounds.minRow ||
    row > bounds.maxRow ||
    column < bounds.minColumn ||
    column > bounds.maxColumn
  ) {
    return null;
  }

  return createCellId(row, column);
}

export function isEdgeCell(cellId: string, bounds: BoardBounds = defaultBounds): boolean {
  const cell = getCell(cellId, bounds);

  if (!cell) {
    return false;
  }

  return (
    cell.row === bounds.minRow ||
    cell.column === bounds.minColumn ||
    cell.row === bounds.maxRow ||
    cell.column === bounds.maxColumn
  );
}

export function getCellsWithinRadius(
  cellId: string,
  radius: number,
  bounds: BoardBounds = defaultBounds,
  includeDiagonals = true
): string[] {
  const cell = getCell(cellId, bounds);

  if (!cell || radius < 1) {
    return [];
  }

  const cells: string[] = [];

  for (let rowOffset = -radius; rowOffset <= radius; rowOffset += 1) {
    for (let columnOffset = -radius; columnOffset <= radius; columnOffset += 1) {
      if (rowOffset === 0 && columnOffset === 0) {
        continue;
      }

      if (!includeDiagonals && rowOffset !== 0 && columnOffset !== 0) {
        continue;
      }

      const row = cell.row + rowOffset;
      const column = cell.column + columnOffset;

      if (
        row < bounds.minRow ||
        row > bounds.maxRow ||
        column < bounds.minColumn ||
        column > bounds.maxColumn
      ) {
        continue;
      }

      if (Math.max(Math.abs(rowOffset), Math.abs(columnOffset)) > radius) {
        continue;
      }

      cells.push(createCellId(row, column));
    }
  }

  return cells;
}

import type {
  BoardBounds,
  BoardCellCoordinate,
  BoardCellDefinition,
  BoardExpansionCounts
} from "./types";

export const BASE_BOARD_COLUMNS = 7;
export const BASE_BOARD_ROWS = 7;
export const MAX_EXPANSIONS_PER_SIDE = 10;
export const MAX_TOTAL_EXPANSIONS = MAX_EXPANSIONS_PER_SIDE * 4;
export const MAX_BOARD_COLUMNS = BASE_BOARD_COLUMNS + MAX_EXPANSIONS_PER_SIDE * 2;
export const MAX_BOARD_ROWS = BASE_BOARD_ROWS + MAX_EXPANSIONS_PER_SIDE * 2;
export const defaultFocusCellId = createCellId(3, 3);
export const defaultBlockedCellIds: string[] = [];

const legacyDisplayCellPattern = /^([A-Z]+)(\d+)$/;
const internalCellPattern = /^r(-?\d+)c(-?\d+)$/i;

export function createCellId(rowIndex: number, columnIndex: number): string {
  return `r${rowIndex}c${columnIndex}`;
}

function getDisplayIndexFromLetters(letters: string): number {
  return letters
    .split("")
    .reduce((value, character) => value * 26 + (character.charCodeAt(0) - 64), 0) - 1;
}

export function getDisplayRowLabel(rowIndex: number): string {
  let value = rowIndex;
  let label = "";

  do {
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);

  return label;
}

export function parseCellId(cellId: string): BoardCellCoordinate | null {
  if (!cellId) {
    return null;
  }

  const internalMatch = internalCellPattern.exec(cellId);

  if (internalMatch) {
    const row = Number.parseInt(internalMatch[1], 10);
    const column = Number.parseInt(internalMatch[2], 10);

    if (
      Number.isNaN(row) ||
      Number.isNaN(column) ||
      row < -MAX_EXPANSIONS_PER_SIDE ||
      row > BASE_BOARD_ROWS - 1 + MAX_EXPANSIONS_PER_SIDE ||
      column < -MAX_EXPANSIONS_PER_SIDE ||
      column > BASE_BOARD_COLUMNS - 1 + MAX_EXPANSIONS_PER_SIDE
    ) {
      return null;
    }

    return {
      column,
      id: createCellId(row, column),
      row
    };
  }

  const legacyMatch = legacyDisplayCellPattern.exec(cellId);

  if (!legacyMatch) {
    return null;
  }

  const row = getDisplayIndexFromLetters(legacyMatch[1]);
  const column = Number.parseInt(legacyMatch[2], 10) - 1;

  if (
    Number.isNaN(column) ||
    row < 0 ||
    row >= BASE_BOARD_ROWS ||
    column < 0 ||
    column >= BASE_BOARD_COLUMNS
  ) {
    return null;
  }

  return {
    column,
    id: createCellId(row, column),
    row
  };
}

export function normalizeBoardCellId(cellId: string): string | null {
  return parseCellId(cellId)?.id ?? null;
}

export function createBoardExpansionCounts(
  overrides: Partial<BoardExpansionCounts> = {}
): BoardExpansionCounts {
  return {
    bottom: overrides.bottom ?? 0,
    left: overrides.left ?? 0,
    right: overrides.right ?? 0,
    top: overrides.top ?? 0
  };
}

export function getTotalExpansions(expansionCounts: BoardExpansionCounts): number {
  return (
    expansionCounts.top +
    expansionCounts.right +
    expansionCounts.bottom +
    expansionCounts.left
  );
}

export function createBoardBounds(
  expansionCounts: BoardExpansionCounts = createBoardExpansionCounts(),
  startingRows = BASE_BOARD_ROWS,
  startingColumns = BASE_BOARD_COLUMNS
): BoardBounds {
  return {
    maxColumn: startingColumns - 1 + expansionCounts.right,
    maxRow: startingRows - 1 + expansionCounts.bottom,
    minColumn: -expansionCounts.left,
    minRow: -expansionCounts.top
  };
}

export function getExpansionCountsFromBounds(
  bounds: BoardBounds,
  startingRows = BASE_BOARD_ROWS,
  startingColumns = BASE_BOARD_COLUMNS
): BoardExpansionCounts {
  return {
    bottom: Math.max(0, bounds.maxRow - (startingRows - 1)),
    left: Math.max(0, -bounds.minColumn),
    right: Math.max(0, bounds.maxColumn - (startingColumns - 1)),
    top: Math.max(0, -bounds.minRow)
  };
}

export function getBoardDimensions(bounds: BoardBounds): {
  columns: number;
  rows: number;
} {
  return {
    columns: bounds.maxColumn - bounds.minColumn + 1,
    rows: bounds.maxRow - bounds.minRow + 1
  };
}

export function isCellWithinBounds(cellId: string, bounds: BoardBounds): boolean {
  const cell = parseCellId(cellId);

  if (!cell) {
    return false;
  }

  return (
    cell.row >= bounds.minRow &&
    cell.row <= bounds.maxRow &&
    cell.column >= bounds.minColumn &&
    cell.column <= bounds.maxColumn
  );
}

export function getBoardLayout(bounds: BoardBounds): BoardCellCoordinate[] {
  const { columns, rows } = getBoardDimensions(bounds);
  const cells: BoardCellCoordinate[] = [];

  for (let rowOffset = 0; rowOffset < rows; rowOffset += 1) {
    const row = bounds.minRow + rowOffset;

    for (let columnOffset = 0; columnOffset < columns; columnOffset += 1) {
      const column = bounds.minColumn + columnOffset;
      cells.push({
        column,
        id: createCellId(row, column),
        row
      });
    }
  }

  return cells;
}

export function getBoardCellLabel(cellId: string, bounds: BoardBounds): string {
  const cell = parseCellId(cellId);

  if (!cell) {
    return cellId;
  }

  const displayRow = cell.row - bounds.minRow;
  const displayColumn = cell.column - bounds.minColumn + 1;

  return `${getDisplayRowLabel(displayRow)}${displayColumn}`;
}

export function createBoardLayout(
  blockedCellIds: string[],
  bounds: BoardBounds
): BoardCellDefinition[] {
  const blockedSet = new Set(blockedCellIds);

  return getBoardLayout(bounds).map((cell) => ({
    ...cell,
    blocked: blockedSet.has(cell.id)
  }));
}

const baseBoardBounds = createBoardBounds();
const maximumBoardBounds = createBoardBounds(
  createBoardExpansionCounts({
    bottom: MAX_EXPANSIONS_PER_SIDE,
    left: MAX_EXPANSIONS_PER_SIDE,
    right: MAX_EXPANSIONS_PER_SIDE,
    top: MAX_EXPANSIONS_PER_SIDE
  })
);

export const boardLayout = getBoardLayout(baseBoardBounds);
export const allBoardCells = getBoardLayout(maximumBoardBounds);

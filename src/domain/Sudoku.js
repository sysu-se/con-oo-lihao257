function deepCopyGrid(grid) {
  return grid.map(row => [...row]);
}

export class Sudoku {
  constructor(input) {
    this._grid = deepCopyGrid(input);
  }

  getGrid() {
    return deepCopyGrid(this._grid);
  }

  guess(move) {
    const { row, col, value } = move;
    this._grid[row][col] = value;
  }

  clone() {
    return new Sudoku(this._grid);
  }

  toJSON() {
    return {
      grid: deepCopyGrid(this._grid)
    };
  }

  toString() {
    let result = '';
    for (let i = 0; i < 9; i++) {
      if (i > 0 && i % 3 === 0) {
        result += '------+-------+------\n';
      }
      for (let j = 0; j < 9; j++) {
        if (j > 0 && j % 3 === 0) {
          result += '| ';
        }
        const cell = this._grid[i][j];
        result += cell === 0 ? '.' : cell;
        result += ' ';
      }
      result += '\n';
    }
    return result;
  }
}

export function createSudoku(input) {
  return new Sudoku(input);
}

export function createSudokuFromJSON(json) {
  return new Sudoku(json.grid);
}

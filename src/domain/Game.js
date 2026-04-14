import { createSudokuFromJSON} from "./Sudoku.js";
export class Game {
  constructor({ sudoku }) {
    this._currentSudoku = sudoku;
    this._history = [];
    this._future = [];
  }

  getSudoku() {
    return this._currentSudoku;
  }

  guess(move) {
    this._history.push(this._currentSudoku.clone());
    this._future = [];
    this._currentSudoku.guess(move);
  }

  undo() {
    if (!this.canUndo()) return;

    this._future.push(this._currentSudoku.clone());
    this._currentSudoku = this._history.pop();
  }

  redo() {
    if (!this.canRedo()) return;

    this._history.push(this._currentSudoku.clone());
    this._currentSudoku = this._future.pop();
  }

  canUndo() {
    return this._history.length > 0;
  }

  canRedo() {
    return this._future.length > 0;
  }

  toJSON() {
    return {
      sudoku: this._currentSudoku.toJSON(),
      history: this._history.map(s => s.toJSON()),
      future: this._future.map(s => s.toJSON())
    };
  }
}

export function createGame({ sudoku }) {
  return new Game({ sudoku });
}

export function createGameFromJSON(json) {
  const currentSudoku = createSudokuFromJSON(json.sudoku);

  const game = new Game({ sudoku: currentSudoku });

  if (json.history) {
    game._history = json.history.map(sJson => createSudokuFromJSON(sJson));
  }
  if (json.future) {
    game._future = json.future.map(sJson => createSudokuFromJSON(sJson));
  }

  return game;
}
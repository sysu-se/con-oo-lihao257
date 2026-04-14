import { Sudoku, createSudoku as _createSudoku, createSudokuFromJSON as _createSudokuFromJSON } from './Sudoku.js';
import { Game, createGame as _createGame, createGameFromJSON as _createGameFromJSON} from './Game.js';

export function createSudoku(input) {
  return _createSudoku(input);
}

export function createSudokuFromJSON(json) {
  return _createSudokuFromJSON(json);
}

export function createGame({ sudoku }) {
  return _createGame({ sudoku });
}

export function createGameFromJSON(json) {
  return _createGameFromJSON(json)
}

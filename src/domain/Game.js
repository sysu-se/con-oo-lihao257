import { createSudokuFromJSON } from './Sudoku.js';

/**
 * @typedef {Object} GameJSON
 * @property {import('./Sudoku.js').SudokuJSON} sudoku - 当前 Sudoku 状态
 * @property {Array<import('./Sudoku.js').SudokuJSON>} history - 历史状态快照
 * @property {Array<import('./Sudoku.js').SudokuJSON>} future - 可重做的状态快照
 */

/**
 * Game 类 - 表示一局数独游戏会话，管理历史记录和撤销/重做
 *
 * 职责：
 * - 持有当前的 Sudoku 实例
 * - 管理历史状态栈和未来状态栈
 * - 提供 undo() / redo() 操作
 * - 对外提供面向 UI 的游戏操作入口
 * - 确保封装性，不直接暴露内部可变对象
 */
export class Game {
  /**
   * 创建一个新的 Game 实例
   * @param {Object} options - 配置选项
   * @param {import('./Sudoku.js').Sudoku} options.sudoku - Sudoku 实例
   */
  constructor({ sudoku }) {
    // 防御性复制：创建自己的副本，不依赖外部引用
    this._currentSudoku = sudoku.clone();
    this._history = [];
    this._future = [];
  }

  /**
   * 获取当前 Sudoku 状态的只读视图（返回副本，防止外部修改破坏历史）
   * @returns {import('./Sudoku.js').Sudoku} 当前 Sudoku 的深拷贝
   */
  getSudoku() {
    return this._currentSudoku.clone();
  }

  /**
   * 执行一步落子操作，并保存历史
   * @param {import('./Sudoku.js').Move} move - 落子操作
   */
  guess(move) {
    this._history.push(this._currentSudoku.clone());
    this._future = [];
    this._currentSudoku.guess(move);
  }

  /**
   * 撤销上一步操作
   */
  undo() {
    if (!this.canUndo()) return;

    this._future.push(this._currentSudoku.clone());
    this._currentSudoku = this._history.pop();
  }

  /**
   * 重做刚才撤销的操作
   */
  redo() {
    if (!this.canRedo()) return;

    this._history.push(this._currentSudoku.clone());
    this._currentSudoku = this._future.pop();
  }

  /**
   * 检查是否可以撤销
   * @returns {boolean} 如果有历史记录返回 true
   */
  canUndo() {
    return this._history.length > 0;
  }

  /**
   * 检查是否可以重做
   * @returns {boolean} 如果有可重做的历史返回 true
   */
  canRedo() {
    return this._future.length > 0;
  }

  /**
   * 转换为可序列化为 JSON 的对象
   * @returns {GameJSON} JSON 表示
   */
  toJSON() {
    return {
      sudoku: this._currentSudoku.toJSON(),
      history: this._history.map(s => s.toJSON()),
      future: this._future.map(s => s.toJSON())
    };
  }
}

/**
 * 创建 Game 实例的工厂函数
 * @param {Object} options - 配置选项
 * @param {import('./Sudoku.js').Sudoku} options.sudoku - Sudoku 实例
 * @returns {Game} 新的 Game 实例
 */
export function createGame({ sudoku }) {
  return new Game({ sudoku });
}

/**
 * 从 JSON 创建 Game 实例
 * @param {GameJSON} json - JSON 表示
 * @returns {Game} 新的 Game 实例
 */
export function createGameFromJSON(json) {
  const currentSudoku = createSudokuFromJSON(json.sudoku);

  const game = new Game({ sudoku: currentSudoku });

  // 直接设置内部状态，通过防御性复制确保安全
  if (json.history) {
    game._history = json.history.map(sJson => createSudokuFromJSON(sJson));
  }
  if (json.future) {
    game._future = json.future.map(sJson => createSudokuFromJSON(sJson));
  }

  return game;
}

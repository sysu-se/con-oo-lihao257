import { writable, derived } from 'svelte/store';
import { createSudoku, createGame } from './index.js';

/**
 * @typedef {import('./Sudoku.js').Sudoku} Sudoku
 * @typedef {import('./Game.js').Game} Game
 * @typedef {import('./Sudoku.js').Move} Move
 */

/**
 * 创建一个面向 Svelte 的 Game Store 适配层
 *
 * 这个适配层负责：
 * - 内部持有 Game 领域对象
 * - 对外暴露可被 Svelte 消费的响应式状态
 * - 对外暴露 UI 可调用的方法
 *
 * @param {Sudoku} [initialSudoku] - 可选的初始 Sudoku 实例
 * @returns {Object} Game Store
 */
export function createGameStore(initialSudoku = null) {
  // 创建默认的空数独
  const defaultGrid = Array(9).fill(null).map(() => Array(9).fill(0));
  const sudoku = initialSudoku || createSudoku(defaultGrid);
  const game = createGame({ sudoku });

  // 内部状态：持有 Game 实例
  let _game = game;

  // 响应式状态
  const { subscribe, set, update } = writable({
    grid: _game.getSudoku().getGrid(),
    givens: _game.getSudoku().getGivens(),
    invalidCells: [],
    canUndo: _game.canUndo(),
    canRedo: _game.canRedo(),
    won: false
  });

  // 从 Game 实例更新响应式状态
  function syncState() {
    const currentSudoku = _game.getSudoku();
    const invalidCellsArr = currentSudoku.getInvalidCells();
    // 转换为 "x,y" 字符串格式以兼容现有组件
    const invalidCellsStr = invalidCellsArr.map(c => `${c.col},${c.row}`);

    set({
      grid: currentSudoku.getGrid(),
      givens: currentSudoku.getGivens(),
      invalidCells: invalidCellsStr,
      canUndo: _game.canUndo(),
      canRedo: _game.canRedo(),
      won: currentSudoku.isWon()
    });
  }

  return {
    subscribe,

    /**
     * 设置一个新的数独盘面
     * @param {number[][]} grid - 9x9 网格
     */
    setGrid(grid) {
      const newSudoku = createSudoku(grid);
      _game = createGame({ sudoku: newSudoku });
      syncState();
    },

    /**
     * 落子操作
     * @param {Move} move - 落子参数 {row, col, value}
     */
    guess(move) {
      try {
        _game.guess(move);
        syncState();
      } catch (e) {
        // 如果落子不合法（比如修改题面），静默失败
        console.warn('Guess failed:', e.message);
      }
    },

    /**
     * 撤销
     */
    undo() {
      _game.undo();
      syncState();
    },

    /**
     * 重做
     */
    redo() {
      _game.redo();
      syncState();
    },

    /**
     * 获取当前 Game 实例的 JSON 表示（用于序列化）
     */
    toJSON() {
      return _game.toJSON();
    },

    /**
     * 内部同步状态（供测试用）
     */
    _syncState: syncState
  };
}

// 导出单例 store
export const gameStore = createGameStore();

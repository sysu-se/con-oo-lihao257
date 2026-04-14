/**
 * @typedef {Object} Move
 * @property {number} row - 行索引 (0-8)
 * @property {number} col - 列索引 (0-8)
 * @property {number} value - 要填入的值 (0-9，0 表示清空)
 */

/**
 * @typedef {Object} SudokuJSON
 * @property {number[][]} grid - 当前 9x9 网格状态
 * @property {number[][]} givens - 初始题面（非零表示固定数字）
 */

/**
 * 深拷贝一个 9x9 的数独网格
 * @param {number[][]} grid - 要拷贝的网格
 * @returns {number[][]} 新的网格副本
 */
function deepCopyGrid(grid) {
  return grid.map(row => [...row]);
}

/**
 * 验证输入是否为有效的 9x9 数独网格
 * @param {*} grid - 要验证的输入
 * @returns {boolean} 是否有效
 */
function isValidGridSize(grid) {
  if (!Array.isArray(grid) || grid.length !== 9) return false;
  for (let i = 0; i < 9; i++) {
    if (!Array.isArray(grid[i]) || grid[i].length !== 9) return false;
    for (let j = 0; j < 9; j++) {
      const value = grid[i][j];
      if (typeof value !== 'number' || value < 0 || value > 9) return false;
    }
  }
  return true;
}

/**
 * 验证一个落子操作是否合法
 * @param {*} move - 要验证的落子操作
 * @returns {boolean} 是否合法
 */
function isValidMove(move) {
  if (!move || typeof move !== 'object') return false;
  const { row, col, value } = move;
  if (typeof row !== 'number' || row < 0 || row > 8) return false;
  if (typeof col !== 'number' || col < 0 || col > 8) return false;
  if (typeof value !== 'number' || value < 0 || value > 9) return false;
  return true;
}

/**
 * Sudoku 类 - 表示一个数独棋盘状态及业务规则
 *
 * 职责：
 * - 持有当前网格数据和初始题面
 * - 执行数独规则校验（行、列、宫约束）
 * - 跟踪哪些格子是题面给定的（固定），哪些是用户可编辑的
 * - 提供带校验的 guess() 方法
 * - 支持克隆和序列化
 */
export class Sudoku {
  /**
   * 创建一个新的 Sudoku 实例
   * @param {number[][]} input - 9x9 的初始网格
   * @param {number[][]} [givens] - 可选的初始题面（默认使用 input）
   * @throws {Error} 如果输入不是有效的 9x9 网格
   */
  constructor(input, givens = null) {
    if (!isValidGridSize(input)) {
      throw new Error('输入必须是 9x9 的网格，数值范围 0-9');
    }

    this._grid = deepCopyGrid(input);

    if (givens) {
      if (!isValidGridSize(givens)) {
        throw new Error('题面必须是 9x9 的网格，数值范围 0-9');
      }
      this._givens = deepCopyGrid(givens);
    } else {
      this._givens = deepCopyGrid(input);
    }
  }

  /**
   * 获取当前网格的深拷贝
   * @returns {number[][]} 网格的副本
   */
  getGrid() {
    return deepCopyGrid(this._grid);
  }

  /**
   * 获取初始题面的深拷贝
   * @returns {number[][]} 题面的副本
   */
  getGivens() {
    return deepCopyGrid(this._givens);
  }

  /**
   * 检查某个格子是否是题面给定的固定格子
   * @param {number} row - 行索引
   * @param {number} col - 列索引
   * @returns {boolean} 如果是题面给定的则返回 true
   */
  isGiven(row, col) {
    return this._givens[row][col] !== 0;
  }

  /**
   * 尝试在棋盘上落子
   * @param {Move} move - 落子操作
   * @returns {boolean} 落子成功返回 true
   * @throws {Error} 如果落子操作不合法或试图修改题面格子
   */
  guess(move) {
    if (!isValidMove(move)) {
      throw new Error('无效的落子操作：必须包含 row(0-8)、col(0-8)、value(0-9)');
    }

    const { row, col, value } = move;

    if (this.isGiven(row, col)) {
      throw new Error(`无法修改题面固定格子 (${row}, ${col})`);
    }

    this._grid[row][col] = value;
    return true;
  }

  /**
   * 检查当前网格是否存在冲突（同一行/列/宫内有重复值）
   * @returns {Array<{row: number, col: number}>} 无效格子的位置数组
   */
  getInvalidCells() {
    const invalid = new Set();

    // 检查行和列
    for (let i = 0; i < 9; i++) {
      const rowValues = new Map();
      const colValues = new Map();

      for (let j = 0; j < 9; j++) {
        // 检查第 i 行
        const rowVal = this._grid[i][j];
        if (rowVal !== 0) {
          if (rowValues.has(rowVal)) {
            invalid.add(`${i},${j}`);
            invalid.add(`${i},${rowValues.get(rowVal)}`);
          } else {
            rowValues.set(rowVal, j);
          }
        }

        // 检查第 i 列
        const colVal = this._grid[j][i];
        if (colVal !== 0) {
          if (colValues.has(colVal)) {
            invalid.add(`${j},${i}`);
            invalid.add(`${colValues.get(colVal)},${i}`);
          } else {
            colValues.set(colVal, j);
          }
        }
      }
    }

    // 检查 3x3 宫
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const boxValues = new Map();
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const row = boxRow * 3 + i;
            const col = boxCol * 3 + j;
            const val = this._grid[row][col];
            if (val !== 0) {
              if (boxValues.has(val)) {
                invalid.add(`${row},${col}`);
                const [prevRow, prevCol] = boxValues.get(val);
                invalid.add(`${prevRow},${prevCol}`);
              } else {
                boxValues.set(val, [row, col]);
              }
            }
          }
        }
      }
    }

    return Array.from(invalid).map(s => {
      const [row, col] = s.split(',').map(Number);
      return { row, col };
    });
  }

  /**
   * 检查谜题是否已完成且有效
   * @returns {boolean} 如果获胜返回 true
   */
  isWon() {
    // 检查是否填满
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (this._grid[i][j] === 0) return false;
      }
    }
    // 检查是否有冲突
    return this.getInvalidCells().length === 0;
  }

  /**
   * 创建当前 Sudoku 实例的深拷贝
   * @returns {Sudoku} 状态完全相同的新 Sudoku 实例
   */
  clone() {
    return new Sudoku(this._grid, this._givens);
  }

  /**
   * 转换为可序列化为 JSON 的对象
   * @returns {SudokuJSON} JSON 表示
   */
  toJSON() {
    return {
      grid: deepCopyGrid(this._grid),
      givens: deepCopyGrid(this._givens)
    };
  }

  /**
   * 获取人类可读的棋盘字符串表示
   * @returns {string} 格式化的棋盘字符串
   */
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

/**
 * 创建 Sudoku 实例的工厂函数
 * @param {number[][]} input - 9x9 初始网格
 * @returns {Sudoku} 新的 Sudoku 实例
 */
export function createSudoku(input) {
  return new Sudoku(input);
}

/**
 * 从 JSON 创建 Sudoku 实例
 * @param {SudokuJSON} json - JSON 表示
 * @returns {Sudoku} 新的 Sudoku 实例
 */
export function createSudokuFromJSON(json) {
  return new Sudoku(json.grid, json.givens || json.grid);
}

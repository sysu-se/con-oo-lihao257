## 一、领域对象改进

### 相比 HW1 的改进


#### 1. 修复 Game 封装的问题

原来的 `Game.getSudoku()` 直接返回内部 Sudoku 引用，调用方可以绕过 `Game.guess()` 直接修改盘面

`Game.getSudoku()` 现在返回 Sudoku 的深拷贝，而不是内部引用,外部拿到的 Sudoku 副本修改不会影响 Game 内部状态,所有修改必须通过 `Game.guess()` 进行，确保历史记录正确更新

#### 2. 增加数独校验

原来的 Sudoku 类没有任何规则校验

改进：
- `Sudoku` 构造函数校验输入必须是 9x9 网格，数值范围 0-9
- `guess()` 方法校验 move 参数的合法性
- 新增 `isGiven(row, col)` 方法检查是否为题面固定格子
- `guess()` 会阻止修改题面固定格子
- 新增 `getInvalidCells()` 方法检查冲突（行、列、宫内重复值）
- 新增 `isWon()` 方法检查是否获胜

#### 3. 增加题面 givens 支持

原来的 Sudoku 只保存一个 `_grid`，无法区分题面给定数字和用户填写数字。

改进：
- `Sudoku` 构造函数接受可选的 `givens` 参数
- 内部同时维护 `_grid`（当前状态）和 `_givens`（初始题面）
- `getGivens()` 方法返回题面副本
- `isGiven()` 方法判断某个格子是否为题面给定

#### 4. 改进生命周期防御性复制

原来的 Game 构造函数直接保存外部传入的 Sudoku 引用，存在状态污染风险。

改进：
- `Game` 构造函数现在会调用 `sudoku.clone()` 创建自己的副本
- `createGameFromJSON()` 重建对象时也通过防御性复制确保安全
- 所有边界都使用深拷贝，防止外部引用影响内部状态

#### 5. 简化 index.js 导出

原来的 index.js 只是把工厂函数再包一层，形成无意义的中转层。

改进：
- 直接从 Sudoku.js 和 Game.js 导出，移除冗余包装
- 同时导出类本身和工厂函数，更灵活

---

## 二、领域对象如何被消费

### 1. View 层直接消费的是什么？

View 层直接消费的是 Store Adapter，即 `gameStore`。

创建了 `src/domain/gameStore.js`，它提供：
- `createGameStore()` 工厂函数
- 预置的单例 `gameStore`

这个 Store Adapter 是连接领域层和 Svelte UI 层的桥梁。

### 2. View 层拿到的数据是什么？

通过 Store Adapter，View 层可以拿到：
- `grid`：当前 9x9 数独网格（来自 Sudoku.getGrid()）
- `givens`：初始题面网格（来自 Sudoku.getGivens()）
- `invalidCells`：有冲突的格子数组（格式 `"x,y"`，来自 Sudoku.getInvalidCells()）
- `canUndo`：是否可以撤销（来自 Game.canUndo()）
- `canRedo`：是否可以重做（来自 Game.canRedo()）
- `won`：是否获胜（来自 Sudoku.isWon()）

为了兼容现有组件，在 `@sudoku/stores/grid.js` 中保持了原有的接口：
- `grid` store（只读，映射到 givens）
- `userGrid` store（可读可写，映射到 grid）
- `invalidCells` store（保持原有格式）

### 3. 用户操作如何进入领域对象？

用户操作的流向：

1. 点击格子输入数字：
   - 用户点击键盘 → `Keyboard.svelte` 的 `handleKeyButton()`
   - 调用 `userGrid.set(cursor, num)`
   - `userGrid.set()` 内部调用 `gameStore.guess({ row, col, value })`
   - `gameStore.guess()` 调用 `_game.guess(move)`
   - Game 保存历史，委托给 Sudoku.guess()
   - 同步响应式状态，UI 自动更新

2. undo操作：
   - 用户点击 Undo 按钮 → `Actions.svelte` 的 `handleUndo()`
   - 调用 `undoMove()`
   - `undoMove()` 调用 `gameStore.undo()`
   - `gameStore.undo()` 调用 `_game.undo()`
   - Game 从历史栈恢复状态
   - 同步响应式状态，UI 自动更新

3. redo操作：
   类似redo流程，调用 `redoMove()` → `gameStore.redo()` → `_game.redo()`

4. 开始新游戏：
   - `game.startNew(diff)` → `grid.generate(diff)`
   - `grid.generate()` 调用 `gameStore.setGrid(newGrid)`
   - Game 被重置为新的 Sudoku 实例

### 4. 领域对象变化后，Svelte 为什么会更新？

关键在于 Store Adapter 的响应式机制：

1. `gameStore` 内部使用 Svelte 的 `writable()` store
2. 每次领域对象状态变化后（guess/undo/redo/setGrid），都会调用 `syncState()`
3. `syncState()` 从 Game/Sudoku 读取最新状态，调用 `set()` 更新 store
4. Svelte 组件通过 `$store` 语法订阅 store 变化
5. store 更新时，所有订阅的组件自动重新渲染

---

## 三、响应式机制说明

### 1. 依赖的是什么机制？

我们的方案主要依赖 **Svelte Store** 机制：

- 使用 `writable()` 创建可写 store
- 组件通过 `$store` 语法订阅（自动处理 subscribe/unsubscribe）
- 当 store 调用 `set()` 或 `update()` 时，通知所有订阅者

同时配合使用 **`derived()` store** 来从主 store 派生出特定状态（如 `canUndo`、`canRedo`、`gameWon`）。

### 2. 哪些数据是响应式暴露给 UI 的？

通过 Store Adapter 响应式暴露的数据：
- `grid`：当前盘面
- `givens`：初始题面
- `invalidCells`：冲突格子
- `canUndo`：可撤销状态
- `canRedo`：可重做状态
- `won`：获胜状态

这些数据都会在领域对象变化时自动更新。

### 3. 哪些状态留在领域对象内部？

完全封装在领域对象内部、不直接暴露的状态：
- `Sudoku._grid`：内部盘面状态（通过 `getGrid()` 返回副本）
- `Sudoku._givens`：内部题面状态（通过 `getGivens()` 返回副本）
- `Game._currentSudoku`：当前 Sudoku 实例（通过 `getSudoku()` 返回副本）
- `Game._history`：历史栈（完全内部）
- `Game._future`：未来栈（完全内部）

这些内部状态只能通过公开方法来操作，确保封装性。

### 4. 如果直接 mutate 内部对象，会出现什么问题？

如果不使用我们的方案，而是直接修改内部对象，会出现以下问题：

##### 1：UI 不会更新
Svelte 的响应式依赖于赋值操作。如果直接修改对象内部字段,Svelte 无法检测到这种变化，store 不会触发更新，UI 保持旧状态。

##### 2：历史记录被破坏
如果绕过 `Game.guess()` 直接修改 Sudoku：
```js
const sudoku = game.getSudoku();
sudoku.guess({ row: 0, col: 0, value: 5 });
```
历史栈不会更新，undo/redo 会失效。

---

## 四、为什么 HW1 中的做法不足以支撑真实接入？

### HW1 的局限性

1. Sudoku 缺少业务规则:
   - 没有校验，什么数字都能填
   - 无法区分题面和用户输入
   - 无法检测冲突或判断获胜

2. 没有响应式适配层
   - 领域对象是纯 JavaScript，不了解 Svelte
   - 直接在组件里用领域对象无法触发 UI 更新

### 新设计的 Trade-off

##### 优点：
- 清晰的分层：领域层, Store 适配层, UI 层，职责明确
- 完整的封装：领域对象内部状态完全私有，只能通过公开方法操作
- 可测试性：领域层不依赖 Svelte，可以独立测试
- 可维护性：未来可以轻松替换 UI 框架，领域层保持不变

##### 缺点：
- 状态同步开销：每次操作都要从领域对象同步到 store，有轻微性能开销
- 深拷贝开销：频繁的 clone() 和深拷贝会有一定性能影响（对于 9x9 数独可以忽略）

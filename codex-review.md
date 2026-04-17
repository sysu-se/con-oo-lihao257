# con-oo-lihao257 - Review

## Review 结论

当前实现已经把领域对象部分接入了真实 Svelte 流程：开始游戏、棋盘渲染、用户输入、Undo/Redo 都能沿着 store adapter 进入 `Game/Sudoku`，不再是纯测试代码。但设计质量仍然只有中等，最关键的问题是 `Game.guess()` 会在失败或无效操作时污染历史，直接破坏 Undo/Redo 语义；同时接入层仍保留较重的旧 facade 和重复业务状态，边界不够清晰。

## 总体评价

| 维度 | 评价 |
| --- | --- |
| OOP | fair |
| JS Convention | good |
| Sudoku Business | fair |
| OOD | fair |

## 缺点

### 1. 失败或无效输入也会污染 Undo/Redo 历史

- 严重程度：core
- 位置：src/domain/Game.js:45-49; src/domain/gameStore.js:74-81
- 原因：`Game.guess()` 在真正调用 `Sudoku.guess()` 之前就先把当前盘面压入 `_history` 并清空 `_future`。这样一来，修改 givens、非法 move，甚至同值覆盖这类不应产生状态变化的输入，都会先改动历史栈；而 `gameStore.guess()` 又把异常吞掉，只留下 `console.warn`，UI 看起来像“操作失败”，但撤销/重做语义已经被破坏。

### 2. 领域对象没有守住 givens 与当前棋盘之间的核心不变量

- 严重程度：major
- 位置：src/domain/Sudoku.js:71-85; src/domain/Sudoku.js:273-275
- 原因：`Sudoku` 构造函数和 `createSudokuFromJSON()` 只校验了 9x9 形状和数值范围，没有验证 `givens` 是否真的是当前 `grid` 的只读子集，也没有阻止 givens 中的非零值与当前 grid 冲突。这样一旦 JSON 快照损坏或调用方传错数据，就能构造出“题面数字与当前盘面不一致”的非法游戏状态，削弱了业务建模的可信度。

### 3. Svelte 游戏流程仍经由旧 facade 间接驱动，领域接入边界不够清晰

- 严重程度：major
- 位置：src/components/Modal/Types/Welcome.svelte:2-24; src/components/Header/Dropdown.svelte:2-23; src/node_modules/@sudoku/game.js:13-34
- 原因：新局开始和自定义题加载不是直接通过一个明确的 `GameStore`/adapter API 进入，而是组件先调用旧的 `@sudoku/game` facade，再由它转调 `grid.generate()` / `grid.decodeSencode()`，最后才落到 `createGameStore()`。这说明领域对象虽然接进去了，但接入方式仍是“兼容旧接口”的间接桥接，生命周期职责仍散在 facade、旧 store 和组件之间，不是单一清晰的 view-model 边界。

### 4. 获胜判定存在两份来源，容易产生架构漂移

- 严重程度：minor
- 位置：src/node_modules/@sudoku/stores/grid.js:88-93; src/node_modules/@sudoku/stores/game.js:7-20
- 原因：`gameWon` 一份来自 domain-backed `grid.js` 中的 `state.won`，另一份又在 `stores/game.js` 里通过 `userGrid + invalidCells` 重新推导。当前 `App.svelte` 使用的是前者，但代码库保留了第二份同类规则，说明迁移并未彻底收口到领域层，后续很容易出现两份逻辑不一致。

### 5. 同一模块保留了未被 UI 使用的 store 单例，存在双实例误用风险

- 严重程度：minor
- 位置：src/domain/gameStore.js:114-115; src/node_modules/@sudoku/stores/grid.js:10
- 原因：`src/domain/gameStore.js` 导出了一个 `gameStore` 单例，但真实 UI 走的是 `src/node_modules/@sudoku/stores/grid.js` 内部重新 `createGameStore()` 出来的另一实例。当前虽然没有直接出错，但这会让“哪个才是当前活动游戏状态”变得不明确，后续维护者若直接 import 领域层单例，很容易读到与界面不同步的状态源。

## 优点

### 1. 通过适配层把旧 UI 真实接到了新领域对象

- 位置：src/node_modules/@sudoku/stores/grid.js:7-105
- 原因：`grid.generate/decode`、`userGrid.set/applyHint`、`undoMove/redoMove` 最终都转发到 `createGameStore()`，说明开始游戏、渲染、输入和 Undo/Redo 四条主流程已经不再直接操作旧二维数组。

### 2. 响应式边界集中且符合 Svelte 3 的 custom store 习惯

- 位置：src/domain/gameStore.js:21-111
- 原因：store 内部持有 `Game`，对外只暴露 plain state 和命令方法，UI 可以直接用 `$store` 消费；这与作业推荐的 Store Adapter 方案一致，也比让组件直接拿可变领域对象更稳妥。

### 3. 数独规则查询被封装在领域对象内部

- 位置：src/domain/Sudoku.js:139-255
- 原因：`Sudoku` 自己承担了冲突检测、胜利判定、序列化和字符串外表化，UI 不需要自行遍历棋盘实现这些规则，职责划分比“组件里写规则”更合理。

### 4. 组件层主要承担事件转发，而不是直接执行业务逻辑

- 位置：src/components/Controls/Keyboard.svelte:10-25; src/components/Controls/ActionBar/Actions.svelte:23-31
- 原因：键盘输入、撤销和重做都通过 store 命令进入领域层，组件没有自己维护历史栈，也没有直接 mutate 领域对象内部状态，符合较好的 Svelte 分层方式。

### 5. 棋盘渲染读取的是领域对象导出的响应式视图状态

- 位置：src/components/Board/index.svelte:40-52; src/node_modules/@sudoku/stores/grid.js:43-93
- 原因：Board 读取的 `$userGrid`、`$grid`、`$invalidCells`、`$canUndo`、`$canRedo` 都来自 domain-backed store，而不是组件自己拼装，这满足了“View 真正消费领域对象或其导出状态”的要求。

## 补充说明

- 本次结论严格基于静态阅读，没有运行测试，也没有实际点开界面验证；关于 Undo/Redo 被污染、流程是否接入、UI 是否依赖 adapter 等判断都来自调用链和代码路径分析。
- 评审范围按要求收敛在 `src/domain/*` 以及直接桥接/消费它的 Svelte 接入代码，主要包括 `src/node_modules/@sudoku/stores/grid.js`、`src/node_modules/@sudoku/game.js`、`src/App.svelte` 和相关组件调用点。
- 由于未实际运行，像 `solveSudoku(...)` 在非法盘面下的具体行为、提示功能的运行时表现、以及界面刷新细节是否存在边界 bug，本次都只能给出静态风险判断，不能替代运行验证。

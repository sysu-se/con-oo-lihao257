## HW 问题收集

列举在HW 1、HW1.1过程里，你所遇到的2~3个通过自己学习已经解决的问题，和2~3个尚未解决的问题与挑战

### 已解决

1. 如何在 Svelte 组件中使用 store？
   1. **上下文**：需要把领域对象接入到现有 Svelte 组件中，但不知道如何把 Game/Sudoku 和 store 连接起来
   2. **解决手段**：查看 Svelte 官方文档 + 查看现有 store 的实现 + 询问 CA
   3. **答案**：
      - 使用 `writable()` 创建自定义 store
      - 使用 `$store` 语法在组件中订阅和更新 store
      - 使用 `derived()` 从其他 store 派生出新 store
      - 在组件中通过 `on:click` 调用 store 的方法

2. 为什么直接修改领域对象不会触发 UI 更新？
   1. **上下文**：一开始想直接在组件里使用 Game/Sudoku，但是发现修改后 UI 不会变化
   2. **解决手段**：询问 CA + 学习 Svelte 的响应式机制
   3. **答案**：
      - Svelte 的响应式依赖于赋值操作（`let x = ...`、`store.set(...)`）
      - 领域对象是纯 JavaScript，不了解 Svelte 的响应式机制
      - 需要通过 Store Adapter 层，在修改领域对象后调用 `store.set()` 通知 Svelte

3. 如何确保领域对象的封装性不被破坏？
   1. **上下文**：批改报告指出原来的 Game 封装被打穿了，外部可以直接修改内部 Sudoku
   2. **解决手段**：学习"防御性编程" + 查看设计模式相关资料 + 询问 CA
   3. **答案**：
      - 在所有边界处使用深拷贝（`clone()`、`deepCopyGrid()`）
      - 不要直接返回内部对象的引用，返回副本
      - 所有修改必须通过公开方法进行，确保历史记录被正确保存

### 未解决

1. PostCSS 构建错误怎么彻底解决？

   1. **上下文**：运行 `npm run dev` 或 `npm run build` 时报错：`TypeError: node.getIterator is not a function`。现在暂时禁用了 PostCSS 预处理器。

   2. **尝试解决手段**：降级 PostCSS 版本 + 修改 rollup 配置 + 禁用 preprocess

   3. **现状**：
      - 虽然测试可以通过，但完整的开发环境无法正常运行
      - 样式可能没有经过 Tailwind 的完整处理
      - 不知道是 PostCSS 版本问题还是 svelte-preprocess 版本问题
      - 也不确定其他依赖包的版本组合是否合适

2. 完整运行项目时，数独游戏界面是否真的能正常工作？

   1. **上下文**：因为 PostCSS 构建问题，暂时无法完整运行项目看到界面效果。

   2. **尝试解决手段**：只运行测试，确保领域对象逻辑正确，但无法验证 UI 交互。

   3. **疑问**：
      - 当用户点击格子时，`guess()` 是否被正确调用？
      - Undo/Redo 按钮是否能正常工作？
      - 胜利条件是否被正确判断？
      - 这些都只能通过代码逻辑推测，但无法实际验证

3. `deepCopyGrid` 频繁执行会不会影响性能？

   1. **上下文**：在 Sudoku.js 和 Game.js 中，每次调用 `getGrid()`、`getSudoku()`、`clone()`、`guess()`、`undo()`、`redo()` 都会执行深拷贝。

   2. **疑问**：
      - 对于 9x9 的数独网格，深拷贝的开销是否可以忽略？
      - 如果数独变大（比如 16x16），会不会有性能问题？
      - 是否有更高效的方式实现不可变性（immutability），比如 Immer.js？

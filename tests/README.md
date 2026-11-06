# 回归测试（tests/）

`tests/` 收编了项目开发期用过的 CDP 诊断脚本，并提供统一入口 `tests/run.js`：顺序执行、汇总每个
脚本的 pass/fail，任一失败以非零退出码结束。

## 前置条件

- **Node.js 18+**（推荐 22+）：脚本使用全局 `fetch` 与 `WebSocket`；低版本若报
  `WebSocket is not defined`，请升级到 Node 22+。`run.js` 用 `process.execPath` 调用脚本，
  不写死任何 node 路径。
- **本机 Chrome 或 Edge**：诊断脚本会启动一个无头浏览器。`run.js` 依次从
  环境变量（`XM_CHROME` / `CHROME_PATH` / `CHROME_BIN`）、常见安装位置、PATH 探测；
  找不到时给出清晰提示而不是崩溃。Chrome 不在标准位置时：
  ```bash
  XM_CHROME="/path/to/chrome" node tests/run.js
  ```
- **为何需要 CDP**：这些脚本通过 Chrome DevTools Protocol 直连无头浏览器，量化读取
  `document.styleSheets[].cssRules`、`getComputedStyle`、`getBoundingClientRect`。
  文件里「有这条规则」不等于浏览器「真的应用了」，CDP 探测比 grep 文本或截图更能判断
  「是否渲染 / 是否可见」（详见 `docs/deployment.md` 第 ③ 条）。

> 这些脚本是**只读诊断**：只访问线上博客前台页面做量化探测，不写博客园后台、
> 不重贴三个框、不做任何上线动作。

## 怎么跑

```bash
node tests/run.js                # 顺序跑全部套件并汇总
node tests/run.js --dry-run      # 只列套件与 Chrome 探测结果，不启动浏览器、不连线上
XM_CHROME=... node tests/run.js  # 指定浏览器路径
node tests/cdp-verify.js         # 也可单独跑某一个脚本
```

`--dry-run` 适合在没有浏览器 / 不想连线上时验证 runner 本身能否启动与汇总。

## 结果怎么看

- 每个套件打印 `PASS` / `FAIL`（按进程退出码判定，`0` 为 PASS），并附上该脚本 stdout 的最后几行。
- 末尾 `=== Summary ===` 给出 `N total, X passed, Y failed`；任一 FAIL，进程以 `1` 退出。
- 找不到 Chrome 时 runner 打印提示并以 `0` 退出（`0 run`），表示环境未就绪、不算测试失败。
- 各脚本会把详细结果写成同目录下的 `*-result.json`，这些文件已被 `.gitignore` 忽略，不要提交。
- 历史诊断结果保留在工作区外层的 `diagnostics/` 目录，未随本仓库收编。

## 已收编的套件

| 脚本 | 用途 |
|---|---|
| `cdp-verify.js` | `#header` sticky 与 CSS 规则是否真的被解析/应用 |
| `cdp-header.js` | 页头 DOM、计算样式、规则来源与滚动后 `is-stuck` 状态（只读） |
| `cdp-p0-verify.js` | P0 设计令牌、对比度、导航/头像/侧栏规则核对 |
| `cdp-p4-verify.js` | Phase 4 运行时全量核对（含移动端） |
| `cdp-p4-fixcheck.js` | 读取 `dist/custom.paste.css` 与 `dist/page-end.paste.html` 做修复核对 |

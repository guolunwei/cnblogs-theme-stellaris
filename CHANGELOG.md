# 更新日志

本文件记录「星轨 Stellaris」面向使用者的版本变更。格式参考 Keep a Changelog。

## [Unreleased]

### 计划中
- 将 `tests/` 下的诊断脚本改为统一读取 `XM_CHROME` 环境变量，进一步去掉内置默认路径。

## [0.2.1] - 2026-11-06

### 修复
- 修复自定义「光标特效」设置不生效的问题：页脚脚本里判断特效地址是否合法时用了带转义符的写法，
  生成可粘贴的 HTML 时转义符被吞掉，导致整段脚本出现语法错误，光标特效及其后的增强功能一并静默失效。
  现已改为不依赖转义符的纯前缀判断，判断结果不变，但产物不再有语法错误。
- 构建时新增内联脚本语法校验：每次生成页脚 HTML 都会逐段编译其中的脚本，
  一旦发现语法错误立即中止构建，避免同类问题再进入交付文件。
- 升级方式：只需重新复制 `dist/page-end.paste.html` 覆盖「页脚HTML代码」框；
  「页面定制CSS代码」与「页首HTML代码」两个框无需改动。

## [0.2.0] - 2026-11-05

第二批：可移植性、视觉精修与无障碍。

### 新增
- `src/adapter.js` 注册表补齐 `loading` / `codeBlocks` / `mainContent` / `tagList`；
  `src/enhance.js` 全部平台选择器改走 `XM_ADAPTER.pick()` / `pickAll()`，并实现逐组件降级矩阵。
- 配置归一化纯函数：`features.*` 六个开关、`debug` 日志开关、`selectors` 按 key 合并、非法值 fail-open。
- 12 个设计令牌与浅色两套重推；新增 `docs/components.md` / `docs/tokens.md` /
  `docs/assets/stellaris-mark.svg` / `docs/assets/og-cover.svg`。
- `dist/config.paste.html` 配置段快照；页首新增内联 SVG favicon（零外链）。
- 私有资源去私有化：百度统计 ID、`cursor-effects.js`、`mouse.ico` 光标从页脚 / `keep.css` 硬编码
  抽成 `window.XM.analyticsId` / `cursorEffects` / `cursorUrl` 三个配置项，统计**默认关闭**、
  注入器按合法性条件加载；`keep.css` 光标规则改为 `var(--xm-cursor, auto)`，默认值移到 `tokens.css`。
  换博客只需改配置段，不必再动 `dist/` 里的账号专属路径。

### 修复
- 灯箱改用原生 `<dialog>` + `showModal()`：修正焦点陷阱、Esc / 关闭按钮回焦、
  被 `<a>` 包裹的图片不再被吞掉链接、正文 img 内联 `cursor` 不再覆盖全局自定义光标。
- 触屏复制按钮常显，并修掉「不可见却能点」的幽灵热区；复制结果改由唯一
  `role="status"` live region 播报，失败不再误报「已复制」。
- `contentObs` 只观察 `childList` / `subtree`，不再触碰行号观察器的收敛策略。
- `applyAccent()` 改写实际被消费的 `--xm-glow-color`；`hexToRgba()` 兜底改品牌冷蓝。
- 浅色 `--xm-border-strong` 由 `#74869f` 改 `#5a6d85`（旧值在新底色上仅 2.97:1）；
  语义层 16 处硬编码色值全部令牌化。

## [0.1.0] - 2026-11-05

首个开源工程地基版本。

### 新增
- 规范仓库结构：`examples/`（预览产物）、`docs/`、`tests/`；新增 `.gitignore`、MIT `LICENSE`、
  本文件与 `CONTRIBUTING.md`。
- 面向他人使用的 `README.md`：一句话定位、三步安装、`window.XM` 配置表、换肤、验收、License、致谢。
- 选择器适配层 `src/adapter.js`：`XM_SELECTORS` 注册表（按皮肤/骨架分组、候选数组）与 `pick(key)`；
  通过 `window.XM_ADAPTER` 全局暴露。
- `build.js`：新增 `JS_ORDER = ["adapter.js", "enhance.js"]` 顺序拼接，并对**每个** JS 源文件做
  `</script` 构建期检测；支持 `XM_BUILD_OUT` / `--out=` 输出到临时目录做 dry-run。
- `dist/config.paste.html`：配置段独立快照（文档/单独复制用，**不是第四个粘贴框**）。
- 文档：`docs/deployment.md`（部署踩坑五条）、`docs/adapter.md`、`docs/configuration.md`。
- `tests/` 一键回归：从 `diagnostics/` 复制 5 个 CDP 诊断脚本 + `tests/run.js` 汇总入口 + `tests/README.md`。

### 说明
- 本批为工程地基，**未改动** `src/*.css` 任何视觉值与 `src/enhance.js` 的灯箱/复制/TOC 逻辑。
- `dist/custom.paste.css`、`dist/page-end.paste.html`、`dist/custom.css` 保持线上现有字节不变；
  `build.js` 的改动以临时目录 dry-run 验证，未覆盖现有产物。

# 更新日志

本文件记录「星轨 Stellaris」面向使用者的版本变更。格式参考 Keep a Changelog。

## [Unreleased]

### 变更 —— 视觉方向重制（Linear 式工程极简）
- 设计令牌整体重算：画布 `#08090a`、表面 `#0f1011`、发丝线 `#1c1e21`、文字 `#f7f8f8 / #b4bcc6 / #8a8f98`；强调色收敛为单一靛蓝 `#8b93ff`（浅色 `#5e6ad2`）。取消冷蓝/暖金双色分工，删除全部渐变、发光与卡片投影（`--xm-shadow-card` 归零）。
- 布局：页头收为 56px 吸顶工具条；`--xm-sidebar-w` 300→264；卡片圆角 12→10、按钮与输入 8→6；正文 15px/1.75；页脚上边距 72→56。
- 首页卡片去特效：删除顶部扫光、左侧竖条、hover 位移与阴影，只保留描边提亮；摘要 3 行→2 行；新增 `.xm-more` 行「阅读全文 →」，不再被 `-webkit-line-clamp` 裁掉。
- 侧栏由「卡片 + 裸列表」混排改为统一发丝线分区，标题统一为等宽 11px 小标签；日历重排（今日 pill、周末弱化、行高收紧）；搜索框补 placeholder，输入框与按钮同一行。
- 文章页拍平 `#topics > #cnblogs_post_body` 双层卡片；表格改横线制；引用块改 2px 竖线 + 浅底；代码块 mac 三点改中性灰并补回被 `pre code { padding: 0 }` 清零的 `padding-top`；AIGC 标识压成 15px 灰度。
- 新增 `enhance.js` 文本整理（`features.metaText`，默认开）：去掉 `posted @` 与括号计数、`2026年11月9日`→`2026.11.09`、摘要前缀「摘要：」、把「阅读全文」移出摘要、清理空侧栏模块、补搜索 placeholder、给表格套横向滚动容器、整理作者卡与列表元信息。
- 深浅两态对比度复算（四级底色取最差值）：正文 16.73 / 17.95、次要 9.28 / 8.69、弱文字 5.48 / 4.48、链接 6.54 / 5.75、UI 边界 3.58 / 4.48、主按钮 4.70 / 6.38，全部达标。
- 清理重制后的死令牌：删除 `--xm-grad-end`、`--xm-shadow-color`、`--xm-shadow-card-hover`、`--xm-star-dot`、`--xm-star-dot-light`、`--xm-ambient-warm`、`--xm-z-nav`、`--xm-ease-spring`；新增 `--xm-code-dot-1/2/3` 承接代码块 mac 三点，语义层色值字面量归零。
- 品牌图形同步改单色系：favicon（`build.js` 模板常量）、`docs/assets/stellaris-mark.svg`、`docs/assets/og-cover.svg` 去掉星芒与暖金节点，改为「轨道环 + 中心节点」的靛蓝两级灰阶。
- 文档与实现对齐：重写 `docs/visual-spec.md`（Linear 方向规范，含删除清单）、`docs/tokens.md`（实测对比度 + 令牌自检口径）；修正 `docs/components.md` 中对已删元素（2px 轨道段、星点、`warm` 色调）的描述，并如实标注 `data-xm-variant/size/tone/density` 尚未被消费。

## [0.3.0] - 2026-11-09（未发布）

### 新增
- 第二种安装方式「精简版」：CSS 仍整框内联（`dist/custom.paste.css`），页脚改贴
  `dist/page-end.cdn.paste.html`（约 2 KB）——`window.XM` 配置段与两个条件注入器内联，
  增强主脚本以同步外链引用 jsDelivr 上的 `dist/stellaris.js`。
- 新增产物 `dist/stellaris.js`：`src/adapter.js` + `src/enhance.js` 拼接（约 50KB），
  供 `https://cdn.jsdelivr.net/gh/guolunwei/cnblogs-theme-stellaris@main/dist/stellaris.js` 外链；
  仓库当前无 tag，URL 用 `@main`。
- 两种装法并存：精简版（改配置 / 升级只动页脚几行，依赖 jsDelivr 可用性）与完整离线版
  （零外部请求、断网可用，升级需整框重贴）；README、`docs/deployment.md`、
  `docs/configuration.md`、`CONTRIBUTING.md` 同步说明。
- 原三框整框产物字节不变：`dist/custom.paste.css`(40636 B) /
  `dist/page-begin.paste.html`(717 B) / `dist/page-end.paste.html`(44749 B)。

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

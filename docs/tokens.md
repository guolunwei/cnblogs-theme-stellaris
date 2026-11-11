# 设计令牌（src/tokens.css）

> shadcn 三层中的 **L1 Token 层**：颜色 / 字体 / 间距 / 圆角 / 描边 / 动效 / 层级 / 断点 / 布局的**唯一真源**。
> 五层 CSS 顺序固定 `keep → tokens → base → layout → components`；改一份 `tokens.css` 即可整体换肤，
> 不需要碰其它 CSS 或 JS。**`src/keep.css` 除光标行外整块冻结**：唯一解冻的是 `*{cursor:var(--xm-cursor,auto)}`，
> 它通过本文件的 `--xm-cursor` 取值（级联与顺序无关），详见 §7；spinner / `#loading` / `z-index` 仍原样冻结。

## 0. 自定义入口

- **整体换肤**：改本文件 `:root` 深色值 + 两套浅色覆写值，然后 `node build.js` 重建 `dist/`。
- **轻量换肤**：改页脚 `window.XM.accent`（主色）、`theme`（三态）、`logo`（头像），保存即生效，
  不用重新构建、不用重贴 CSS。见 `docs/configuration.md`。

## 1. 深色 `:root`（默认形态）

| 类别 | 变量 | 值 |
|---|---|---|
| 画布 | `--xm-bg` / `--xm-bg-elevated` | `#0f151d` / `#141c25` |
| 表面 | `--xm-surface` / `--xm-surface-hover` | `#18212c` / `#1f2a36` |
| 发丝线 | `--xm-border` / `--xm-border-strong` | `#26313e` / `#74869f` |
| 文字 | `--xm-text` / `--xm-text-secondary` / `--xm-text-muted` | `#e7eef7` / `#a9b8ca` / `#8b9bb0` |
| 强调 | `--xm-accent` / `--xm-accent-2` / `--xm-accent-deep` / `--xm-accent-contrast` | `#5fb2ff` / `#f0c987` / `#1f6fd0` / `#08131f` |
| 强调派生 | `--xm-accent-soft` / `--xm-accent-text` / `--xm-grad-end` | `rgba(95,178,255,.14)` / `#5fb2ff` / `#f0c987` |
| 代码 | `--xm-code-bg` / `--xm-code-border` | `#0b1118` / `#222d3a` |
| 效果 | `--xm-selection` / `--xm-shadow-color` / `--xm-glow-color` / `--xm-glow-accent` | `rgba(95,178,255,.26)` / `rgba(0,0,0,.55)` / `rgba(95,178,255,.22)` / 组合值 |
| 字体 | `--xm-font-sans` / `--xm-font-mono` | 见 §5 |
| 字级 | `--xm-fs-display…caption` | 18 / 28 / 22 / 17 / 15.5 / 13.5 / 12 px |
| 行高 | `--xm-lh-display…caption` | 1.15 / 1.25 / 1.35 / 1.45 / 1.75 / 1.6 / 1.5 |
| 间距 | `--xm-s1…s18` | 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 56 / 72 px |
| 圆角 | `--xm-r-card` / `--xm-r-button` / `--xm-r-input` / `--xm-r-chip` / `--xm-r-code` | 12 / 8 / 8 / 999 / 8 px |
| 描边 | `--xm-bw` / `--xm-bw-focus` | 1 / 2 px |
| 动效 | `--xm-dur-fast` / `--xm-dur` / `--xm-dur-slow` / `--xm-ease` / `--xm-ease-spring` | 160 / 220 / 380 ms + 两条 cubic-bezier |
| 层级 | `--xm-z-base…xm-z-fab` | 0 / 20 / 50 / 100 / 1000 / 1100 |
| 断点 | `--xm-bp-sm…xl` | 640 / 900 / 1200 / 1440 px（媒体条件本身硬编码，不支持 `var()`） |
| 布局 | `--xm-page-w` / `--xm-sidebar-w` | 1180 / 300 px |

> `--xm-content-w:760px` 已删除：宽度由 `--xm-page-w − --xm-sidebar-w` 与 grid 决定，
> 一个「改了没反应」的变量正是本批要清除的同类破口。

## 2. 第二批新增的 12 个 token（只 `:root` 定义一次）

| token | 值 | 用途 |
|---|---|---|
| `--xm-ambient-warm` | `rgba(240,201,135,.13)` | `body::before` 暖金柔光；**允许**浅色两套覆写为 `.09` |
| `--xm-star-dot` | `rgba(255,255,255,.07)` | 深色星点（由 `base.css` 引用） |
| `--xm-star-dot-light` | `rgba(22,32,43,.075)` | 浅色星点（由 `base.css` 引用） |
| `--xm-code-block-bg` | `#0b1118` | 代码块底色（跨模式常量） |
| `--xm-code-block-fg` | `#dce6f2` | 代码块前景（跨模式常量） |
| `--xm-code-ln-fg` | `rgba(139,155,176,.72)` | 行号槽 / hljs 行号列（跨模式常量） |
| `--xm-code-copy-bg` | `rgba(11,17,24,.72)` | 复制按钮底（跨模式常量） |
| `--xm-code-copy-border` | `rgba(116,134,159,.45)` | 复制按钮边（跨模式常量） |
| `--xm-code-copy-fg` | `#cdd9e8` | 复制按钮字（跨模式常量） |
| `--xm-code-copy-done` | `#7ee0a6` | 复制成功字（跨模式常量） |
| `--xm-code-copy-done-border` | `rgba(126,224,166,.6)` | 复制成功边（跨模式常量） |
| `--xm-lightbox-scrim` | `rgba(6,10,15,.86)` | 灯箱遮罩（跨模式常量） |

**跨模式常量规则**：`code-block / code-copy / code-ln-fg / lightbox-scrim` 只 `:root` 一次定义，
**两套浅色覆写块禁止重新定义**。原因：代码块在浅色模式下仍固定深色（`components.css` 既定意图），
若在浅色块覆写会把代码区刷白、对比度崩塌。`#dce6f2` on `#0b1118` = 15.03:1、
`#cdd9e8` = 13.26:1、`#7ee0a6` = 11.83:1，均达标。

`--xm-star-dot*` 也只 `:root` 定义，由 `base.css` 的暗/亮两条规则分别引用（不在浅色块覆写变量本身）。

语义层（`base.css` / `layout.css` / `components.css`）**不得出现任何色值字面量**，
只允许 `var(--xm-*)` 与 `color-mix(in srgb, var(--xm-bg-elevated) 78%, transparent)` 这类令牌派生。

## 3. 浅色两套（逐项一致）

两套分别为 `@media (prefers-color-scheme: light) :root:not([data-theme="dark"])`（跟随系统）
与 `html[data-theme="light"]`（手动指定，优先级最高）。**必须逐项一致**，否则手动切换会跳色。

| 变量 | 深色 | 浅色 |
|---|---|---|
| `--xm-bg` | `#0f151d` | `#e7edf5` |
| `--xm-bg-elevated` | `#141c25` | `#f2f6fb` |
| `--xm-surface` | `#18212c` | `#ffffff` |
| `--xm-surface-hover` | `#1f2a36` | `#dde7f3` |
| `--xm-border` | `#26313e` | `#cdd9e8` |
| `--xm-border-strong` | `#74869f` | **`#5a6d85`** |
| `--xm-text` | `#e7eef7` | `#101b28` |
| `--xm-text-secondary` | `#a9b8ca` | `#3f5165` |
| `--xm-text-muted` | `#8b9bb0` | `#4d5f74` |
| `--xm-accent` | `#5fb2ff` | `#1668d8` |
| `--xm-accent-2` | `#f0c987` | `#8a4f0c` |
| `--xm-accent-deep` | `#1f6fd0` | `#0f4fa8` |
| `--xm-accent-contrast` | `#08131f` | `#ffffff` |
| `--xm-accent-soft` | `rgba(95,178,255,.14)` | `rgba(22,104,216,.1)` |
| `--xm-accent-text` | `#5fb2ff` | `#0f4fa8` |
| `--xm-grad-end` | `#f0c987` | **`#8f5210`** |
| `--xm-code-bg` | `#0b1118` | `#eef3fa` |
| `--xm-code-border` | `#222d3a` | `#cdd9e8` |
| `--xm-selection` | `rgba(95,178,255,.26)` | `rgba(22,104,216,.16)` |
| `--xm-shadow-color` | `rgba(0,0,0,.55)` | `rgba(22,52,88,.14)` |
| `--xm-glow-color` | `rgba(95,178,255,.22)` | `rgba(22,104,216,.14)` |
| `--xm-ambient-warm` | `rgba(240,201,135,.13)` | `rgba(240,201,135,.09)` |

**两处关键修正**：

- `--xm-border-strong`：旧 `#74869f` 是按深色四底色定的；在新浅色四底色上实测
  `[3.15, 3.42, 3.71, 2.97]`，在 `surface-hover` 上 2.97:1 破 3:1 线。改 `#5a6d85` 后
  `[4.50, 4.89, 5.30, 4.24]`。深色块保持 `#74869f` 不动。
- `--xm-grad-end`：旧浅色 `#0f4fa8` 与 `accent #1668d8` 色相差仅 0.3°（蓝→蓝，冷暖分工被抹平）；
  新值 `#8f5210` 色相差 176.5°，与深色 171.2° 等价。亮面暖色用深琥珀而非亮金
  （`#f0c987` 在白底对比度不足），这就是「非镜像」的浅色独立设计。

四级背景阶梯全不相等，`bg-elevated ↔ surface` 从「完全塌陷」变为 1.085:1 可辨。

## 4. 对比度（四底色 × 前景，取最差值）

| 底色 | 正文 | 次要 | 弱文字 | 链接 | 暖色/渐变终点 | UI 边界 | 主按钮 |
|---|---|---|---|---|---|---|---|
| 深色 | 12.46 | 7.21 | 5.14 | 6.45 | — | 3.92 | 8.28 |
| 浅色（新） | 13.89 | 6.52 | 5.24 | 6.21 | 5.24 / 4.97 | 4.24 | 5.24 |

门槛：文字 ≥4.5:1、UI 边界 ≥3:1，全部达标。`--xm-border` 1.34:1 属纯装饰发丝线，不设门槛。
标题改为纯色 `var(--xm-text)`，不再使用文字渐变。删除渐变时必须显式重置 `-webkit-text-fill-color: currentColor`，否则继承的透明填充会让整行标题不可见。
代码块按 `#0b1118` 固定深色单独自检（见 §2）。

## 5. 字体与 ≤640px 字号阶梯

`--xm-font-mono` 在拉丁等宽之后、`monospace` 之前插入中文回退：
`"Sarasa Mono SC","Noto Sans Mono CJK SC","Source Han Mono SC","PingFang SC","Microsoft YaHei"`。
即使这些族名在目标机器全部缺失，仍有 `monospace` 兜底，无回归风险。

≤640px 断点（`layout.css`）在 `--xm-fs-display/h1/h2/body` 之外补齐
`--xm-fs-h3:16px`、`--xm-fs-small:13px`、`--xm-lh-body:1.7`；
**`--xm-fs-caption` 保持 12px 可读下限**，不下调。移动端 `--xm-fs-display` 覆写为 16px。

## 6. `window.XM.accent` 的覆盖边界

`applyAccent()` 合法时**只写四项**：`--xm-accent`、`--xm-accent-text`、
`--xm-accent-soft`、`--xm-glow-color`（第二步把孤儿变量 `--xm-glow` 改成了真正被消费的
`--xm-glow-color`；失败兜底由青绿 `rgba(94,234,212,…)` 改为品牌冷蓝 `rgba(95,178,255,…)`）。

**刻意不被 `XM.accent` 覆盖**（避免实现方误判为遗漏）：

`--xm-accent-2`、`--xm-grad-end`、`--xm-accent-deep`、`--xm-selection`、`--xm-glow-accent`。

理由：暖金是「管人」的品牌常量，冷蓝才是可换的「管技术」主色；用户改主色不应让品牌符号、
渐变终点、选中态与暖金一起失色。

## 7. `--xm-cursor`（自定义光标）

`:root` 新增 `--xm-cursor: url(".../mouse.ico"), auto;`，是 `src/keep.css:11`
`*{ cursor:var(--xm-cursor, auto);}` 的默认值来源。CSS 自定义属性走级联解析，
与五层 CSS 的书写顺序无关，所以 `keep.css` 排第一也能读到 `:root` 里的值。

- **默认值来源**：仍指向原作者博客 `/home/` 路径下的 `mouse.ico`，保证线上光标体验不变。
  它是**唯一**被解冻的 `keep.css` 行——其余 spinner / `#loading` / `z-index:99999999` 原样冻结。
- **如何替换**（任选其一，都不用动 `keep.css`）：
  1. 改 `--xm-cursor`：直接改本文件 `:root` 的默认值，再 `node build.js` 重建 `dist/` 重贴 CSS；
  2. 改 `window.XM.cursorUrl`：在页脚配置段填合法 `http(s)://` 或 `data:image/` URL，
     `enhance.js` 运行时写 `documentElement` 内联 `--xm-cursor`，优先级高于这里（见 `docs/configuration.md`）。
  3. 想彻底关闭自定义光标、只用系统指针：把本文件 `:root` 的 `--xm-cursor` 直接写成
     `auto`（或任意合法 `cursor` 值）即可，无需动冻结的 `keep.css`。
- `cursorUrl` 的值禁止含 `"` / `;` / `}`，因为会被拼进 `url("...")` 交给 `setProperty`。

## 8. 品牌图形色值契约

`docs/assets/stellaris-mark.svg` 是唯一几何真源（三图元：冷蓝轨道描边 + 冷蓝四角星芒 + 暖金节点），
刻意使用品牌原色 `#5FB2FF` / `#F0C987`，**不跟随 `window.XM.accent`**。

品牌级变更需**同步改三处**：① SVG 文件、② `build.js` spinner 模板常量里的 favicon data URI、
③ `docs/assets/og-cover.svg`。三处都是字面量，不参与令牌派生。

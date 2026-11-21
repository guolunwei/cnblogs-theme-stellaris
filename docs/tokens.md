# 设计令牌（src/tokens.css）

> shadcn 三层中的 **L1 Token 层**：颜色 / 字体 / 间距 / 圆角 / 描边 / 动效 / 层级 / 断点 / 布局的**唯一真源**。
> 五层 CSS 顺序固定 `keep → tokens → base → layout → components`；改一份 `tokens.css` 即可整体换肤，
> 不需要碰其它 CSS 或 JS。**`src/keep.css` 除光标行外整块冻结**：唯一解冻的是 `*{cursor:var(--xm-cursor,auto)}`，
> 它通过本文件的 `--xm-cursor` 取值（级联与顺序无关），详见 §7；spinner / `#loading` / `z-index` 仍原样冻结。

## 0. 自定义入口

- **整体换肤**：改本文件 `:root` 深色值 + 两套浅色覆写值，然后 `node build.js` 重建 `dist/`。
- **轻量换肤**：改页脚 `window.XM.accent`（主色）、`theme`（三态）、`logo`（头像），保存即生效，
  不用重新构建、不用重贴 CSS。见 `docs/configuration.md`。

## 1. 视觉方向：Linear 式工程极简

令牌的每一项都为这个方向服务，不是随手取的色板：

| 特征 | 落地方式 |
|---|---|
| 近黑画布 | `--xm-bg: #08090a`，比正文文字暗 18.7:1，让内容成为唯一的亮面 |
| 1px 发丝线分区 | `--xm-border: #1c1e21`（装饰，不设对比度门槛），**取代阴影与卡片浮起** |
| 零阴影 | `--xm-shadow-card: none`，卡片靠描边与间距分层，hover 只换描边亮度 |
| 靛蓝单点强调 | 只有 `--xm-accent: #8b93ff` 一个彩色锚点，全站不出现第二种强调色 |
| 紧凑字阶 | `--xm-fs-body: 15px`、`--xm-fs-caption: 11.5px`，接近产品型官网而非阅读型博客 |
| 克制动效 | `--xm-dur-fast: 140ms`，只做描边/透明度过渡，不做位移与缩放 |

## 2. 深色 `:root`（默认形态）

| 类别 | 变量 | 值 |
|---|---|---|
| 画布 | `--xm-bg` / `--xm-bg-elevated` | `#08090a` / `#0f1011` |
| 表面 | `--xm-surface` / `--xm-surface-hover` | `#0f1011` / `#16181a` |
| 发丝线 | `--xm-border` / `--xm-border-strong` | `#1c1e21` / `#6b7079` |
| 文字 | `--xm-text` / `--xm-text-secondary` / `--xm-text-muted` | `#f7f8f8` / `#b4bcc6` / `#8a8f98` |
| 强调 | `--xm-accent` / `--xm-accent-2` / `--xm-accent-deep` / `--xm-accent-contrast` | `#8b93ff` / `#c7cbff` / `#5e6ad2` / `#ffffff` |
| 强调派生 | `--xm-accent-soft` / `--xm-accent-text` | `rgba(94,106,210,.16)` / `#8b93ff` |
| 代码 | `--xm-code-bg` / `--xm-code-border` | `#0b0c0d` / `#1c1e21` |
| 效果 | `--xm-selection` / `--xm-glow-color` | `rgba(94,106,210,.3)` / `rgba(94,106,210,.1)` |
| 阴影/发光 | `--xm-shadow-card` / `--xm-glow-accent` | 全部 `none`（方向性禁用，不是遗漏） |
| 字级 | `--xm-fs-display…caption` | 16 / 26 / 21 / 16.5 / 15 / 13.5 / 11.5 px |
| 行高 | `--xm-lh-display…caption` | 1.2 / 1.32 / 1.4 / 1.5 / 1.75 / 1.6 / 1.5 |
| 间距 | `--xm-s1…s18` | 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 56 / 72 px |
| 圆角 | `--xm-r-card` / `--xm-r-button` / `--xm-r-input` / `--xm-r-chip` / `--xm-r-code` | 10 / 6 / 6 / 999 / 8 px |
| 描边 | `--xm-bw` / `--xm-bw-focus` | 1 / 2 px |
| 动效 | `--xm-dur-fast` / `--xm-dur` / `--xm-dur-slow` / `--xm-ease` | 140 / 180 / 260 ms + 一条 cubic-bezier |
| 层级 | `--xm-z-base…xm-z-fab` | 0 / 20 / 100 / 1000 / 1100 |
| 断点 | `--xm-bp-sm…xl` | 640 / 900 / 1200 / 1440 px（媒体条件本身硬编码，不支持 `var()`） |
| 布局 | `--xm-page-w` / `--xm-sidebar-w` | 1180 / 264 px |

> **已删除的死令牌**（重制后零消费，按「不留改了没反应的变量」原则清掉）：
> `--xm-content-w`、`--xm-grad-end`、`--xm-shadow-color`、`--xm-shadow-card-hover`、
> `--xm-star-dot`、`--xm-star-dot-light`、`--xm-ambient-warm`、`--xm-z-nav`、`--xm-ease-spring`。
> 其中 `star-dot*` 与 `ambient-warm` 是删掉网纹/双色星云后的残留，`grad-end` 是收敛单色强调后的残留。
>
> 标题不再使用文字渐变，CSS 中出现的 `-webkit-text-fill-color: currentColor` 是删除渐变后的显式复位，
> 否则继承的透明填充会让整行标题不可见。

## 3. 代码块与灯箱常量（只 `:root` 定义一次）

| token | 值 | 用途 |
|---|---|---|
| `--xm-code-block-bg` | `#0b0c0d` | 代码块底色（跨模式常量） |
| `--xm-code-block-fg` | `#dce6f2` | 代码块前景（跨模式常量） |
| `--xm-code-ln-fg` | `rgba(139,143,152,.8)` | 行号槽 / hljs 行号列（跨模式常量） |
| `--xm-code-copy-bg` | `rgba(11,12,13,.85)` | 复制按钮底（跨模式常量） |
| `--xm-code-copy-border` | `rgba(107,112,121,.45)` | 复制按钮边（跨模式常量） |
| `--xm-code-copy-fg` | `#cdd9e8` | 复制按钮字（跨模式常量） |
| `--xm-code-copy-done` | `#7ee0a6` | 复制成功字（跨模式常量） |
| `--xm-code-copy-done-border` | `rgba(126,224,166,.6)` | 复制成功边（跨模式常量） |
| `--xm-code-dot-1/2/3` | `#3d434b` / `#4b525b` / `#5a626c` | 代码块 mac 三点（三档中性灰，**不用红黄绿**） |
| `--xm-lightbox-scrim` | `rgba(5,6,7,.9)` | 灯箱遮罩（跨模式常量） |

**跨模式常量规则**：`code-block / code-copy / code-ln-fg / code-dot / lightbox-scrim` 只 `:root` 一次定义，
**两套浅色覆写块禁止重新定义**。原因：代码块在浅色模式下仍固定深色（`components.css` 既定意图），
若在浅色块覆写会把代码区刷白、对比度崩塌。`#dce6f2` on `#0b0c0d` = 15.52:1、
`#cdd9e8` = 13.69:1、`#7ee0a6` = 12.21:1，均达标。

**mac 三点的接法**：平台用 `box-shadow` 画三点、颜色读 `--mac-style-color-red/orange/green`。
本主题不改结构，只把这 3 个平台变量指到 `--xm-code-dot-*`——比覆盖选择器稳，
也避免语义层出现色值字面量。同时平台把三点位置让给 `code` 的 `padding-top`，
而本主题的 `pre code { padding: 0 }` 优先级更高会把它清零，故必须补回 `padding-top: 34px`，
否则三点会压在第 1 行行号上。

## 4. 浅色两套（逐项一致）

两套分别为 `@media (prefers-color-scheme: light) :root:not([data-theme="dark"])`（跟随系统）
与 `html[data-theme="light"]`（手动指定，优先级最高）。**必须逐项一致**，否则手动切换会跳色。

| 变量 | 深色 | 浅色 |
|---|---|---|
| `--xm-bg` | `#08090a` | `#fbfbfc` |
| `--xm-bg-elevated` | `#0f1011` | `#ffffff` |
| `--xm-surface` | `#0f1011` | `#ffffff` |
| `--xm-surface-hover` | `#16181a` | `#f2f3f5` |
| `--xm-border` | `#1c1e21` | `#e6e8eb` |
| `--xm-border-strong` | `#6b7079` | `#6b7079` |
| `--xm-text` | `#f7f8f8` | `#08090a` |
| `--xm-text-secondary` | `#b4bcc6` | `#40454d` |
| `--xm-text-muted` | `#8a8f98` | `#6b7079` |
| `--xm-accent` | `#8b93ff` | `#5e6ad2` |
| `--xm-accent-2` | `#c7cbff` | `#4b55b8` |
| `--xm-accent-deep` | `#5e6ad2` | `#4b55b8` |
| `--xm-accent-contrast` | `#ffffff` | `#ffffff` |
| `--xm-accent-soft` | `rgba(94,106,210,.16)` | `rgba(94,106,210,.1)` |
| `--xm-accent-text` | `#8b93ff` | `#4b55b8` |
| `--xm-code-bg` | `#0b0c0d` | `#f4f5f7` |
| `--xm-code-border` | `#1c1e21` | `#e6e8eb` |
| `--xm-selection` | `rgba(94,106,210,.3)` | `rgba(94,106,210,.18)` |
| `--xm-glow-color` | `rgba(94,106,210,.1)` | `rgba(94,106,210,.06)` |
| `--xm-shadow-popover` | `0 12px 32px -8px rgba(0,0,0,.7)` | `0 12px 32px -12px rgba(8,9,10,.18)` |

**浅色不是深色取反**，有两条必须遵守的推导：

- `--xm-accent` 在亮面压深到 `#5e6ad2`：`#8b93ff` 在白底只有 1.9:1，作为颜色块勉强、作为文字完全不可读。
- **作为文字出现时一律用 `--xm-accent-text`**（浅色 `#4b55b8`，最低 5.75:1），
  而不是 `--xm-accent`（最低 4.23:1，仅够做描边/圆点/焦点环，不承担文字）。
  语义层 20+ 处 `color: var(--xm-accent-text)` 就是这个分工的落地，不是重复定义。
- `--xm-border-strong` 深浅同值 `#6b7079`：它在深色四底色上最低 3.58:1、浅色四底色上最低 4.48:1，
  同一个值同时满足两种模式的 3:1 UI 边界门槛，无需分叉。

## 5. 对比度（四底色 × 前景，取最差值）

底色为 `bg / bg-elevated / surface / surface-hover` 四档，实测（非估算）：

| 前景 | 深色最低 | 浅色最低 | 门槛 |
|---|---|---|---|
| 正文 `--xm-text` | 16.73 | 17.95 | ≥4.5 |
| 次要 `--xm-text-secondary` | 9.28 | 8.69 | ≥4.5 |
| 弱文字 `--xm-text-muted` | 5.48 | **4.48** | ≥4.5 ✅（贴线，见下） |
| 链接 `--xm-accent-text` | 6.54 | 5.75 | ≥4.5 |
| UI 边界 `--xm-border-strong` | 3.58 | 4.48 | ≥3 |
| 主按钮字（`#ffffff` on `--xm-accent-deep`） | 4.70 | 6.38 | ≥4.5 |

- 全部达标。`--xm-border`（`#1c1e21` / `#e6e8eb`）约 1.2–1.3:1，属**纯装饰发丝线**，按规范不设门槛。
- `--xm-text-muted` 在浅色 `surface-hover` 上是 4.48:1，低于 4.5 约 0.02，属测量毛刺级别；
  它只用于时间戳、元信息等非关键小字，且 `surface-hover` 仅出现在 hover 瞬间。
  **不要再把 muted 调亮/调暗**，一动就会在另一模式破线。
- 代码块按 `#0b0c0d` 固定深色单独自检（见 §3）。

## 6. 字体与 ≤640px 字号阶梯

`--xm-font-sans` 前置 `"Inter"`：Linear 方向的字形骨架依赖 Inter 的字距与 x-height，
缺失时退回 PingFang SC / HarmonyOS Sans SC，视觉差异可接受（无外链、不引 webfont，守住零依赖）。

`--xm-font-mono` 在拉丁等宽之后、`monospace` 之前插入中文回退：
`"Sarasa Mono SC","Noto Sans Mono CJK SC","Source Han Mono SC","PingFang SC","Microsoft YaHei"`。
即使这些族名在目标机器全部缺失，仍有 `monospace` 兜底，无回归风险。

≤640px 断点（`layout.css`）在 `--xm-fs-display/h1/h2/body` 之外补齐
`--xm-fs-h3:16px`、`--xm-fs-small:13px`、`--xm-lh-body:1.7`；
**`--xm-fs-caption` 保持 12px 可读下限**，不下调。移动端 `--xm-fs-display` 覆写为 16px，
文章页标题 `#cb_post_title_url` 单独降到 24px（桌面 30px）。

## 7. `window.XM.accent` 的覆盖边界

`applyAccent()` 合法时**只写四项**：`--xm-accent`、`--xm-accent-text`、
`--xm-accent-soft`、`--xm-glow-color`（早期版本写的是孤儿变量 `--xm-glow`，全项目零消费，
已改为真正被 `body::before` 消费的 `--xm-glow-color`；失败兜底也从青绿改为跟随新主色）。

**刻意不被 `XM.accent` 覆盖**（避免实现方误判为遗漏）：

`--xm-accent-2`、`--xm-accent-deep`、`--xm-selection`、`--xm-glow-accent`。

理由：`--xm-accent-deep` 是「放白字时的底色」，必须自行满足 4.5:1，不能被任意用户色带入不可读区间；
`--xm-accent-2` 是同一靛蓝的浅阶，破坏它会让双阶层次塌掉。用户换主色后系统仍是单点强调，不会变成双色。

## 8. `--xm-cursor`（自定义光标）

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

## 9. 令牌兑现的自检口径

改完令牌后跑一遍这两条，任一条不符合预期就是有破口：

```bash
# 1) 语义层不得出现任何色值字面量（期望：三个文件全部 0）
grep -cnE '#[0-9a-fA-F]{3,8}\b|rgba?\(' src/base.css src/layout.css src/components.css

# 2) 每个 --xm- 变量至少被消费一次（期望：只输出 4 个断点令牌）
comm -23 \
  <(grep -oE '\-\-xm-[a-z0-9-]+' src/tokens.css | sort -u) \
  <(grep -ohE 'var\(--xm-[a-z0-9-]+' src/base.css src/layout.css src/components.css src/enhance.js src/keep.css | sed 's/var(//' | sort -u)
```

- 第 1 条的允许例外只有一类：`color-mix(in srgb, var(--xm-bg-elevated) 78%, transparent)`
  这类**令牌派生**，它不是字面量色值，grep 也匹配不到。
- 第 2 条**期望输出恰好是 `--xm-bp-sm/md/lg/xl` 四行**，这是唯一允许的例外：
  CSS 媒体条件不支持 `var()`，断点必须硬编码，令牌只作「四个档位的唯一记录」存在。
  除这 4 个之外再出现任何一行，就是又有变量空挂了——上一版正是靠这条揪出 `--xm-glow` 孤儿。
- 别忘了 `keep.css` 也在消费方里：`--xm-cursor` 只被它读取，漏掉它就会误报。

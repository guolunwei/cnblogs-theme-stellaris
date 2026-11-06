# 星轨 Stellaris · 视觉精修规范（第二批实现依据）

> 由视觉设计侧产出、主理人汇编并裁决。只读规范，未改文件。
> 所有对比度按 WCAG 相对亮度公式在四种底色上逐一复算。
> 本文件是第二批代码改动的唯一视觉依据；验收断言见 `qa-checklist.md`。

## 0. 主理人裁决（5 项待裁决，已拍板）

| # | 议题 | 裁决 | 理由 |
|---|---|---|---|
| 1 | `--xm-content-w:760px` 零消费 | **删除** | 宽度由 `--xm-page-w − --xm-sidebar-w` 与 grid 决定，插不进固定 760px。留一个「改了没反应」的变量正是本批要修的同类破口。不引入 `--xm-measure:68ch`（会让正文右缘与全宽表格/代码块不齐） |
| 2 | 页头 8px 品牌节点是否算「冗余第三焦点」 | **采纳，但按「拆进既有第一焦点」方案** | 不新增独立 DOM / 图形框 / 并列徽标，只是既有 `#blogTitle h1` 下划线末端一个 8px 点，复用已有元素。与项目铁律禁止的「页头 logo 空位造圆盘」不是同一件事。实现后若目视抢焦点，退化为「符号仅落 favicon + og-cover」 |
| 3 | og-cover 是否提交一次性 PNG | **只提交 `docs/assets/og-cover.svg`，不提交 PNG** | 保持零二进制产物、不进构建链。GitHub Social preview 上传由仓库所有者手工做，README 写一句说明即可 |
| 4 | `applyAccent()` 孤儿变量是否本批修 | **纳入** | 属令牌兑现，与「改一份 tokens.css 换肤」直接相关 |
| 5 | TOC 与灯箱互斥是否补 JS | **不单独补** | 灯箱改用原生 `<dialog>.showModal()` 后背景自动 inert；体验规范 A14 的守卫防止误关目录，两者已覆盖，不需要额外互斥逻辑 |

**另有一处规范冲突裁定**：视觉规范说「既有中文注释不主动翻译」，体验规范说「被改动函数内原有中文注释顺手英文化」。
**按视觉规范执行** —— 只保证新增/改写部分英文，不主动翻译既有中文注释，避免大 diff、零视觉收益。

**dist 红线更新**：第一批禁止重建 dist 的红线，在第二批**解除**。
第二批允许 `node build.js` 重建 dist，但报告中必须列出「重贴哪几个框」的部署清单；**线上后台仍由用户自己操作，任何人不得代贴**。

## 1. 铁律

- `src/keep.css` 整块冻结（`mouse.ico` 光标、3D spinner、`#loading` 的 `z-index:99999999`）。
- 百度统计与 `cursor-effects.js` 引用保持原样；SimpleMemory 皮肤前提不变；三框粘贴形态不变。
- 五层 CSS 顺序 `keep → tokens → base → layout → components` 不变。
- 不引图片外链、不新增 npm 依赖、不新增打包器、不新增运行时 JS 库。
- **禁止手改 `dist/*`**：全部由 `node build.js` 生成；构建链不暴露给使用者，与「零依赖」不冲突。
- 动效只用现有 `--xm-dur-*`/`--xm-ease*`；圆角/间距/字级只用现有 token；`z-index` 只用 `--xm-z-*`。
- `@media` 条件硬编码 `640/900/1200/1440`（CSS 媒体条件不支持 `var()`）。
- 新增动效须在 `components.css` §16 局部兜底块追加终态，**不改** §10 全局 `prefers-reduced-motion` 规则。

## 2. 品牌图形锚点「星轨节点 / Orbit Node」

唯一几何定义（`viewBox 0 0 24 24`，三图元 = 三句概念）：倾斜轨道用冷蓝描边、四角星芒用冷蓝实心、轨道节点用暖金实心。
存为 `docs/assets/stellaris-mark.svg`（唯一真源）：

```svg
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
  <ellipse cx='12' cy='12' rx='10' ry='4.5' transform='rotate(-32 12 12)' fill='none' stroke='#5FB2FF' stroke-width='1.6'/>
  <path d='M12 7.2 L13.4 10.6 L16.8 12 L13.4 13.4 L12 16.8 L10.6 13.4 L7.2 12 L10.6 10.6 Z' fill='#5FB2FF'/>
  <circle cx='20.5' cy='6.7' r='1.9' fill='#F0C987'/>
</svg>
```

- **页头**：只追加 3 条规则到 `base.css`，不改现有 `#blogTitle h1::after`（128-137）。`#blogTitle h1::before` 做 8px 暖金点，`right:0; bottom:-3.5px`（8/2 − 1/2 = 3.5，让中心对齐 1px 线），`opacity:0` 起始，仅在 `prefers-reduced-motion: no-preference` 下用 `xm-node` 动画淡入；§16 追加终态 `opacity:1; transform:none`。
- **favicon**：页首 HTML 最前面加一行 `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,...">`，data URI 内联、透明底、不加深色底板。**必须同步改 `build.js` 的 `spinner` 模板常量**，否则下次构建会丢。
- **og-cover**：`docs/assets/og-cover.svg`，1200×630、安全区 80px，符号置于 `x=80,y=265,size=160`，标题「星轨 Stellaris」+ 等宽副题 `STAR ORBIT · CNBLOGS THEME`，右下角 2px 冷蓝→暖金轨道段。各平台 `og:image` 要求 http(s) 绝对 URL 位图，data URI / SVG 普遍不被接受 —— 这只是仓库资产，实际社交缩略图由仓库所有者在 GitHub Settings → Social preview 手工上传。
- **配色契约**：符号刻意用品牌原色 `#5FB2FF`/`#F0C987`，**不跟随 `window.XM.accent`**（用户改主色不应让品牌符号失色）。data URI 内是字面量，品牌级变更需同步改三处（SVG 文件 / favicon URI / og-cover），文档要写明。
- **避免**：64×64 圆盘、字母盘、页头并列徽标、给节点加 glow/shadow/hover、图片外链、为 og:image 编造 URL。

## 3. 浅色套独立设计（等价但非镜像）

设计原则：同样的四级层次、冷暖分工、对比度门槛，但在亮面重新推导，不是取反。
深色「越浮起越亮」；浅色改为「越浮起越白，hover 回落到冷蓝灰」；暖金在白底必须压深成深琥珀才能承载文字。

### 3.1 四级背景阶梯（两套浅色块都要改）

| token | 当前 | 目标 | L |
|---|---|---|---|
| `--xm-bg` | `#f5f8fc` | `#e7edf5` | 0.8415 |
| `--xm-bg-elevated` | `#ffffff` | `#f2f6fb` | 0.9175 |
| `--xm-surface` | `#ffffff` | `#ffffff` | 1.0000 |
| `--xm-surface-hover` | `#edf2f9` | `#dde7f3` | 0.7900 |

四级全不相等，`bg-elevated`↔`surface` 从「完全塌陷」变为 1.085:1 可辨。

### 3.2 完整浅色覆写清单

**两套必须逐项一致**：`@media (prefers-color-scheme: light) :root:not([data-theme="dark"])` 与 `html[data-theme="light"]`。

| 变量 | 当前 → 目标 |
|---|---|
| `--xm-bg` | `#f5f8fc` → `#e7edf5` |
| `--xm-bg-elevated` | `#ffffff` → `#f2f6fb` |
| `--xm-surface` | `#ffffff`（不变） |
| `--xm-surface-hover` | `#edf2f9` → `#dde7f3` |
| `--xm-border` | `#dce4ee` → `#cdd9e8` |
| `--xm-border-strong` | `#74869f` → **`#5a6d85`** |
| `--xm-text` | `#16202b` → `#101b28` |
| `--xm-text-secondary` | `#4a5a6c` → `#3f5165` |
| `--xm-text-muted` | `#5d6d80` → `#4d5f74` |
| `--xm-accent` | `#1668d8`（不变） |
| `--xm-accent-2` | `#8a5e0f` → `#8a4f0c` |
| `--xm-accent-deep` | `#0f4fa8`（不变） |
| `--xm-accent-contrast` | `#ffffff`（不变） |
| `--xm-accent-soft` | `rgba(22,104,216,.1)`（不变） |
| `--xm-accent-text` | `#1668d8` → `#0f4fa8` |
| `--xm-grad-end` | `#0f4fa8` → **`#8f5210`** |
| `--xm-code-bg` | `#f0f4f9` → `#eef3fa` |
| `--xm-code-border` | `#d8e1ec` → `#cdd9e8` |
| `--xm-selection` | 不变 |
| `--xm-shadow-color` | `.12` → `.14` |
| `--xm-glow-color` | `.18` → `.14` |
| `--xm-ambient-warm` | 新增，浅色覆写 `rgba(240,201,135,.09)` |

`tokens.css:180` 的 `--xm-grad-end` 缩进异常（多两空格）顺手对齐。

**冷暖分工重建**：旧浅色 `accent #1668d8 → grad-end #0f4fa8` 色相差仅 0.3°（蓝→蓝，分工被抹平）；新值 `#8f5210` 色相差 176.5°，与深色 171.2° 等价。亮面暖色用深琥珀而非亮金（`#f0c987` 在白底对比度不足），这就是「非镜像」。

**`--xm-border-strong` 必须改**：P0 的 `#74869f` 是按深色四底色定的；在新浅色四底色上实测 `[3.15, 3.42, 3.71, 2.97]`，在 `surface-hover` 上 2.97:1 < 3:1 破线。改 `#5a6d85` 后 `[4.50, 4.89, 5.30, 4.24]`。深色块保持 `#74869f` 不动。

### 3.3 对比度自检（四底色 × 前景，最差值）

| | 正文 | 次要 | 弱文字 | 链接 | 暖色/渐变终点 | 边框 | 主按钮 |
|---|---|---|---|---|---|---|---|
| 深色 | 12.46 | 7.21 | 5.14 | 6.45 | — | 3.92 | 8.28 |
| 浅色（新） | 13.89 | 6.52 | 5.24 | 6.21 | 5.24 / 4.97 | 4.24 | 5.24 |

门槛：文字 ≥4.5:1、UI 边界 ≥3:1，全部达标。标题渐变三停在 `#f2f6fb` 上分别 16.00 / 4.83 / 5.72:1，末端不会「糊掉」。`--xm-border` 1.34:1 属纯装饰发丝线，不设门槛。

### 3.4 代码块在浅色仍固定深色

`components.css:280` 的既定意图保留。因此 §4.1 的代码块类 token **只在 `:root` 定义一次，浅色两套禁止覆写**。`#dce6f2` on `#0b1118` = 15.03:1，`#cdd9e8` = 13.26:1，`#7ee0a6` = 11.83:1，均达标。

## 4. 令牌完全兑现

### 4.1 新增 token（写入 `src/tokens.css` 的 `:root`，注释英文）

```css
--xm-ambient-warm:   rgba(240, 201, 135, 0.13);
--xm-star-dot:       rgba(255, 255, 255, 0.07);
--xm-star-dot-light: rgba(22, 32, 43, 0.075);
--xm-code-block-bg:  #0b1118;
--xm-code-block-fg:  #dce6f2;
--xm-code-ln-fg:     rgba(139, 155, 176, 0.72);
--xm-code-copy-bg:           rgba(11, 17, 24, 0.72);
--xm-code-copy-border:       rgba(116, 134, 159, 0.45);
--xm-code-copy-fg:           #cdd9e8;
--xm-code-copy-done:         #7ee0a6;
--xm-code-copy-done-border:  rgba(126, 224, 166, 0.6);
--xm-lightbox-scrim: rgba(6, 10, 15, 0.86);
```

- 跨模式常量（code-block / code-copy / code-ln-fg / lightbox-scrim）只 `:root` 一次，**浅色禁止覆写**。
- `--xm-star-dot*` 只 `:root` 定义，由 `base.css` 暗/亮两条规则分别引用。
- `--xm-ambient-warm` 允许浅色两套覆写。
- 命名统一 `--xm-<category>-<role>[-<state>]`；语义层不得出现新色值字面量。

### 4.2 全仓 16 处硬编码替换（不是 5 处）

| 文件:行 | 当前 → 目标 |
|---|---|
| `base.css:38` | `rgba(240,201,135,.13)` → `var(--xm-ambient-warm)` |
| `base.css:51` | `rgba(255,255,255,.045)` → `var(--xm-star-dot)` |
| `base.css:56` / `:60` | `rgba(22,32,43,.05)` → `var(--xm-star-dot-light)` |
| `components.css:286` | `background:#0b1118` → `var(--xm-code-block-bg)` |
| `components.css:298` | `color:#dce6f2` → `var(--xm-code-block-fg)` |
| `components.css:706` | `rgba(116,134,159,.45)` → `var(--xm-code-copy-border)` |
| `components.css:708` | `rgba(11,17,24,.72)` → `var(--xm-code-copy-bg)` |
| `components.css:709` | `#cdd9e8` → `var(--xm-code-copy-fg)` |
| `components.css:732` | `#7ee0a6` → `var(--xm-code-copy-done)` |
| `components.css:733` | `rgba(126,224,166,.6)` → `var(--xm-code-copy-done-border)` |
| `components.css:1120` / `:1156` / `:1170` | `rgba(139,155,176,.72)` → `var(--xm-code-ln-fg)` |
| `components.css:1127` | `background:#0b1118` → `var(--xm-code-block-bg)` |
| `components.css:1186` | `rgba(6,10,15,.86)` → `var(--xm-lightbox-scrim)` |

验收：在 `base.css`/`layout.css`/`components.css` grep `#<hex>` 与 `rgba?\(` 应为 **0 命中**（`color-mix(in srgb, var(--xm-bg-elevated) 78%, transparent)` 属 token 派生，允许）。`dist` 内不应再出现 `#0b1118`/`#dce6f2`/`#cdd9e8`/`#7ee0a6` 字面量（tokens.css 定义段除外）。

### 4.3 JS 侧破口（`src/enhance.js:50-56`）

`applyAccent()` 写入 `--xm-glow`，但全项目零消费（CSS 用的是 `--xm-glow-color` / `--xm-glow-accent`）—— 用户改主色时发光不跟随。改法：

```js
/* Keep the ambient glow in sync with a custom accent; --xm-glow was an orphan. */
root.style.setProperty("--xm-glow-color", hexToRgba(XM.accent, 0.22));
```

同时 `hexToRgba()` 的失败兜底 `rgba(94,234,212,…)`（青绿，与品牌无关）改为品牌冷蓝 `rgba(95,178,255,<alpha>)`。

**刻意不被 `XM.accent` 覆盖**（文档写明，避免实现方误判为遗漏）：`--xm-accent-2`、`--xm-grad-end`、`--xm-accent-deep`、`--xm-selection`、`--xm-glow-accent`。理由：暖金是「管人」的品牌常量，冷蓝才是可换的「管技术」主色。

## 5. 非文章页视觉密度（3 处，纯 CSS、零 DOM、零 JS、零新 token）

1. **首页卡片轨道刻度**：`.dayTitle` 加 `padding-left:var(--xm-s4)` + `::before` 6px 冷蓝点（复用侧栏星点语言）；`.day:hover` 时变暖金、`opacity:1`，过渡用 `--xm-dur-fast`。
2. **归档条目**：`#mainContent .forFlow .entrylistItem` 的 `border-bottom:1px dashed` 改 `solid`，加 `border-radius:var(--xm-r-button)` 与 hover 面 `background:var(--xm-surface-hover)`。
3. **跨页「轨道站点」标题节点**：`.entrylistTitle` / `.catListTitle` 加 8px 暖金节点，与既有 `border-left:3px solid var(--xm-accent-deep)` 组成「冷蓝轨 + 暖金站」。`left` 偏移按实际 DOM 微调（规范不臆断 DOM）。

§16 追加 reduced-motion 终态。避免：伪造阅读数/热门权重、`:nth-child` 造分级、卡片套卡片、加阴影、新增 JS 监听。

## 6. 其余 5 项结论

| 项 | 结论 | 具体值 |
|---|---|---|
| `--xm-content-w` | **删除** | `tokens.css:118` 连同注释引用一起删 |
| `≤640px` 只缩 4 级字号 | **改** | `layout.css:239-244` 补 `--xm-fs-h3:16px`(17→16)、`--xm-fs-small:13px`(13.5→13)、`--xm-lh-body:1.7`(1.75→1.7)；`--xm-fs-caption` 保持 12px 可读下限 |
| `--xm-font-mono` 无中文回退 | **改** | `tokens.css:53-54` 在拉丁等宽之后、`monospace` 之前插入 `"Sarasa Mono SC","Noto Sans Mono CJK SC","Source Han Mono SC","PingFang SC","Microsoft YaHei"` |
| `body::before` 氛围 | **改（参数级，并修正上一版定性）** | fixed 恒驻，**不存在滚动后塌陷**。真问题：`inset:-25%` 把亮部推出视口、星点有效 alpha 仅≈2.3%。改为 `inset:-8% -10% auto -10%`、`body::after opacity:.5→.7`、星点 alpha `.045→.07`/`.05→.075`。`height:70vh` 与 `opacity:.8` 不动。避免改 absolute、加 blur、新增第三图层、把柔光铺满 100vh |
| `README.md:14` 对比度数字 | **改（仅文档）** | 替换为 §3.3 的四底色最差值表，并注明代码块按 `#0b1118` 单独自检 |

## 7. 组件契约（shadcn 三层：token → variant → composition）

### 7.1 三层定义

| 层 | 职责 | 载体 |
|---|---|---|
| L1 Token | 唯一真源：色/字/间距/圆角/描边/动效/层级/断点/布局 | `src/tokens.css` |
| L2 Variant | 同一组件的形态/尺寸/色调分支 | `data-xm-*` 属性 + `.is-*` 状态类 |
| L3 Composition | 组件嵌套、DOM 归属、状态、无障碍、token 依赖 | 平台容器 + 主题注入节点 |

**关键约束**：平台 DOM 不可改结构，`data-xm-*` 变体只能挂在**主题注入节点**上；平台容器只用既有 ID/class + `:has()` + 原生属性挂载样式，不伪造属性或数据。

**L2 字典**：`data-xm-c`（身份）、`data-xm-variant="default|flat|bare|outlined"`、`data-xm-size="sm|md|lg"`、`data-xm-tone="neutral|accent|warm|success"`、`data-xm-density="comfortable|compact"`。
**状态一律用 `.is-*`**（`.is-current/.is-active/.is-visible/.is-stuck/.is-done/.is-broken/.is-loading/.is-logo-loading`）配合原生 `[hidden]`/`[disabled]`/`[aria-current]`/`[aria-expanded]`/`:hover`/`:focus-visible` —— `enhance.js` 已按此写入，双写会状态漂移。

### 7.2 L3 DOM 契约两类

- **(A) 平台容器**：只挂样式、不改结构。含 `#home #header #blogTitle #navList #mainContent .forFlow #sideBar .day .dayTitle .postTitle .postCon .postDesc #cnblogs_post_body .newsItem .catListTitle .catListTag .entrylist* .catList .feedbackItem #comment_form_container .topicListFooter .cnblogs-toc-button #loading` 等。
- **(B) 主题注入节点**：契约归我们，`enhance.js` 生成、`document.body` 直属。含 `.xm-progress .xm-fab .xm-fab__btn .xm-toc* .xm-copy .xm-code-ln .xm-lightbox .xm-readmeta .xm-sr-only .xm-mark`(新)。

**组合规则**：① 注入节点一律 body 直属，**不得插入 `#sideBar`**；② `.xm-fab` 子节点顺序固定 目录→主题→回顶，目录按钮仅在有标题时存在；③ `pre` 内 `.xm-code-ln` 与原生 `table.hljs-ln` 互斥；④ 隐藏态一律 `hidden` 属性 + `[hidden]{display:none}`，真正移出 Tab 序列与无障碍树，**禁止 `opacity:0` 假隐藏**；⑤ `#loading` 与 `keep.css` 不参与组合契约。

### 7.3 组件清单（16 个，每条需写明 DOM / 状态 / 变体 / 无障碍 / 依赖 token）

文章卡 `.day`、正文 `#cnblogs_post_body`、代码块 `pre + .xm-copy + .xm-code-ln`、引用 `blockquote`、表格 `table`、TOC `.xm-toc`、FAB `.xm-fab__btn`、主题切换 `.xm-fab__btn--theme`、灯箱 `.xm-lightbox`、阅读时长 `.xm-readmeta`、导航 `#navList a.menu`、侧栏模块 `.newsItem`、标签云 `.catListTag a` / `.xm-chip`、归档 `.entrylist*`、按钮/表单/评论/分页、进度条/sr-only/品牌符号。

其中值得固化的既有裁决：
- 当前项用底部 **2px 轨道段**，不用 4px 星点；侧栏 `.newsItem ul li a::before` 星点保留。
- 标签云**不做权重分级、不用 `:nth-child` 伪造热门**，等权 chip。
- 归档不卡片套卡片；月归档 `.entrylistItem` 与日归档 `.day > .postTitle` 两套结构并列。
- 主题切换：图标按 `mode`（非 `effectiveMode`）取，auto 态不加小圆点/环，`title`/`aria-label` 描述「点下去会变成什么」。
- 阅读时长 `aria-hidden=true`（估算值不播报）。
- `.xm-copy` 是 `<button type=button>`；行号槽 `aria-hidden=true` + `user-select:none` 且不进复制文本。

### 7.4 `docs/components.md` 骨架

```
# Components
## 0. Contract & conventions（DOM ownership / state / a11y / reduced-motion）
## 1. Token layer
## 2. Variant layer（data-xm-* 字典 + 变体矩阵 + 选择器示例）
## 3. Composition layer（平台容器 / 注入节点 / 组合规则 / 互斥关系）
## 4. Component catalog（16 条）
## 5. Platform containers reference（标注「结构不可改」）
## 6. Acceptance checklist
## 7. Known limitations
```

## 8. 落地顺序与验收

1. 令牌层（`tokens.css`）：12 个新 token + 浅色两套全表 + 删 `--xm-content-w` + mono 中文回退 + `≤640px` 阶梯。
2. 兑现层（`base.css` / `components.css`）：16 处替换 + 品牌节点 + 3 处密度提升 + 氛围参数。
3. JS 层（`enhance.js`）：`--xm-glow` 孤儿变量 + 兜底色。
4. 页首/文档：`build.js` spinner 模板加 favicon link；`README.md:14` 替换；新增 `docs/components.md`、`docs/tokens.md`、`docs/assets/stellaris-mark.svg`、`docs/assets/og-cover.svg`。
5. `node build.js` → 只贴 `dist/*.paste.*`，不贴 `custom.min.css`。
6. 验收：dist 无残留硬编码色值；四底色对比度复算；深浅 + 三态切换逐页目视；reduced-motion 下扫光/节点/复制按钮终态可见；≤640px 无横向溢出；`keep.css` 光标与 `#loading` 未受影响；`XM.accent` 改色后发光跟随、暖金不跟随。

## 9. 未核实（如实保留，不臆断）

- 中文字体族名（Sarasa Mono SC / Noto Sans Mono CJK SC / Source Han Mono SC）是否在目标机器安装；即使全缺也有 `monospace` 兜底，无回归风险。
- 各平台对 SVG `og:image` 与 SVG favicon 的接受度（尤其 Safari/macOS），可能需 `rel="mask-icon"` 或一次性 PNG 兜底，本轮未实测。
- 归档/标签/分类页真实 DOM 细节沿用历史 CDP 结论，本轮未重新核实；§5.3 的 `left` 偏移由实现方按实际 DOM 定夺。
- `#blogLogo` 用户自定义挂载点完全不触碰。

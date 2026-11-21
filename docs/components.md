# Components · 组件契约（shadcn 三层）

> 星轨 Stellaris 的组件不引入任何框架 / 运行时依赖。它借用 shadcn 的
> **token → variant → composition** 三层分工，把「平台不可改的 DOM」与「主题可注入的节点」划清边界。
> 设计令牌见 `docs/tokens.md`；验收断言见 `docs/qa-checklist.md`。

## 0. Contract & conventions

- **DOM ownership（结构不可改）**：博客园 SimpleMemory 的平台容器只挂样式，不改层级、不伪造属性或数据。
  主题注入节点由 `src/enhance.js` 生成、`document.body` 直属，契约归我们。
- **state（状态单一真源）**：状态一律用 `.is-*` 类（`.is-current / .is-active / .is-visible /
  .is-stuck / .is-done / .is-broken / .is-loading / .is-logo-loading`）配合原生
  `[hidden] / [disabled] / [aria-current] / [aria-expanded] / :hover / :focus-visible`。
  `enhance.js` 已按此写入，**禁止双写** `data-xm-*` 状态，否则会状态漂移。
- **隐藏态**：一律 `hidden` 属性 + `[hidden]{display:none}`，真正移出 Tab 序列与无障碍树；
  **禁止 `opacity:0` 假隐藏**。例外：`.xm-copy` 的 `opacity:0` 是「显现过渡起始态」，
  但必须同时 `pointer-events:none`，避免「看不见却能点」的幽灵热区。
- **a11y**：可交互注入节点有固定 `aria-label`（复制按钮 `aria-label="复制代码"` 永不修改，防双播）；
  播报走独立 `role=status / aria-live=polite / aria-atomic=true` 节点；灯箱用原生
  `<dialog>.showModal()`（背景自动 inert、焦点陷阱、`aria-modal="true"`）；正文提供最小版
  skip link / `role=main` landmark；估算型信息（阅读时长）`aria-hidden="true"`。
- **reduced-motion**：新增动效必须在 `components.css` §16 **局部兜底块追加终态**
  （`opacity:1; transform:none; transition:none`），**不改** §10 全局
  `prefers-reduced-motion` 规则，避免把整站动效一刀切。
- 动效只用 `--xm-dur-* / --xm-ease`；圆角 / 间距 / 字级只用现有 token；`z-index` 只用 `--xm-z-*`。
  允许过渡的属性只有 `color / background-color / border-color / opacity`。

## 1. Token layer（L1）

唯一真源是 `src/tokens.css`。色 / 字 / 间距 / 圆角 / 描边 / 动效 / 层级 / 断点 / 布局全在那里；
语义层（`base/layout/components.css`）不得出现色值字面量，只允许 `var(--xm-*)` 与令牌派生。
五层 CSS 顺序固定 `keep → tokens → base → layout → components`。详见 `docs/tokens.md`。

## 2. Variant layer（L2）

**当前状态：预留，尚未消费。** 这一点必须写明，避免下一个人以为改了属性就会变样式：

`src/` 全仓只有两个 `data-xm-*` 真正被读取，且都只是**幂等标记**（防止重复初始化），不是变体：

| 属性 | 位置 | 作用 |
|---|---|---|
| `data-xm-toc` | `enhance.js` | 标记标题已注入过锚点，避免重复插入 |
| `data-xm-zoom` | `enhance.js` | 标记图片已接管点击放大，避免重复绑定 |

下面这套变体字典是**设计意图，不是已实现能力**——`base/layout/components.css` 里没有任何
`[data-xm-variant]` 之类的选择器。要启用它，必须先写消费方，不能只挂属性：

| 属性 | 取值 | 职责 |
|---|---|---|
| `data-xm-c` | 组件身份 | 标识组件 |
| `data-xm-variant` | `default \| flat \| bare \| outlined` | 形态分支 |
| `data-xm-size` | `sm \| md \| lg` | 尺寸分支 |
| `data-xm-tone` | `neutral \| accent \| soft \| success` | 色调分支（**没有 `warm`**：全站只有一个强调色系） |
| `data-xm-density` | `comfortable \| compact` | 密度分支 |

**关键约束**：平台 DOM 不可改结构，`data-xm-*` 变体只能挂在主题注入节点上；平台容器只用
既有 ID/class + `:has()` + 原生属性挂载样式，不伪造属性或数据（不为样式 invented 一个属性）。

> 如果某个组件确实需要第二形态，优先考虑「再写一条组件级 CSS 规则」而不是启动这套字典——
> 一个只有声明、没有消费方的变体层，与空挂的 CSS 变量是同一种债。

## 3. Composition layer（L3）

### 3.1 两类 DOM 契约

- **(A) 平台容器**：只挂样式、不改结构。见 §5。
- **(B) 主题注入节点**（`document.body` 直属，契约归我们）：
  `.xm-progress`、`.xm-fab`、`.xm-fab__btn`、`.xm-toc*`、`.xm-copy`、`.xm-code-ln`、
  `.xm-lightbox`（原生 `<dialog>`）、`.xm-readmeta`、`.xm-sr-only`、
  `.xm-skip` / `#xm-main`（skip link / landmark）。
  另有 `.xm-more`（首页「阅读全文」，由 `.c_b_p_desc_readmore` 克隆而来）、
  `.xm-table-wrap`（正文表格横向滚动壳）、`.xm-empty`（空侧栏模块标记），
  三者都**包裹/标记平台已有节点**，不新建语义内容。

### 3.2 组合规则

1. 注入节点一律 `document.body` 直属，**不得插入 `#sideBar`**。
2. `.xm-fab` 子节点顺序固定 **目录 → 主题 → 回顶**；目录按钮仅在有标题且 `features.toc` 开启时存在。
3. `pre` 内 `.xm-code-ln` 与原生 `table.hljs-ln` **互斥**：有原生行号表时禁止 flex、隐藏自实现 gutter。
4. 隐藏态一律 `hidden` 属性 + `[hidden]{display:none}`。
5. `#loading` 与 `keep.css` 不参与组合契约（整块冻结）。

### 3.3 配置开关（`window.XM.features.*`）

`toc / copy / lineNumbers / lightbox / readingTime / progress` 六个键，默认全 `true`；
显式 `false` 时**组件 DOM 完全不出现（不是 hidden）、专属监听不注册**，其余组件 DOM 不受影响。
共享监听（scroll / Esc 分发器）仍存在但内部判空。缺失 DOM 时的静默降级矩阵见
`docs/qa-checklist.md` §3.1。配置归一化是纯函数，**不写回 `window.XM`**。

## 4. Component catalog（16 条）

| # | 组件 | DOM | 状态 | 变体 | 无障碍 | 依赖 token |
|---|---|---|---|---|---|---|
| 1 | 文章卡 `.day` | 平台 `.day` + `.dayTitle/.postTitle/.postCon/.postDesc`；注入 `.xm-more` 承载「阅读全文」 | `:hover` **只**改 `border-color`（`color-mix` 20% 文字色）；无位移、无扫光、无投影 | 无（平台容器） | 语义由平台提供；`.xm-more` 是真实链接，不吞原 `readmore` 的 href | `--xm-surface/-border/-r-card/-s5/-s6` |
| 2 | 正文 `#cnblogs_post_body` | 平台容器 + 注入 `.xm-readmeta`、landmark 锚点；`#topics` 内层拍平 | 链接 `:hover` 换色，无下划线扫入 | 无 | 标题 `scroll-margin-top`；skip link 目标 `#xm-main`（`tabindex=-1`, `role=main`） | 字体 / 字级 / 行高 / 间距 / 全表色值 |
| 3 | 代码块 `pre + .xm-copy + .xm-code-ln` | 平台 `pre`；注入 `<button class=xm-copy>` 与行号槽；mac 三点走平台 `--mac-style-color-*` | `.is-done`；`:hover`/`:focus-within`/触屏常显显现按钮 | 无 | 按钮固定 `aria-label="复制代码"`；播报走唯一 `#xm-copy-status`；行号槽 `aria-hidden=true` + `user-select:none` 且不进复制文本 | `--xm-code-block-bg/fg`、`--xm-code-copy-*`、`--xm-code-dot-1/2/3`、`--xm-code-ln-fg` |
| 4 | 引用 `blockquote` | 平台 `blockquote` + `::before` 2px 竖线 | 无（静态：竖线 `--xm-border-strong` + 极浅底，**不做 hover 动效**） | 无 | 纯排版，无交互 | `--xm-border-strong/-surface/-text-secondary/-s3` |
| 5 | 表格 `table` | 平台 `table` + 注入 `.xm-table-wrap`（横向滚动壳） | `tbody tr:hover`（`:not(.hljs-ln)`） | 无 | 语义表格由平台提供；`≤640px` `min-width:460px` 走壳内滚动 | `--xm-surface-hover/-border/-fs-small/-r-code` |
| 6 | TOC `.xm-toc` | 注入节点：面板 / 头部 / 可滚动 body / 列表 | `[hidden]` 折叠；`[aria-current=location]` 唯一高亮；`.is-active`；按钮 `[aria-expanded]` | 无 | `role=region` + `aria-label`；`[hidden]` 真隐藏移出 Tab 序列；`updateSpy()` 在 `!tocOpen` return（产品决策，保留） | `--xm-bg-elevated/-border-strong/-r-card/-shadow-popover/-accent-soft/-fs-*` |
| 7 | FAB `.xm-fab__btn` | 注入 `<button>` ×3（目录 / 主题 / 回顶） | `.is-visible`；`[hidden]`；`:hover` 只换描边色 | 无 | 隐藏态移出 Tab 序列；`title`/`aria-label` 齐全 | `--xm-bg-elevated/-border-strong/-r-button/-z-fab/-dur-*` |
| 8 | 主题切换 `.xm-fab__btn--theme` | 注入按钮；`aria-describedby` 指向 `#xm-theme-desc`；独立 live 节点 | `dataset.mode`（`auto/dark/light`）；无 `aria-pressed`/`role=switch` | 图标按 mode（非 effectiveMode）取 | 动态 accessible name 描述「点下去会变成什么」；auto 态不加小圆点 | `--xm-accent/-text-secondary/-dur-*` |
| 9 | 灯箱 `.xm-lightbox` | **原生 `<dialog>`** + `showModal()`；内含可见关闭按钮与 `<img>` | `[open]` 配对显示；`close` 事件统一清理并回焦 `lastTrigger` | 无 showModal 时降级并显式 `aria-modal="false"` | `:modal` 焦点陷阱；裸图 `tabindex=0`/`role=button`/`aria-label`；只处理未被 `<a>` 包裹的图，绝不 `preventDefault` 吞链接 | `--xm-lightbox-scrim/-border-strong/-shadow-popover/-z-toast/-s8` |
| 10 | 阅读时长 `.xm-readmeta` | 注入 `<div>`；列表页则就地追加进 `.dayTitle`（`.xm-readmeta--inline`） | 无 | 无 | `aria-hidden="true"`（估算值不播报） | `--xm-font-mono/-fs-caption/-text-muted` |
| 11 | 导航 `#navList a.menu` | 平台 `a.menu`，无伪元素装饰 | `.is-current`（JS 按路径匹配） | 无 | 当前项用 `color-mix(text 8%)` 淡底 + `--xm-r-chip` 圆角；**无下划线、无 2px 轨道段** | `--xm-text/-r-chip/-s2/-dur-*` |
| 12 | 侧栏模块 `.newsItem` | 平台 `.newsItem` + `.catListTitle`；模块间 `border-top` 发丝线，首块去线，`gap:0` | `li a:hover` 换色 | 无 | 纯排版；`.catListTitle` 等宽 11px / `0.08em` / `uppercase` / muted，**无左轨、无星点**；空模块由 `.xm-empty` 隐藏 | `--xm-border/-text-muted/-font-mono/-fs-caption` |
| 13 | 标签云 `.catListTag a` / `.xm-chip` | 平台 `a`；等权 chip | `:hover` 换描边/底色 | 无（**不做权重分级、不用 `:nth-child` 伪造热门**） | 可聚焦链接，语义由平台提供 | `--xm-border-strong/-surface-hover/-r-chip/-fs-caption` |
| 14 | 归档 `.entrylist*` | 平台两套结构并列：月归档 `.entrylistItem` / 日归档·首页 `.day > .postTitle` | `:hover` 面（月归档） | 无 | 不卡片套卡片、不加阴影；标题无装饰节点；`entrylistItemPostDesc` 与首页 `.postDesc` 同字阶 | `--xm-surface-hover/-border/-r-button/-text-muted/-fs-caption` |
| 15 | 按钮 / 表单 / 评论 / 分页 | 平台 `button, input, textarea, .feedbackItem, #comment_form_container, #nav_next_page a` | `:hover/:focus-visible/:active` | 无 | 统一 `:focus-visible` 焦点环；表单 `:focus` 换边框色，**不加光晕** | `--xm-border-strong/-r-*/-fs-small/-accent-text` |
| 16 | 进度条 / sr-only / 页头品牌装饰 | `.xm-progress`（注入）、`.xm-sr-only`（注入）、`#blogTitle::before/::after` 纯 CSS 靛蓝弧线 + 端点 | 进度条宽度随滚动；装饰静态、无动效 | 无 | 进度条 `aria-hidden=true`；sr-only 用于 live 播报；装饰不参与 reduced-motion | `--xm-accent/-border/-z-toast/-dur-slow` |

### 4.1 值得固化的既有裁决

- **hover 只改描边/文字色**，不改 `transform`、不加 `box-shadow`、不加发光。这是方向性约束，不是偷懒。
- 导航当前项用 8% 文字色淡底 + 6px 圆角，**不用下划线也不用轨道段**；状态只由一处表达。
- 侧栏模块靠 `border-top` 发丝线分区，`gap: 0`，首块去顶线；**模块本身不是卡片**。
- 标签云等权 chip，不做权重分级、不用 `:nth-child` 伪造热门。
- 归档不卡片套卡片；月归档 `.entrylistItem` 与日归档 `.day > .postTitle` 两套结构并列。
- 主题切换：图标按 `mode`（非 `effectiveMode`）取，auto 态不加小圆点 / 环，
  `title`/`aria-label` 描述「点下去会变成什么」。
- 阅读时长 `aria-hidden=true`（估算值不播报）；列表页追加进 `.dayTitle`、文章页独立成块，
  两条路径共用同一个 `readingMinutes()` 估算函数，不重复实现。
- `.xm-copy` 是 `<button type=button>`；行号槽 `aria-hidden=true` + `user-select:none` 且不进复制文本。
- 代码块 mac 三点通过**覆写平台变量** `--mac-style-color-red/orange/green` 换色，而不是覆盖选择器；
  同时必须补 `pre code { padding-top: 34px }`，否则三点压住第 1 行行号（本主题的 `pre code{padding:0}`
  优先级高于平台那条留白规则）。

## 5. Platform containers reference（结构不可改）

`#home` · `#header` · `#blogTitle` · `#lnkBlogLogo` · `#blogLogo` · `#navigator` · `#navList` ·
`.blogStats` · `#main` · `#mainContent` · `.forFlow` · `#sideBar` · `#sideBarMain` · `#footer` ·
`.day` · `.dayTitle` · `.postTitle` · `.postCon` · `.postDesc` · `#topics` · `#cnblogs_post_body` ·
`#cb_post_title_url` · `.newsItem` · `.catListTitle` · `.catListTag` · `#sidebar_postarchive` ·
`#sidebar_toptags` · `#taglist` · `.entrylistTitle` · `.entrylistItem` · `.entrylistItemTitle` ·
`.entrylistDescription` · `.entrylistPosttitle` · `.entrylistPostSummary` · `.c_b_p_desc*` ·
`.feedbackItem` · `.feedbackCon` · `#comment_form_container` · `.topicListFooter` · `#nav_next_page` ·
`#green_channel_*` · `.cnblogs-toc-button` · `#loading`。

> `#blogLogo` 是用户自定义挂载点，主题只做条件隐藏（占位 1×1 gif），不新建 img、不留空心圈。
> `#loading` 与 `keep.css` 整块冻结，不在本契约内。

## 6. Acceptance checklist

- 结构化断言以 `docs/qa-checklist.md` 为唯一源；P0 必跑子集
  **A01–A13、A16–A23、A25、A26、A29–A33、A34、A35**。
- 硬编码色值：`base.css / layout.css / components.css` grep `#<hex>` 与 `rgba?\(` 应为 **0 命中**。
- 四底色对比度：文字 ≥4.5:1、UI 边界 ≥3:1。
- `keep.css` 的 `*{cursor:var(--xm-cursor,auto)}` 仍在（默认值见 `tokens.css`）；正文 img 无内联 `style.cursor`；
  `#loading` 的 `z-index:99999999` 未变。
- `XM.accent` 改色后 `--xm-glow-color` 跟随、`--xm-accent-deep` 与 `--xm-accent-2` 不跟随；
  reduced-motion 下入场/复制按钮处于终态且可见；≤640px 无横向溢出。
- **证据边界**：P0 全绿只把「结构化 / 可自动化证据」从 5/10 提到约 8/10；剩余 2 分必须靠
  真机移动端视觉 + 人工读屏（NVDA / VoiceOver）+ 真实读者数据，不得把「断言全绿」写成
  「已完成无障碍验收」。

## 7. Known limitations（如实保留，不臆断）

- 中文字体族名（Sarasa Mono SC / Noto Sans Mono CJK SC / Source Han Mono SC）是否在目标机器安装
  未核实；即使全缺也有 `monospace` 兜底，无回归风险。
- 各平台对 SVG `og:image` 与 SVG favicon 的接受度（尤其 Safari / macOS）未实测，
  可能需 `rel="mask-icon"` 或一次性 PNG 兜底；`og-cover.svg` 只是仓库资产，
  GitHub Social preview 由仓库所有者手工上传。
- 归档 / 标签 / 分类页真实 DOM 细节沿用历史 CDP 结论，本轮未重新核实；
  §4 第 14 条的 `left` 偏移按实现方对实际 DOM 的判断定夺。
- CDP 运行时断言（焦点陷阱、`:modal`、aria-live 播报时序、`Emulation.*` 媒体特性）由独立验收实例跑，
  不在本批静态自验范围内。

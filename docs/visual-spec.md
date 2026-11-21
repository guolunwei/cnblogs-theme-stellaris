# 星轨 Stellaris · 视觉规范（Linear 式工程极简）

> 本文件是**当前视觉系统的描述与约束**，不是待办清单。所有数值均与 `src/*.css` 实际实现一致，
> 改样式前先读这里，改完同步这里。令牌逐项定义见 `docs/tokens.md`，组件契约见 `docs/components.md`，
> 验收断言见 `docs/qa-checklist.md`。
>
> 上一版规范（冷蓝 + 暖金双色分工、星轨节点图形、网点纹理、卡片浮起）已整体废止，
> 相关元素在重制中删除。若在代码或旧文档中看到「暖金」「星轨节点」「星点」，那是残留，不是设计意图。

## 1. 方向声明

对标 Linear / Stripe / Vercel 这类**产品型官网**，而不是「技术博客模板」。三条不能违背的判断：

1. **内容唯一发光，界面全部退后。** 画布近黑（`#08090a`），文字近白（`#f7f8f8`），中间只允许
   两级灰阶过渡。任何界面元素都不能比正文更亮。
2. **用线分层，不用阴影分层。** 全站 `box-shadow: none`。分区靠 1px 发丝线 + 间距，
   hover 只提升描边亮度，不位移、不放大、不发光、不加投影。
3. **一个强调色，且只出现在六个位置。** 靛蓝 `#8b93ff` 是系统里唯一的彩色。多一个颜色就破功。

不追求的东西：拟物、玻璃拟态堆叠、渐变文字、彩色图标、装饰性插画、多色标签体系。

## 2. 画布与栅格

| 项 | 值 | 说明 |
|---|---|---|
| 画布 | `--xm-bg` `#08090a` | 近黑而非纯黑，`#000` 会让细字分辨率崩掉 |
| 页面最大宽 | `--xm-page-w` `1180px` | 比博客模板常见的 1400px 窄，视线更集中 |
| 侧栏宽 | `--xm-sidebar-w` `264px` | 固定宽度，不参与 flex 伸缩 |
| 主列 | grid `1fr` | 宽度由「页宽 − 侧栏 − gap」推导，**不存在**固定 `--xm-content-w` |
| 栏间距 | `40px`（`#main` gap） | 双栏间距必须大于侧栏内部行距，才读得出「两个区域」 |
| 页面左右留白 | `--xm-s8` `32px` | 移动端降到 `16px` |
| 主体上边距 | `--xm-s8` `32px` | 页头本身占 56px，不需要额外大留白 |

**氛围**只有一个：`body::before` 一条 460px 高的顶部径向光晕，中心 `--xm-glow-color`（靛蓝 10% alpha），
72% 处完全透明。**不做**网点纹理、不做星云、不做第二图层、不做滚动视差。
光晕贴着视口顶部固定，不随滚动移动，滚动后自然被内容覆盖。

## 3. 分区语言：发丝线与两级描边

全站只有两种描边，分工严格：

| token | 值（深/浅） | 用途 | 对比度要求 |
|---|---|---|---|
| `--xm-border` | `#1c1e21` / `#e6e8eb` | 卡片外框、模块分隔线、表格横线、引用竖线 | **不设门槛**，纯装饰发丝线（≈1.2:1） |
| `--xm-border-strong` | `#6b7079`（深浅同值） | 输入框边、按钮边、分页器边、需要「看见边界」的控件 | ≥3:1（实测深 3.58 / 浅 4.48） |

用法纪律：

- 区块之间**优先用 `border-top` 分隔**，而不是给每块加卡片框。侧栏就是这样：一个发丝线接一个模块，
  首块去顶线，取消 `gap`，靠 padding 造呼吸感。
- **禁止卡片套卡片**。文章页平台结构是 `#topics > .post > #cnblogs_post_body`，两层都自带卡片，
  必须把内层拍平成纯排版容器（`margin/padding: 0; background: none; border: 0`）。
- `border-radius` 只在**容器**上出现：卡片 `10px`、按钮/输入框 `6px`、代码块 `8px`、chip `999px`。
  分隔线、表格、引用竖线一律直角。
- hover 只允许改 `border-color`，目标是 `color-mix(in srgb, var(--xm-text) 20%, transparent)`
  ——即用文字色混出「亮一档的线」，不引入新色值。

## 4. 排版标尺

紧凑是这套设计的核心特征，字号整体比阅读型博客小 1–2px：

| 角色 | token | 桌面 | ≤640px | 字重 | 行高 |
|---|---|---|---|---|---|
| 页面标题（display） | `--xm-fs-display` | 16px | 16px | 500 | 1.2 |
| 文章标题 | 直接写 `30px` | 30px | 24px | 640 | 1.28 |
| 卡片标题（h2 级） | `--xm-fs-h2` | 21px | 18px | 590 | 1.4 |
| 正文 | `--xm-fs-body` | 15px | 15px | 400 | 1.75 |
| 小字（摘要、按钮） | `--xm-fs-small` | 13.5px | 13px | — | 1.6 |
| 元信息（caption） | `--xm-fs-caption` | 11.5px | 12px | 400 | 1.5 |

- **文章标题是唯一允许 640 字重的地方**，其余标题 590 封顶，正文 400。层次靠字号与颜色，不靠加粗堆叠。
- **等宽字体承担「标签」角色**，不是装饰：`.dayTitle`（日期）、`.postDesc`（元信息）、
  `.catListTitle`（侧栏模块标题）、`.entrylistTitle`、`.feedbackManage`、代码行号。
  统一 `letter-spacing: 0.04em`（侧栏标题 0.08em + `uppercase`），颜色 `--xm-text-muted`。
  这是全站唯一「有性格」的排版手段，其它地方一律收敛。
- 标题字距负向补偿：文章标题 `-0.02em`，卡片标题 `-0.012em`。大字号不补偿会显松。
- 字体栈前置 `"Inter"`，缺失退回 PingFang SC / HarmonyOS Sans SC。**不引 webfont**，守零依赖。

## 5. 强调色纪律

`--xm-accent`（深 `#8b93ff` / 浅 `#5e6ad2`）是全站唯一彩色。判断标准不是「能出现在哪几个元素」，
而是**它永远只表达「这是可交互的」或「这是当前项」**——不做背景铺底、不做插图、不做分类色彩。

实际出现位置（改样式时以此为准，不要新增类别）：

| 类别 | 具体位置 | 用哪个令牌 |
|---|---|---|
| 文字型链接 | 正文链接、`阅读全文`、导航 hover | `--xm-accent-text`（浅色压到 `#4b55b8`） |
| 焦点环 | 全站 `:focus-visible` 的 2px outline | `--xm-accent` |
| hover 描边 | 按钮、输入框、chip、分页器的边框提亮 | `--xm-accent` |
| 实心主控件 | 主按钮、日历「今天」（**底色必须用 deep 阶**） | `background: --xm-accent-deep` + `--xm-accent-contrast` 文字 |
| 状态指示 | 阅读进度条 `1px`、页面顶部光晕 | `--xm-accent` / `--xm-glow-color` |
| 品牌弧线 | 页头 12px 四分之一弧 + 端点 | `--xm-accent` |
| 滚动条 | `::-webkit-scrollbar-thumb:hover` | `--xm-accent` |

**硬约束：白字只能压在 `--xm-accent-deep` 上。** `#8b93ff` 与白色的对比度只有 1.73:1，
在它上面写白字无论字重多少都不合格；`--xm-accent-contrast` 这个令牌的存在前提就是「底色是 deep 阶」。
同理，实心按钮 hover **压暗**（`brightness(.94)`）而不是提亮——提亮会把 4.70:1 拉到 4.5 以下。

禁止：彩色边框装饰（非交互元素）、彩色标题、彩色图标、把强调色铺成大色块做区块背景、
用强调色的不同透明度假装「多色标签体系」。`--xm-accent-2` 只是同一靛蓝的浅阶，不是第二种颜色。

## 6. 组件规范

### 6.1 首页文章卡 `.day`

```
padding 20/24 · border 1px --xm-border · radius 10px · bg --xm-surface · 卡间距 16px
hover：仅 border-color 提亮
```

- 内部顺序固定：`.dayTitle`（日期 · 阅读时长，等宽 caption）→ `.postTitle`（21px/590）→ 摘要 → `.xm-more`。
- 摘要 `.c_b_p_desc` 截断为 **2 行**，且「阅读全文」必须由 JS 克隆成独立的 `.xm-more` 移到摘要之外，
  否则会被截断裁掉半个链接。
- `.postDesc` 用 `border-top` 与正文分开，等宽 caption。元信息文本由 JS 规整：
  去 `posted @`、`2026年11月9日` → `2026.11.09`、`(30)` → `30`、计数之间补 ` · `。

### 6.2 文章页

- 外层 `#topics` 是唯一卡片（`padding: 40px`），内层 `#cnblogs_post_body` 拍平。
- 标题下方一条 `border-bottom` 发丝线，之后直接进正文，**不加副标题区、不加作者条**。
- `h2` 无左竖条、无装饰，靠字号 + 上间距分段；`h3` 17px/590。
- 引用 `blockquote`：2px 竖线（`--xm-border-strong`）+ 极浅底，不用斜体、不用引号图形。
- 表格：**只留横线**（`tbody` 行间 `border-bottom`），无竖线、无外框、无斑马纹；
  外层 `.xm-table-wrap` 提供横向滚动，`≤640px` 时表格 `min-width: 460px`。
- 图片：`max-width: 100%` + `radius 8px`，点击走灯箱。
- `#green_channel`（分享条）、`#author_profile`（作者卡）都去掉平台虚线框，
  作者卡重排成一行：40px 圆形头像 + 昵称 + 右侧 `+加关注`。

### 6.3 代码块

- 固定深色，**浅色模式下也不反转**（`--xm-code-block-bg #0b0c0d`，前景 15.52:1）。
- mac 三点保留结构、换成三档中性灰（`--xm-code-dot-1/2/3`），通过覆写平台变量
  `--mac-style-color-red/orange/green` 实现，**不用红黄绿**。
- 平台把三点位置让给 `code` 的 `padding-top`，而本主题的 `pre code { padding: 0 }` 优先级更高，
  必须显式补 `padding-top: 34px`，否则三点压在第 1 行行号上。
- 行号槽 `.xm-code-ln` 与原生 `table.hljs-ln` 互斥，`aria-hidden` + `user-select: none`，不进复制文本。
- 复制按钮是描边小按钮（`<button type=button>`），成功态文字变绿 `#7ee0a6`，**不做**缩放动画、不做发光。

### 6.4 侧栏

- 结构语言：`#sideBarMain { gap: 0 }`，每个模块 `border-top: 1px`，首块去顶线。
  **模块没有卡片框、没有背景、没有圆角。**
- 模块标题 `.catListTitle`：等宽 11px / 500 / `0.08em` / `uppercase` / muted，无左轨、无缩进。
- 日历：重排为紧凑格，今日用 `--xm-accent-deep` 的实心 pill（类名是 `CalTodayDay`，不是 `CalToday`；
  底色不能用 `--xm-accent`，白字只有 1.73:1）。
- 搜索：`.div_my_zzk` 一行 flex，`#btnZzk` 与输入框同款 6px 圆角控件，placeholder 由 JS 补「搜索文章…」。
- 空模块（无内容的 widget）由 JS 加 `.xm-empty` → `display: none`，不留空框。

### 6.5 导航与页头

- 单行 56px 吸顶工具条：brand（32px 圆头像 + 12px 靛蓝四分之一弧线 + 标题）+ 导航 + 右侧动作。
- 背景 `color-mix(in srgb, var(--xm-bg) 82%, transparent)` + `backdrop-filter: blur(18px) saturate(140%)`；
  滚动后 `.is-stuck` 提到 72% 不透明度，保证发丝线在内容上仍可辨。
- 导航项 `padding 6/10`，当前项用 8% 文字色底 + 6px 圆角，**无下划线、无 2px 轨道段**。
- 平台自带的 1×1 透明 `logo.gif` 占位要隐藏，否则 32px 圆形框里是空的。

### 6.6 归档 / 标签 / 分类

- `.entrylistTitle`（年月）：等宽小标签，`--xm-border` 顶部发丝线，无装饰节点。
- `.entrylistItem`：无左内边距、无序号点、无缩进，条目之间发丝线分隔。
- `.entrylistItemPostDesc` 与首页 `.postDesc` 同一字阶与同一套 ` · ` 分隔规则，跨页不跳字号。
- 标签云：等权 chip，**不做权重分级、不用 `:nth-child` 伪造热门**。

### 6.7 悬浮层

- 进度条 `.xm-progress`：1px 纯色 `--xm-accent`，无渐变、无发光。
- FAB `.xm-fab__btn`：描边按钮（`--xm-border-strong`），hover 只改描边色，无投影。
- 灯箱 `.xm-lightbox`：原生 `<dialog>.showModal()`，遮罩 `rgba(5,6,7,.9)`。
- 隐藏态一律用 `hidden` 属性 + `[hidden]{display:none}`，**禁止 `opacity: 0` 假隐藏**。

## 7. 浅色套的独立推导

浅色不是深色取反，有三条必须重算：

- **强调色压深**：`#8b93ff` 在白底仅 1.9:1，不能作文字。浅色 `--xm-accent: #5e6ad2`，
  作为文字时进一步压到 `--xm-accent-text: #4b55b8`（最低 5.75:1）。
- **四级背景不塌陷**：`#fbfbfc / #ffffff / #ffffff / #f2f3f5`，靠 `surface-hover` 下沉而不是「越浮起越亮」。
  注意 `bg-elevated` 与 `surface` 同值 `#ffffff` 是有意的——在浅色里卡片与画布靠 1px 描边区分，不靠色差。
- **发丝线换向**：深色线是「比底亮」，浅色线是「比底暗」；`--xm-border` 从 `#1c1e21` 换到 `#e6e8eb`，
  两者都是 ~1.2:1 的装饰级，不需要额外的边缘处理。

代码块常量、mac 三点、灯箱遮罩**不在浅色块覆写**：它们是跨模式常量，覆写会让代码区刷白。

## 8. 动效

| 项 | 值 |
|---|---|
| 时长 | `--xm-dur-fast 140ms` / `--xm-dur 180ms` / `--xm-dur-slow 260ms` |
| 曲线 | `--xm-ease: cubic-bezier(.2,.7,.3,1)`，只有这一条 |
| hover 允许 | `border-color` / `color` / `background-color` / `opacity`；实心主按钮额外允许 `filter: brightness(.94)` |
| `:active` 允许 | `transform: translateY(1px)`（按压反馈，**不进 transition**，即时生效） |
| 禁止 | hover/idle 的 `transform`（位移、缩放、旋转）、`box-shadow`、`letter-spacing`、`clip-path` |

- hover **只表达「亮一档」**：换色或压暗，不位移、不放大、不发光。
- `.xm-btn:active` 的 1px 下压是唯一的位移，且必须即时（不加过渡），否则按压会拖尾。
- 唯一「入场」是内容淡入，且必须在 `prefers-reduced-motion: reduce` 时直接落到终态而不是隐藏。
- 平滑滚动包在 `@media (prefers-reduced-motion: no-preference)` 内。
- 局部 reduced-motion 兜底写在 `components.css` §16，**不改**全局规则。

## 9. 这一版明确删掉的东西

记录在此，避免下一个人「觉得空」又加回来：

| 删除项 | 原因 |
|---|---|
| 冷蓝 + 暖金双色分工 | 双色强调让系统变成「两套语义」，与单点强调直接冲突 |
| 星轨节点图形 / 品牌四角星 / 8px 节点 | 页头已有弧线 + 圆点，再加节点是冗余第三焦点 |
| 网点纹理 `body::after` / 双色星云 | 纹理在近黑底上只会显脏，Linear 式画布要干净 |
| 卡片 hover 位移 + 扫光 + 投影 | 位移与投影都是「界面在动」，抢内容注意力 |
| 标题渐变文字 | 渐变在 21px 以下会糊，且引入第二个色相 |
| 导航 2px 底部轨道段 | 与「当前项用底色」重复表达同一状态 |
| 侧栏卡片框 + 模块间 gap | 改为发丝线分区后，卡片框变成多余的第三个层级 |
| 代码块红黄绿三点 | 三原色破坏单色体系，改三档中性灰 |
| 摘要 3 行截断 | 3 行会让「阅读全文」被裁掉，改 2 行 + 独立成行 |
| 计数括号 `阅读(30)` | 括号是平台默认排版噪音，改 `30 · 阅读` 式表达 |

## 10. 验收清单

改完样式后逐条过，任一条不过就是回归：

- [ ] 深/浅两态、1440 / 1024 / 390 三宽度，首页 + 文章页 + 归档页目视无异常
- [ ] 语义层零色值字面量：`grep -cnE '#[0-9a-fA-F]{3,8}|rgba?\(' src/{base,layout,components}.css` 全为 0
- [ ] 无空挂令牌：见 `docs/tokens.md` §9，期望只输出 4 个断点令牌
- [ ] 文章页无双层卡片；侧栏模块无卡片框；全局 `box-shadow` 只剩 `--xm-shadow-popover` 与 `--xm-glow-accent(none)`
- [ ] 代码块三点不压第 1 行行号；浅色模式下代码块仍是深色
- [ ] hover 无位移、无投影、无发光，只变描边/文字色
- [ ] `≤640px` 无横向溢出（表格走 `.xm-table-wrap` 内部滚动）
- [ ] `prefers-reduced-motion: reduce` 下所有装饰处于终态且可见
- [ ] 对比度未退化：正文 ≥16:1、弱文字 ≥4.4:1、UI 边界 ≥3:1
- [ ] `keep.css` 的光标与 `#loading` 未被影响

## 11. 未核实 / 已知取舍

- `--xm-text-muted` 在浅色 `surface-hover` 上 4.48:1，比 4.5 低 0.02。之所以不调，是因为往任一方向动
  都会让另一模式破线；它只用于时间戳等非关键小字，且该底色只在 hover 瞬间出现。
- Inter 是否安装取决于用户机器；缺失时字距观感会有细微差异，不引 webfont 是有意取舍。
- 归档 / 标签 / 分类页的真实 DOM 沿用历史 CDP 结论，平台改版后需重新核对选择器注册表（见 `docs/adapter.md`）。
- `#blogLogo` 是用户自定义挂载点，除圆形框外不做任何假设。

# 星轨 Stellaris · 第二批实现交接清单

> 主理人汇编。三份规范（`visual-spec.md` / `qa-checklist.md` / 体验必修规范）的综合执行版。
> 本文件是第二批代码改动的**唯一入口**；与任何专家消息冲突时，以本文件为准。
> 状态：待第一批工程实例完全停手后开工（写冲突：`src/*.css`、`src/enhance.js`）。

## 0. 开工前置条件（硬性）

1. 第一批 `fe-engineer-2` 已回报完成并停手；确认它不会继续写 `src/` / `build.js` / `dist/`。
2. 记录当前基线：`dist/custom.paste.css` md5 = `72161ad285ecd011a87b3715436a1f0f`；
   线上 `custom.css?v=H2wdItyljTneVDgDssMqJUNOLx0=`。
3. **理解线上现状**：用户线上仍贴着旧版三个框。第二批会重建 `dist/`，但**任何人不得代贴线上**；
   报告中必须给出「需重贴哪几个框 + 重贴后如何核验」的清单，由用户自己决定是否上线。
4. 运行时零依赖、五层 CSS 顺序、三框形态、SimpleMemory 皮肤前提不变；`keep.css` 整块冻结。

## 1. 已核实的行号修正（规范原文有误，务必按此执行）

| 规范原文 | 实际 | 处理 |
|---|---|---|
| `README.md:14` 旧对比度数字 | 工程侧已重写 README，旧数字在 **`:11`**，且压缩成一句「正文对比度 13.6:1」 | 改 `:11`，替换为 `visual-spec.md` §3.3 的四底色最差值表 |
| `components.css:286/298/706/708/709/732/733/1120/1127/1156/1170/1186` | **全部核实无误**，逐行内容与规范一致 | 照 `visual-spec.md` §4.2 的 16 处替换 |
| `base.css:38/51/56/60` | **全部核实无误** | 照 `visual-spec.md` §4.2 替换 |
| `enhance.js:849/:850`、`:835`、`:675`、`:713`(components.css) | **全部仍在**，第一批未顺手改掉 | 照体验规范修法 |

## 2. 主理人裁决（已拍板，实现方不得自行改判）

| # | 议题 | 裁决 |
|---|---|---|
| 1 | `--xm-content-w:760px` 零消费 | **删除**（`tokens.css:118` 连注释一起删），不引入 `--xm-measure:68ch` |
| 2 | 页头 8px 品牌节点是否算「第三焦点」 | **采纳**「拆进既有第一焦点」方案（不新增独立 DOM/图形框），仅 `h1::before` 一个 8px 点；若实现后目视抢焦点，退化为「符号仅落 favicon + og-cover」 |
| 3 | og-cover 是否提交 PNG | **只提交 `docs/assets/og-cover.svg`**，不提交二进制 PNG；GitHub Social preview 由仓库所有者手工上传，README 写一句说明 |
| 4 | `applyAccent()` 孤儿变量 | **本批修** |
| 5 | TOC 与灯箱互斥是否补 JS | **不单独补**。原生 `<dialog>.showModal()` 背景自动 inert + 体验规范 A14 守卫已覆盖 |
| 6 | 适配层落点 | **物理独立 `src/adapter.js`**（第一批已建），`JS_ORDER = ["adapter.js","enhance.js"]` 拼进**现有那一个** `<script>`，页脚仍 4 段 |
| 7 | 配置外置 | **不搬页首框**。`config.paste.html` 是配置段快照/文档用途，不是第 4 个粘贴框；页脚两段 script 结构保持不变 |
| 8 | 注释语言 | 新增/改写部分**英文**；既有中文注释**不主动翻译**（避免大 diff、零收益）。文档用中文 |
| 9 | 既有 CSS 中文注释 | 同上，不翻译 |

## 3. 执行顺序（严格按序，每步自验）

### Step A · 适配层接入（先把契约落地，不动行为）
把 `src/enhance.js` 内所有 `document.getElementById/querySelector` 收敛到
`window.XM_ADAPTER.pick(key)` / `pickAll(key)`，按 `docs/qa-checklist.md` §3.1 的降级矩阵实现：

- `postBody` 缺失 → 不建 TOC/灯箱/阅读时长/标题 id/`contentObs`，但**主题切换、进度条、FAB、代码块复制仍可用**。
- `header` 缺失 → `measureHeader()` 直接 return，保留 CSS 兜底 `var(--xm-s14)`，**不写 0**。
- `blogLogo` 缺失 → `initLogo()` 直接 return，不新建 img、不留空心圈。
- `codeBlocks` 空 → 不加复制/行号槽、**不注册 `lnObs`**。
- `tagList` / `mainContent` / `sideBar` / `navList` 缺失 → 静默跳过，不插空容器。
- 任一组件异常 → 独立 try/catch，catch 里**不写 DOM、不 toast**，仅 `XM.debug===true` 时一条 `console.warn`。
- 全局不变量：`body` 内无空 `<nav>`、无 `src=""` img、无 `href=""` a；任一组件失败不中断 `ready()` 其余初始化。

同时按 `docs/qa-checklist.md` §3.2 实现配置归一化（**纯函数，不写回 `window.XM`**）：
`XM` 非对象 → `{}`；非法值一律 fail-open 到默认、**不半应用**；
`theme` 的 `auto` 必须显式写 localStorage，**绝不 `removeItem`**；
`accent` 合法时四项全写、非法时全不写；新增 `features.*`（`toc/copy/lineNumbers/lightbox/readingTime/progress`），
`false` 时组件 **DOM 完全不出现**（不是 hidden）、监听不注册；
`XM.selectors` 按 key **合并**进映射表（非替换），非法选择器被吞掉回落默认。

**已完成（历史记录）**：`src/adapter.js` 末尾的多余全局 `window.XM_SELECTORS` 已删除，只保留单一句柄 `window.XM_ADAPTER`；详见 `docs/adapter.md`「全局暴露」。

### Step B · 视觉令牌层（`src/tokens.css`）
1. 新增 `visual-spec.md` §4.1 的 12 个 token（`:root` 一次定义，注释英文）。
   跨模式常量（code-block / code-copy / code-ln-fg / lightbox-scrim）**浅色两套禁止覆写**。
2. 浅色两套（`@media (prefers-color-scheme: light) :root:not([data-theme="dark"])`
   与 `html[data-theme="light"]`）按 `visual-spec.md` §3.2 全表**逐项一致**替换。
   重点：`--xm-border-strong` 由 `#74869f` → **`#5a6d85`**（旧值在新浅色底色上 2.97:1 破 3:1 线）；
   `--xm-grad-end` → **`#8f5210`**（重建冷暖分工，旧值 `#0f4fa8` 与 accent 色相差仅 0.3°）。
   `tokens.css:180` 缩进异常顺手对齐。
3. 删 `--xm-content-w`；`--xm-font-mono` 补中文回退；`≤640px` 字号阶梯按 `visual-spec.md` §6 补齐
   （`--xm-fs-caption` 保持 12px 可读下限）。

### Step C · 视觉兑现层（`src/base.css` / `src/components.css`）
1. `visual-spec.md` §4.2 的 **16 处**硬编码色值替换（不是 5 处）。
2. 品牌节点：`base.css` 追加 3 条规则，**不改**现有 `#blogTitle h1::after`(128-137)；
   `components.css` §16 追加 reduced-motion 终态。
3. 非文章页 3 处密度提升（首页轨道刻度 / 归档 hover 面 / 跨页轨道站点节点），
   §16 追加终态；不加阴影、不卡片套卡片、不新增 JS 监听。
4. 氛围参数微调：`body::before` 的 `inset` 顶部 `-25%` → `-8%`，
   `body::after` `opacity:.5` → `.7`，星点 alpha 提升。**`position:fixed` 保持不动**（视觉侧已自我纠错：
   不存在「滚到长文中段氛围塌陷」，真问题是亮部被推出视口 + 星点几乎不可见）。

### Step D · 无障碍必修（体验规范，三处 + 三项次要）
按体验规范逐函数改法（本文件 §4 汇总），核心：
1. **灯箱**：`div` → 原生 `<dialog>` + `showModal()`；只处理未被 `<a>` 包裹的图，绝不 `preventDefault`
   吞链接；`markZoomable()` 加 `tabindex/role/aria-label`；事件委托替代全量绑定；
   可见关闭按钮 ≥44px；`close` 事件统一清理并回焦 `lastTrigger`；
   无 `showModal` 时降级并**显式 `aria-modal="false"`**；删 `enhance.js:856-858` 旧 Esc 监听，
   加统一 Esc 分发器；TOC 监听加 `if(lbMask && lbMask.open) return;` 守卫；
   CSS 配对 `.xm-lightbox:not([open]){display:none}` / `[open]{display:flex}`。
2. **触屏复制按钮**：`.xm-copy` 基规则加 `pointer-events:none`（修「看不见却能点」的幽灵热区）；
   显现规则扩到 4 条并全部 `pointer-events:auto`；
   新增 `@media (hover:none), (any-pointer:coarse)` 常显块（**不要**用 `max-width:640px`）；
   触屏常显后用现有间距 token 避免压住首行代码。
3. **复制播报**：新建唯一 `#xm-copy-status`（`role=status`/`aria-live=polite`/`aria-atomic=true`，
   复用 `.xm-sr-only`）；按钮固定 `aria-label="复制代码"` 永不修改（防双播）；
   `announce()` 同步清空 + rAF 重写；`fallbackCopy()` 改**返回 boolean**，
   失败播「复制失败，请手动选择代码」且不显示「已复制」；
   1600ms 定时器再次点击时先 `clearTimeout`。
4. **三项次要**：`contentObs`（只观察 `childList/subtree`，**绝不观察 attributes**，
   独立 100ms 防抖，**绝不触碰** `lnObs`/`lnTimer`/`settleLn()` 及其 6s 断连策略）；
   `≤640px` 目录高度改为 ≥视口 40% + `overscroll-behavior:contain`；
   最小版 skip link / landmark（解析不到正文容器时**不插** skip link）。
5. **保留**：`updateSpy()` 在 `!tocOpen` return 属产品决策，**不改**。

### Step E · JS 侧令牌破口（`src/enhance.js:50-56`）
`applyAccent()` 写入的 `--xm-glow` 全仓零消费（CSS 用 `--xm-glow-color`/`--xm-glow-accent`），
改为写 `--xm-glow-color`；`hexToRgba()` 失败兜底由青绿 `rgba(94,234,212,…)`
改为品牌冷蓝 `rgba(95,178,255,<alpha>)`。
刻意**不**被 `XM.accent` 覆盖：`--xm-accent-2`、`--xm-grad-end`、`--xm-accent-deep`、
`--xm-selection`、`--xm-glow-accent`（文档写明，避免误判为遗漏）。

### Step F · 页首 / 文档 / 构建
1. `build.js` 的 `spinner` 模板常量加 favicon `<link>`（data URI，透明底，零外链）；
   **必须同步改模板常量**，否则下次构建会丢。
2. `README.md:11`（**不是 :14**）替换为四底色对比度最差值表。
3. 新增文档：`docs/components.md`（shadcn 三层：`visual-spec.md` §7 骨架 + **16** 个组件清单）、
   `docs/tokens.md`、`docs/assets/stellaris-mark.svg`、`docs/assets/og-cover.svg`。
4. `node build.js` 重建 `dist/`（第一批 dist 冻结红线此时解除）。
   **只交 `dist/*.paste.*`**，不贴 `custom.min.css`。

## 4. 验收（必做，不可只报「已完成」）

1. `node --check` 每个改动的 JS。
2. `build.js` 能跑通；确认 `JS_ORDER` 顺序、`</script` 检测覆盖每个 JS 源、页脚仍 4 段 script。
3. Grep `src/base.css` / `layout.css` / `components.css` 的 `#<hex>` 与 `rgba?\(` →
   **0 命中**（`color-mix(in srgb, var(--xm-bg-elevated) 78%, transparent)` 允许）。
   `dist` 内不再有 `#0b1118`/`#dce6f2`/`#cdd9e8`/`#7ee0a6` 字面量（tokens 定义段除外）。
4. 按 `docs/qa-checklist.md` 跑 **P0 子集**（A01–A13、A16–A23、A25/A26、A29–A33、A34、A35）。
   用固定 fixture + CDP `Emulation.*`，离线可跑；报告给出逐条 pass/fail 与总数。
5. 四底色对比度复算（深浅各表，取最差值），确认 ≥4.5:1 / UI 边界 ≥3:1。
6. `keep.css` 的 `*{cursor:url(mouse.ico)}` 仍在且正文 img **无内联 `style.cursor`**；
   `#loading` 的 `z-index:99999999` 未变。
7. `XM.accent` 改色后发光跟随、暖金不跟随；reduced-motion 下扫光/节点/复制按钮终态可见；
   ≤640px 无横向溢出。

**证据边界（如实保留）**：P0 全绿只把「结构化/可自动化证据」从 5/10 提到约 8/10。
剩余 2 分必须靠真机移动端视觉 + 人工读屏（NVDA/VoiceOver）+ 真实读者数据，
不得把「断言全绿」写成「已完成无障碍验收」。

## 5. 报告要求

用 SendMessage 把**正文**发回 main，包含：
- 改动清单（每个文件：原来怎样 / 现在怎样 / 为什么）；
- 自验结果（逐项，含 P0 断言 pass/fail 总数、dist 新旧 md5、grep 命中数）；
- **部署清单**：需重贴哪几个框、粘贴顺序、保存后如何 curl 核验；
- 遗留事项与「未核实」项（中文字体族名、Safari SVG favicon、各平台 SVG og:image 接受度、
  归档/标签页真实 DOM 细节）。

硬约束：**不做任何 git 写操作**、**不操作博客园后台**、**不重贴线上框**、
不手改 `dist/*`（全部由 `node build.js` 生成）、代码注释英文、注释只写「为什么」。

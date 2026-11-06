# 星轨 Stellaris · 验收断言清单

> 本文是第二批代码改动与 `tests/` 用例的唯一断言源，由体验设计侧产出、主理人汇编落盘。
> 目的：把「证据充分度」从代码级判断提升到可复跑的结构化验证。
> 约定：`q(s)` = `document.querySelector`，`cs(e,p)` = `getComputedStyle(e)[p]`，`n(s)` = 匹配数量。
> 每条断言必须可判定为 yes / no，不接受「看起来正常」这类主观结论。

## 1. 环境矩阵

| 代号 | 环境 |
|---|---|
| E1 | 桌面 1440×900，`hover:hover` / `pointer:fine` / dark |
| E2 | 同 E1，但 light |
| E3 | 触屏 390×844，`hover:none` / `pointer:coarse` |
| E4 | E1 + `prefers-reduced-motion:reduce` |
| E5 | 逐个移除映射节点（header / sideBar / navList / blogLogo / postBody） |
| E6 | 后台「显示行号」开（注入 `table.hljs-ln`） |
| E7 | 后台「显示行号」关（自实现 gutter） |

CDP 用 `Emulation.setDeviceMetricsOverride`、`Emulation.setTouchEmulationEnabled`、
`Emulation.setEmulatedMedia`（features: `hover` / `pointer` / `prefers-reduced-motion` / `prefers-color-scheme`）。

**Harness**：固定 fixture HTML，模拟 SimpleMemory 骨架（header / navList / mainContent /
sideBar / postBody 含 h2、h3、被 `<a>` 包裹的 img、裸 img、两个 `pre`、logo 位），
直接注入 `src/adapter.js` + `src/enhance.js`；离线可跑，不依赖博客园线上。
另保留一组 CDP 冒烟跑真实页面。

## 2. 断言清单

| ID | 场景 | 断言 | 期望 |
|---|---|---|---|
| A01 | E1 | `document.body.firstElementChild` 是 `a.xm-skip` 且 `tabIndex>=0` | yes |
| A02 | E1 | 激活 skip link 后 `activeElement===q('#xm-main')`，其 `tabIndex===-1`、`role==='main'` | yes |
| A03 | E1 | 点 `<a><img></a>` 内的 img：`e.defaultPrevented===false` 且 `q('dialog.xm-lightbox[open]')===null` | yes |
| A04 | E1 | 裸 img 具备 `data-xm-zoom="1"`、`tabindex="0"`、`role="button"`、非空 `aria-label`；`img.style.cursor===""` | yes |
| A05 | E1 | focus 裸 img 后 `keydown{key:'Enter'}` → `q('dialog.xm-lightbox[open]')!==null` | yes |
| A06 | E1 | `keydown{key:' '}` 同样打开且 `defaultPrevented===true` | yes |
| A07 | E1 | `dlg.matches(':modal')===true` 且 `dlg.getAttribute('aria-modal')==='true'` | yes |
| A08 | E1 | 打开后 `dlg.contains(activeElement)` 且 `activeElement===q('.xm-lightbox__close')` | yes |
| A09 | E1 | 灯箱内连续 Tab 10 次，`dlg.contains(activeElement)` 恒为 true | yes |
| A10 | E1 | Esc / 关闭按钮 / 点遮罩三条路径各自：`dlg.open===false`、body 无 `xm-lb-open`、`activeElement===lastTrigger` | yes |
| A11 | E1/E3 | 关闭按钮 `display!=='none'` 且 rect 宽高 ≥ 44px | yes |
| A12 | E1 | 点灯箱内 `<img>` 不关闭；点 `e.target===dlg` 空白区关闭 | yes |
| A13 | E3 | 触屏无 Esc，点关闭按钮可关闭并回焦 | yes |
| A14 | E1 | 先 `openToc()` 再开灯箱，`tocOpen` 仍为 true | yes |
| A15 | E1/E5 | `keep.css` 的 `*{cursor:url(...)}` 规则仍在；正文 img 无内联 `style.cursor` | yes |
| A16 | E1 | `.xm-copy` 默认 `cs(btn,'opacity')==='0' && cs(btn,'pointerEvents')==='none'` | yes |
| A17 | E1 | `btn.focus()` 后 `opacity==='1'`、`pointerEvents==='auto'`、`outlineStyle!=='none'` | yes |
| A18 | E3 | `hover:none` 下无需 hover/focus 即 `opacity==='1'`；`elementFromPoint(btn 中心)` 命中按钮 | yes |
| A19 | E1 | `q('#xm-copy-status')` 唯一，`role==='status'`、`aria-live==='polite'`、`aria-atomic==='true'`、class 含 `xm-sr-only` | yes |
| A20 | E1 | 点击前后 `btn.getAttribute('aria-label')==='复制代码'` 不变 | yes |
| A21 | E1 | 监听 `#xm-copy-status`，一次点击 1600ms 内恰好一次 `""→"已复制代码"` | yes |
| A22 | E1 | 连续两次点击产生两次播报 | yes |
| A23 | E1 | stub `clipboard.writeText` reject + `execCommand` 返回 false → 播报失败文案、按钮仍「复制」、无 `is-done` | yes |
| A24 | E6/E7 | 两分支：`codeTextOf(pre)` 不含 `\t`、不含连续 `\n\n`，行数 == 可见代码行数，行号数字不出现在复制文本 | yes |
| A25 | E6 | 有 `table.hljs-ln`：`q('.xm-code-ln')===null`、`cs(pre,'display')==='block'`、复制走 `td.hljs-ln-code` | yes |
| A26 | E7 | 无原生行号：`.xm-code-ln` 存在、`aria-hidden==='true'`、行数与 `code.textContent.split('\n')` 一致 | yes |
| A27 | E1 | 插入新 h2，≤250ms 内 TOC 项数 +1；既有 item `href`/id 不变；`[aria-current="location"]` ≤1；`data-xm-toc` 无重复 | yes |
| A28 | E1 | 插入新 img 后 ≤250ms 具备 A04 属性；`settleLn()` 仍正常、无重复 gutter | yes |
| A29 | E1/E2 | dark/light 下 `--xm-bg` 计算值不同；`pre` 背景两态固定深色；`.xm-copy` 与焦点环两态可辨 | yes |
| A30 | E1/E2 | themeBtn 无 `aria-pressed`/`role="switch"`；连点 3 次 `auto→dark→light→auto`；`aria-label` 与 `title` 同步 | yes |
| A31 | E4 | `cs(html,'scrollBehavior')==='auto'`；`scrollTo` behavior 为 `'auto'`；`.is-active` 的 `transitionDuration` 近似 0 | yes |
| A32 | E3 | `.xm-toc__body` 可见高度 ≥ `innerHeight*0.4`；`.xm-toc` rect 完全在视口内且与 `.xm-fab` 不相交 | yes |
| A33 | E1/E3 | `.xm-toc[hidden]` 与 `.xm-fab__btn--top[hidden]` 内部元素均不在 Tab 序列 | yes |
| A34 | E5 | 逐个移除 header/sideBar/navList/blogLogo/postBody 重载：无 uncaught、无空 nav、无 `src=""` img、主题按钮与进度条仍工作 | yes |
| A35 | E1 | `XM` 未定义 / `theme='bogus'` / `accent='nothex'` / `logo=404` 四种：无异常，DOM 与默认值一致 | yes |
| A36 | E1 | `XM.features.lightbox=false` → `q('dialog.xm-lightbox')===null` 且点裸 img 不打开；其余组件 DOM 仍在 | yes |

**P0 必跑子集**：A01–A13、A16–A23、A25、A26、A29–A33、A34、A35。其余为 P1 扩展。

## 3. 硬契约（实现不得偏离）

### 3.1 适配层缺失 DOM 时的静默降级

| 缺失节点 | 行为 |
|---|---|
| `postBody` | 不建 TOC / 灯箱 / 阅读时长 / 标题 id / `contentObs`；**主题切换、进度条、FAB、代码块复制仍可用** |
| `header` | `measureHeader()` 直接 return，保留 CSS 兜底 `var(--xm-s14)`，**不写 0** |
| `sideBar` | 不改 `top`，不留空框、不插占位 |
| `navList` | 跳过 `is-current`，不插空导航 |
| `blogLogo` | `initLogo()` 直接 return，不新建 img、不留空心圈 |
| `codeBlocks` 空 | 不加复制按钮 / 行号槽 / **不注册 `lnObs`** |
| `tagList` / `mainContent` | 不注入容器、不插 skip link |
| 组件内部异常 | 独立 try/catch；catch 里**不写 DOM、不 toast**；仅 `XM.debug===true` 时一条 `console.warn` |

全局不变量：`body` 内不得出现空 `<nav>`、`src=""` 的 img、`href=""` 的 a；任一组件失败不得中断 `ready()` 其余初始化。

### 3.2 配置的合法 / 缺省 / 非法三态

所有非法值一律按「未提供」处理（fail-open 到默认值），不抛错、**不半应用**。

- `XM.theme`：`auto|dark|light`；非法值回落 `auto`；`auto` 必须显式写 `localStorage`，**绝不 `removeItem`**。
- `XM.accent`：`#RGB` / `#RRGGBB`；合法时 `--xm-accent` / `--xm-accent-text` / `--xm-accent-soft` / `--xm-glow` 四项**全部**写入；非法时**全不写**。
- `XM.logo`：预加载 `onload && naturalWidth>1` 才写 `width/height/alt/src`；失败时与「未配置」呈现完全一致。
- `XM.features.*`（`toc/copy/lineNumbers/lightbox/readingTime/progress`）：`false` 时组件 **DOM 完全不出现**（不是 hidden），监听不注册。
- `XM.selectors`：合法覆盖**合并**进映射表（非替换），非法选择器被 try/catch 吞掉回落默认。
- `window.XM` 非对象（字符串 / 数组 / 未定义）→ 一律 `{}`。

## 4. 证据边界（必须如实保留）

P0 全绿后，「结构化 / 可自动化证据」从 5/10 提升到约 8/10。
**剩余 2 分必须靠真机移动端视觉、人工读屏（NVDA / VoiceOver）与真实读者数据**，
不能靠断言补齐。任何对外报告都不得把「断言全绿」写成「已完成无障碍验收」。

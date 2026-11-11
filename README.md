# 星轨 Stellaris

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CDN: jsDelivr](https://img.shields.io/badge/CDN-jsDelivr-orange)](https://www.jsdelivr.com/package/gh/guolunwei/cnblogs-theme-stellaris)
[![GitHub stars](https://img.shields.io/github/stars/guolunwei/cnblogs-theme-stellaris?style=flat-square)](https://github.com/guolunwei/cnblogs-theme-stellaris/stargazers)

**原生 JS、零构建链的博客园主题：三个后台输入框手动粘贴即可上线，不用 npm、框架或本地构建；深色为设计基线，视觉全部收进一份设计令牌，改一处即可换肤。**

> 深夜为底，轨道为线，光有温度，等宽为骨。

[部署文档](docs/deployment.md) | [在线演示](https://www.cnblogs.com/home) | [文章页样例](https://www.cnblogs.com/home/p/23550137) | [源码](https://github.com/guolunwei/cnblogs-theme-stellaris)

> 两种装法都要手动粘贴，没有自动安装脚本；精简版只是把页脚框从 44KB 降到约 2KB。

## 预览

- **在线演示（本站即在线效果）**：<https://www.cnblogs.com/home> —— 首页、列表、侧栏与深浅三态都在这里。
- **文章页样例**：<https://www.cnblogs.com/home/p/23550137> —— 正文、代码块、目录 TOC、复制按钮。

仓库只提交 SVG 资产（`docs/assets/stellaris-mark.svg`、`docs/assets/og-cover.svg`），不含二进制 PNG 截图；看真实效果请直接打开上面两个链接。

## 特性

- **三态主题**：`auto` 跟随系统 / `dark` 常驻深色 / `light` 常驻浅色，切换状态可记忆。深色是设计基线与默认视觉形态（「默认」仅指设计层面，运行时 `theme` 默认为 `"auto"`，并非恒为深色），浅色是逐项平行推导的独立配色，不是简单反色。
- **设计令牌换肤**：颜色、字体、间距、圆角、描边、动效、层级、断点全部收进一份令牌作为唯一真源，语义层不出现色值字面量；改 `src/tokens.css` 的 `:root` 即可整体换肤。
- **完整设计系统**：冷蓝管技术、暖金管人、等宽字体扛元信息；响应式窄屏（≤640px）侧栏落到正文下方，不横向溢出。
- **内置无障碍**：文字对比度 ≥4.5:1、UI 边界 ≥3:1 两套配色逐项核过，焦点可见、灯箱焦点陷阱与 Esc 回焦、复制结果由 live region 播报。
- **阅读增强**：三态主题切换、阅读进度条、返回顶部、目录 TOC、代码块一键复制（含行号槽）、图片灯箱、阅读时长。
- **零构建链**：`build.js` 只用 Node 内置模块，页脚脚本是零依赖原生 JS；交付物是三个可直接粘贴的文本，不要求使用者本地构建。

<details>
<summary>对比度实测（按 WCAG 门槛逐项核过，展开看数字）</summary>

按每套主题下四种底色逐一复算并取最差值：

| 底色 | 正文 | 次要 | 弱文字 | 链接 | 暖色/渐变终点 | UI 边界 | 主按钮 |
|---|---|---|---|---|---|---|---|
| 深色 | 12.46:1 | 7.21:1 | 5.14:1 | 6.45:1 | — | 3.92:1 | 8.28:1 |
| 浅色 | 13.89:1 | 6.52:1 | 5.24:1 | 6.21:1 | 5.24:1 / 4.97:1 | 4.24:1 | 5.24:1 |

文字 ≥4.5:1、UI 边界 ≥3:1 全部达标；代码块按 `#0b1118` 固定深色单独自检（`#dce6f2` 15.03:1、`#cdd9e8` 13.26:1、`#7ee0a6` 11.83:1）。这些是主题自检算出来的对比度，不是第三方评测。

</details>

## 安装前

动手之前先确认下面四项，漏了会表现为「样式没生效」或「只有样式、没有交互」：

1. 博客园后台 →「设置」，把**博客皮肤设为 SimpleMemory**。
2. 勾选 **「禁用模板默认CSS」**。
3. **申请 JS 权限**：按博客园官方流程提交开通申请，开通后再继续；未开通时页脚 `<script>` 不会执行。
4. **逃生通道**：配置写错导致博客打不开时，直接访问 <https://i.cnblogs.com/settings>，清空对应输入框保存即可恢复——不用重装、也不会丢博文。

> **CSS 必须整框内联，两种装法都一样。** 样式表若走外链，会先以平台默认皮肤渲染、样式后到再重排（FOUC，页面闪动），首屏体验明显变差。因此 `dist/custom.paste.css` 始终整份粘进「页面定制CSS代码」；精简版精简的只是页脚框，绝不存在 CSS 外链的选项。

## 快速开始

两种装法**只有页脚框不同**，CSS 与页首两框完全一样。按自己的情况选一种，不要混贴。

### 方式一：精简版（推荐）

**如果你想改配置或升级时只动几行、不想重贴大框 → 选这个。** 页脚从 44KB 降到约 2KB：`window.XM` 配置段与两个条件注入器内联，增强主脚本走 jsDelivr 外链。

| 后台输入框 | 粘贴文件 |
|---|---|
| 页面定制CSS代码 | `dist/custom.paste.css`（整框内联，见 dist/） |
| 页首HTML代码 | `dist/page-begin.paste.html`（717 B） |
| 页脚HTML代码 | `dist/page-end.cdn.paste.html`（约 2 KB） |

页脚框的核心是下面这几行（**实际请整份复制** `dist/page-end.cdn.paste.html`：下面只展开要改的 `window.XM` 与外链入口，完整文件还包含百度统计、光标特效两个条件注入器）：

```html
<script>
window.XM = {
  theme: "auto",       // "auto" | "dark" | "light"
  accent: null,        // e.g. "#FF7A59"; null keeps the default cold blue
  logo: null,          // e.g. "https://.../avatar.png"; null keeps platform default
  analyticsId: null,   // Baidu Tongji ID; null disables the request entirely
  cursorEffects: "https://blog-static.cnblogs.com/files/home/cursor-effects.js", // replace or set null on your own blog
  cursorUrl: null      // override --xm-cursor at runtime; null keeps the CSS default
};
</script>
<script src="https://cdn.jsdelivr.net/gh/guolunwei/cnblogs-theme-stellaris@main/dist/stellaris.js"></script>
```

`dist/stellaris.js` 是 `src/adapter.js` + `src/enhance.js` 拼接的增强主脚本（约 50KB），托管在 jsDelivr，URL 用 `@main`（仓库当前无 tag）。

- **好处**：改配置、升级增强脚本都不用重贴 44KB 的大框，只动页脚几行即可。
- **代价**：依赖 jsDelivr 可用性；CDN 不可达时视觉样式仍在，仅交互增强失效（见「常见问题」）。

### 方式二：完整离线版

**如果你不想要任何外部请求、或需要断网也能完整使用 → 选这个。** 三个框全部整框内联粘贴，页脚用 44749 B 的 `dist/page-end.paste.html`（配置段 + 两个条件注入器 + 增强主脚本，共 4 段内联 `<script>`）。

| 后台输入框 | 粘贴文件 |
|---|---|
| 页面定制CSS代码 | `dist/custom.paste.css`（整框内联，见 dist/） |
| 页首HTML代码 | `dist/page-begin.paste.html`（717 B） |
| 页脚HTML代码 | `dist/page-end.paste.html`（44749 B） |

- **好处**：零外部请求，断网可用，不依赖任何 CDN。
- **代价**：粘贴量大；升级增强脚本需要把页脚整框重贴一遍。

> 两种装法的每个框都按 [docs/deployment.md](docs/deployment.md) 第 ② 条的**「二次 Ctrl+A」**铁律操作（点进编辑器 → `Ctrl+A` → `Delete` → `Ctrl+V` → **再按一次 `Ctrl+A`** → 保存），漏掉第二次全选只会存下选区片段。缓存戳与保存后读回核验也在同一文档。

## 配置

改配置不用重贴主脚本、不用动另外两个框：只在「页脚HTML代码」框里编辑 `window.XM` 那一小段，保存即生效（精简版与完整版都一样）。

```js
window.XM = {
  theme: "auto",   // "auto" | "dark" | "light"
  accent: null,    // e.g. "#FF7A59"; null keeps the default cold blue
  logo: null,      // e.g. "https://.../avatar.png"; null keeps platform default
  analyticsId: null,   // Baidu Tongji ID; null disables the request entirely
  cursorEffects: "https://blog-static.cnblogs.com/files/home/cursor-effects.js", // replace or set null on your own blog
  cursorUrl: null      // override --xm-cursor at runtime; null keeps the CSS default
};
```

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `theme` | `"auto" \| "dark" \| "light"` | `"auto"` | 三态主题 |
| `accent` | 十六进制字符串 / `null` | `null` | 覆盖主强调色 |
| `logo` | URL 字符串 / `null` | `null` | 头像；加载失败静默回退平台默认 |
| `analyticsId` | 32 位十六进制字符串 / `null` | `null` | 百度统计 ID；**默认关闭**，只接受合法 ID，否则不创建脚本、不发请求 |
| `cursorEffects` | `http(s)://` URL 字符串 / `null` | 原作者博客路径 | 光标特效脚本；**首次使用请替换成自己的 URL 或置 `null` 关闭**，非法值不加载 |
| `cursorUrl` | `http(s)://` 或 `data:image/` URL / `null` | `null` | 运行时覆盖 `--xm-cursor`；留 `null` 用 CSS 默认 |

> **换博客前先改这三项**：`analyticsId` 默认 `null`（不加载、不发任何请求，别填成别人的 ID）；`cursorEffects` 默认指向原作者博客 `/home/` 路径下的 `cursor-effects.js`，换博客要换成自己的 URL 或置 `null`，否则会 404；`cursorUrl` 默认 `null`（走 CSS 默认光标）。三项都是账号专属的可选资源，去掉也不影响主题其余功能。

非法值一律回落默认、不抛错。`features` / `selectors` / `debug` 等进阶开关与完整字段说明见 [docs/configuration.md](docs/configuration.md)，不在 README 堆枚举。

## 常见问题

**Q：粘贴后样式没生效？**
A：博客园 `custom.css` 走 CDN，每次保存会换 `?v=` 缓存戳，但边缘节点同步有延迟。本地 `Ctrl+Shift+R` 硬刷新或等几分钟；仍不生效就再保存一次（新键没有陈旧缓存）。排查顺序见 [docs/deployment.md](docs/deployment.md) 第 ③④ 条。

**Q：页脚脚本完全不执行，只有样式没有交互？**
A：多半是 **JS 权限未开通**（见「安装前」第 3 条），未开通时页脚 `<script>` 不会执行。开通后再重载页面即可。

**Q：明明整份复制了，保存后却只有一小截？**
A：后台 CodeMirror 下面藏了真实 `<textarea>`，表单提交读的是它的值。漏掉第二次 `Ctrl+A` 只会存下选区片段。按 [docs/deployment.md](docs/deployment.md) 第 ② 条「二次 Ctrl+A」重贴一遍，再按第 ⑤ 条重载设置页读回确认。

**Q：配置写错、博客打不开了怎么撤回？**
A：直接访问 <https://i.cnblogs.com/settings>，清空对应输入框（页脚框）保存即可恢复，不会丢博文。改回 `window.XM` 默认值后再重贴。

**Q：精简版的 jsDelivr 挂了会怎样？**
A：CSS 与页首是内联的，视觉样式、布局、配色仍完整；只有 `dist/stellaris.js` 提供的交互增强（TOC、复制、灯箱、进度条、三态切换等）暂时失效，页面不会白屏。可随时切回「方式二：完整离线版」，或等 CDN 恢复。

**Q：仓库更新了，精简版的增强功能怎么还是旧的？**
A：外链走 jsDelivr 的 `@main`，CDN 对分支内容有缓存（约 12 小时），push 后不会立刻全网生效。等缓存过期即可；想立刻拿到新版本、或要锁死版本，把 URL 里的 `@main` 换成固定 commit hash 或 tag（代价是以后升级都得改 URL）。完整离线版不受影响，重贴页脚即生效。注意 `@main` 内容可变，所以精简版刻意不用 SRI。

## 换肤

两种方式，按改动幅度选：

- **轻量**：编辑页脚的 `window.XM`（主题三态、主色、头像），保存即生效，不用重新构建、不用重贴 CSS。
- **整体**：改 `src/tokens.css` 顶部 `:root` 的设计令牌（`--xm-accent` / `--xm-bg` / `--xm-font-sans` 等），然后 `node build.js` 重新生成 `dist/`，再重贴「页面定制CSS代码」。

## 开发

```bash
node build.js                    # 可选：本地重建 dist/（仅改了 src 才需要）
node tests/run.js                # 一键回归：顺序跑 CDP 诊断脚本并汇总 pass/fail
node tests/run.js --dry-run      # 只列出回归项与 Chrome 探测结果，不连线上
```

前置条件（Node 18+、本机 Chrome/Edge、为何需要 CDP）与结果怎么看，见 [tests/README.md](tests/README.md)。部署后的排查手册见 [docs/deployment.md](docs/deployment.md)；选择器适配层见 [docs/adapter.md](docs/adapter.md)；配置见 [docs/configuration.md](docs/configuration.md)；版本变更见 [CHANGELOG.md](CHANGELOG.md)。

## 目录结构

```
xm-theme/
├── build.js              构建脚本（Node 内置模块，无依赖），生成 dist/ 全部产物
├── src/
│   ├── keep.css          保留块：广告隐藏 + 自定义光标 + spinner
│   ├── tokens.css        设计令牌：换肤改这里
│   ├── base.css / layout.css / components.css
│   ├── adapter.js        选择器适配层：XM_SELECTORS 注册表 + pick()
│   └── enhance.js        渐进增强主脚本（零依赖原生 JS）
├── dist/                 交付物：两种装法共用 CSS / 页首，页脚二选一
│   ├── custom.paste.css         页面定制CSS代码（整框内联，两装法共用，见 dist/）
│   ├── page-begin.paste.html    页首HTML代码（717 B）
│   ├── page-end.paste.html      方式二完整离线版页脚（44749 B，4 段内联 script）
│   ├── page-end.cdn.paste.html  方式一精简版页脚（3 段内联 + 1 个外链 script）
│   ├── stellaris.js             adapter.js + enhance.js 拼接，供 jsDelivr 外链（约 50KB）
│   └── config.paste.html        配置段独立快照（不是第四个框）
├── examples/             本地预览生成脚本 mkpreview.js / mk-redesign-preview.js（生成的预览 HTML / 截图不入库）
├── docs/                 部署、配置、适配层文档
└── tests/                CDP 一键回归
```

> `docs/assets/og-cover.svg` 是仓库资产（仅提交 SVG，不提交二进制 PNG）。各平台 `og:image` 普遍要求 http(s) 绝对 URL 的位图，SVG 不被接受；GitHub Social preview 请由仓库所有者在 **Settings → Social preview** 手工上传 PNG。

## License

[MIT](LICENSE) © 2026 guolunwei

## 致谢

- 底座：博客园官方皮肤 **SimpleMemory**——本主题在其 DOM 骨架上叠加样式与增强，不改动皮肤前提。
- 自定义光标（`mouse.ico`）与 `cursor-effects.js`（光标特效）是**可选资源**，并非主题自带：它们与百度统计一起已抽成页脚 `window.XM` 的 `cursorUrl` / `cursorEffects` / `analyticsId` 三个配置项。统计默认关闭；光标资源默认值仍指向原作者博客以保证线上体验不变，换博客请替换或置 `null`（见「配置」）。去掉它们也不影响主题其余功能。

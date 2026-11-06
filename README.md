# 星轨 Stellaris

> 一套**拿来就能贴**的开源博客园主题：零依赖、零构建链、三个输入框即可上线。

深夜为底，轨道为线，光有温度，等宽为骨。视觉全部收进设计令牌，改一处即可换肤；
运行时是零依赖原生 JS，不需要 npm、框架或打包器。

> **源码与更新**：<https://github.com/guolunwei/cnblogs-theme-stellaris>

## 效果与特性

- 深色为默认形态，浅色是一套完整平行配色（不是简单反色）；支持「跟随系统 / 常驻深色 / 常驻浅色」三态。
- 冷蓝管技术、暖金管人，等宽字体扛元信息；对比度按四种底色逐一复算（取最差值）：

  | 底色 | 正文 | 次要 | 弱文字 | 链接 | 暖色/渐变终点 | UI 边界 | 主按钮 |
  |---|---|---|---|---|---|---|---|
  | 深色 | 12.46:1 | 7.21:1 | 5.14:1 | 6.45:1 | — | 3.92:1 | 8.28:1 |
  | 浅色 | 13.89:1 | 6.52:1 | 5.24:1 | 6.21:1 | 5.24:1 / 4.97:1 | 4.24:1 | 5.24:1 |

  文字 ≥4.5:1、UI 边界 ≥3:1 全部达标；代码块按 `#0b1118` 固定深色单独自检
  （`#dce6f2` 15.03:1、`#cdd9e8` 13.26:1、`#7ee0a6` 11.83:1）。
- 阅读增强：三态主题切换、阅读进度条、返回顶部、目录 TOC、代码块一键复制（含行号槽）、图片灯箱。
- 响应式：窄屏（≤640px）侧栏落到正文下方，不横向溢出。
- **零依赖**：`build.js` 只用 Node 内置模块；页脚脚本是原生 JS，不引任何库。
- **三框粘贴**：交付物就是三个可直接粘贴的文本，不要求使用者本地构建。

## 三步安装

前置（重要）：

1. 博客园后台 →「设置」，把博客皮肤设为 **SimpleMemory**，并勾选 **「禁用模板默认CSS」**。
2. 页脚要放 `<script>`，需先向博客园**申请 JS 权限**（未开通时脚本不会执行）。
3. 打开 `dist/` 下对应的 `.paste.*` 文件，整份复制。

| 步骤 | 后台输入框 | 粘贴文件 | 内容 |
|---|---|---|---|
| 1 | 页面定制CSS代码 | `dist/custom.paste.css` | 主题 CSS（已去前导空白） |
| 2 | 页首HTML代码 | `dist/page-begin.paste.html` | 内联 SVG favicon（`data:image/svg+xml` data URI）+ loading spinner，**无 JS** |
| 3 | 页脚HTML代码 | `dist/page-end.paste.html` | 配置段（第 1 段）+ 可选资源条件注入器（统计默认关闭 / 光标特效）+ 增强主脚本 |

> **首次使用必读（换博客必改）**：页脚第 1 段 `window.XM` 里的三项是账号专属资源配置——
> `analyticsId` 默认 `null`（**统计默认关闭**，不加载、不发任何请求）；`cursorEffects` 默认指向
> **原作者博客** `/home/` 路径下的 `cursor-effects.js`；`cursorUrl` 默认 `null`（走 CSS 默认光标）。
> 把主题搬到自己的博客时，`cursorEffects` 必须换成自己的 URL 或置 `null` 关闭，否则会 404；
> `analyticsId` 若要开启统计请填自己的 32 位 ID，否则保持 `null`，不然访问数据会打到原作者账号。
> 三项都集中在配置段，改这里即可，不用重贴 CSS / 页首。

> 为什么都用 `.paste.*`：后台 CodeMirror 会自动缩进，直接贴带缩进的文本会逐行累积；
> `.paste.*` 已去掉每行前导空白，重复粘贴幂等。粘贴手法与全部踩坑见 **`docs/deployment.md`**
> （务必读第 ② 条「二次 Ctrl+A」）。

> `dist/config.paste.html` 只是**配置段的独立快照**，供查看/单独复制，**不是第四个粘贴框**——
> 页脚框里已经包含这段。

## 配置：window.XM

改配置**不用重贴主脚本、不用动另外两个框**：只需在「页脚HTML代码」框里编辑带注释的那一小段
`window.XM`，保存即可生效。完整说明见 `docs/configuration.md`。

```js
window.XM = {
  theme: "auto",   // "auto" 跟随系统 | "dark" 常驻深色 | "light" 常驻浅色
  accent: null,    // 例："#FF7A59"，留 null 用默认冷蓝
  logo: null,      // 例："https://.../avatar.png"，留 null 用平台默认
  analyticsId: null,   // 百度统计 ID（32 位十六进制）；留 null 完全不加载
  cursorEffects: "https://blog-static.cnblogs.com/files/home/cursor-effects.js", // 原作者资源，换博客请替换或置 null
  cursorUrl: null      // 自定义光标 URL；留 null 用 CSS 默认（--xm-cursor）
};
```

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `theme` | `"auto" \| "dark" \| "light"` | `"auto"` | 三态主题 |
| `accent` | 十六进制字符串 / `null` | `null` | 覆盖主强调色 |
| `logo` | URL 字符串 / `null` | `null` | 头像；加载失败静默回退平台默认 |
| `analyticsId` | 32 位十六进制字符串 / `null` | `null` | 百度统计 ID；**默认关闭**，只接受合法 ID，留 `null` / 非法则不创建脚本、不发请求 |
| `cursorEffects` | `http(s)://` URL 字符串 / `null` | 原作者博客路径 | 光标特效脚本；**首次使用请替换成自己的 URL 或置 `null` 关闭**，非法值不加载 |
| `cursorUrl` | `http(s)://` 或 `data:image/` URL / `null` | `null` | 运行时覆盖 `--xm-cursor`；留 `null` 用 CSS 默认，见 `docs/tokens.md` |
| `features` | object | 全部开启 | `toc` / `copy` / `lineNumbers` / `lightbox` / `readingTime` / `progress`；设为 `false` 时该组件 DOM 完全不生成、监听不注册 |
| `selectors` | object | 内置映射表 | 按 key **合并**进 `XM_ADAPTER.SELECTORS`（非替换），见 `docs/adapter.md` |
| `debug` | boolean | `false` | 组件异常时输出一条 `console.warn`，默认静默 |

非法值一律回落默认、不抛错（例如 `theme` 写成别的值等同未设置，`accent` 非十六进制回落默认色）。
页脚配置块暴露上表常用字段，其中 `analyticsId` / `cursorEffects` / `cursorUrl` 为**可选资源**项，
注入器只在值合法时才加载；需要 `features` / `selectors` / `debug` 时，在 `window.XM` 里自行追加一行即可。

## 换肤

两种方式，按改动幅度选：

- **轻量**：编辑页脚的 `window.XM`（主题三态、主色、头像），保存即生效，不用重新构建、不用重贴 CSS。
- **整体**：改 `src/tokens.css` 顶部 `:root` 的设计令牌（`--xm-accent` / `--xm-bg` / `--xm-font-sans` 等），
  然后 `node build.js` 重新生成 `dist/`，再重贴「页面定制CSS代码」。

## 如何跑验收

```bash
node build.js                    # 可选：本地重建 dist/（仅改了 src 才需要）
node tests/run.js                # 一键回归：顺序跑 CDP 诊断脚本并汇总 pass/fail
node tests/run.js --dry-run      # 只列出回归项与 Chrome 探测结果，不连线上
```

前置条件（Node 18+、本机 Chrome/Edge、为何需要 CDP）与结果怎么看，见 **`tests/README.md`**。
部署后的排查手册见 **`docs/deployment.md`**；选择器适配层见 **`docs/adapter.md`**；配置见 **`docs/configuration.md`**。

## 目录结构

```
xm-theme/
├── build.js              构建脚本（Node 内置模块，无依赖）
├── src/
│   ├── keep.css          保留块：广告隐藏 + 自定义光标 + spinner
│   ├── tokens.css        设计令牌：换肤改这里
│   ├── base.css / layout.css / components.css
│   ├── adapter.js        选择器适配层：XM_SELECTORS 注册表 + pick()
│   └── enhance.js        渐进增强主脚本（零依赖原生 JS）
├── dist/                 交付物：三个 .paste.* + 配置段快照 config.paste.html
├── examples/             本地预览生成脚本 mkpreview.js（生成的预览 HTML / 截图不入库）
├── docs/                 部署、配置、适配层文档
└── tests/                CDP 一键回归
```

> `docs/assets/og-cover.svg` 是仓库资产（仅提交 SVG，不提交二进制 PNG）。各平台
> `og:image` 普遍要求 http(s) 绝对 URL 的位图，SVG 不被接受；GitHub Social preview
> 请由仓库所有者在 **Settings → Social preview** 手工上传 PNG。

## License

[MIT](LICENSE) © 2026 guolunwei

## 致谢

- 底座：博客园官方皮肤 **SimpleMemory**——本主题在其 DOM 骨架上叠加样式与增强，不改动皮肤前提。
- 自定义光标（`mouse.ico`）与 `cursor-effects.js`（光标特效）是**可选资源**，并非主题自带：
  它们与百度统计一起已抽成页脚 `window.XM` 的 `cursorUrl` / `cursorEffects` / `analyticsId`
  三个配置项。统计默认关闭；光标资源默认值仍指向原作者博客以保证线上体验不变，
  换博客请替换或置 `null`（见「首次使用必读」）。去掉它们也不影响主题其余功能。

# 配置说明（window.XM）

## 三个框分别贴什么

| 后台输入框 | 文件 | 内容 |
|---|---|---|
| 页面定制CSS代码 | `dist/custom.paste.css` | 主题 CSS |
| 页首HTML代码 | `dist/page-begin.paste.html` | 内联 SVG favicon（data URI）+ loading spinner，无 JS |
| 页脚HTML代码 | `dist/page-end.paste.html`（完整离线版）或 `dist/page-end.cdn.paste.html`（精简版） | 配置段 + 可选资源注入器（统计 / 光标特效）+ 增强主脚本（完整版内联 / 精简版走外链） |

页脚框按装法分两种，配置段都固定在最前：

- **完整离线版**（`dist/page-end.paste.html`）：**4 段独立的 `<script>`**，顺序固定——
  ① `window.XM` 配置段（**第 1 段**）、② 百度统计条件注入器、③ 光标特效条件注入器、
  ④ 增强主脚本（`adapter.js` + `enhance.js`，整段内联）。
- **精简版**（`dist/page-end.cdn.paste.html`）：**3 段内联 + 1 个同步外链**——前 3 段同上，
  第 4 段换成 `<script src="https://cdn.jsdelivr.net/gh/guolunwei/cnblogs-theme-stellaris@main/dist/stellaris.js"></script>`。
  `dist/stellaris.js` 即 `adapter.js` + `enhance.js` 拼接产物（约 50KB），由 jsDelivr 下发；
  仓库无 tag，URL 用 `@main`。两种装法的 CSS 都仍整框内联，不能外链。

配置段必须排在最前：两个注入器要先读到 `window.XM`，才能决定要不要加载资源。
正因为配置单独成段且排在最前，「改配置不用重贴主脚本」才成立（两种装法都一样）。

> `dist/config.paste.html` 是**配置段独立快照**（只含 `window.XM` 那一个 `<script>` 块），
> 供查看与单独复制，**不是第四个粘贴框**。不要把它贴到页首或另开一个框。

## 改配置只动这一小段

要调主题，只需在「页脚HTML代码」框里编辑带注释的那一小段 `window.XM`（第 1 段）：

```html
<!-- ===== 星轨 Stellaris · 配置（改这里就能调主题，详见 README） ===== -->
<script>
window.XM = {
  theme: "auto",   // "auto" 跟随系统 | "dark" 常驻深色 | "light" 常驻浅色
  accent: null,    // 例："#FF7A59"，留 null 用默认冷蓝
  logo: null,      // 例："https://.../avatar.png"，留 null 用平台默认（占位图隐藏）
  analyticsId: null,   // 百度统计 ID；留 null 完全不加载
  cursorEffects: "https://blog-static.cnblogs.com/files/home/cursor-effects.js", // 换博客请替换或置 null
  cursorUrl: null      // 覆盖 --xm-cursor；留 null 用 CSS 默认
};
</script>
```

**主脚本与其它两个框完全不用动**；保存页脚框即生效，不需要重新构建 `dist/`，
也不需要重贴 CSS / 页首。想对照完整配置段，可直接看 `dist/config.paste.html`。

> "这一小段" 指上面配置 `<script>` 块（`window.XM = { ... }` 及其注释），
> 不含其后的统计注入器、光标特效注入器与增强主脚本。两个注入器都从第 1 段读
> `window.XM`：值合法才加载，留 `null` / 非法则静默跳过、不发任何请求。

## 配置字段表

| 字段 | 类型 | 默认 | 当前状态 | 说明 |
|---|---|---|---|---|
| `theme` | `"auto" \| "dark" \| "light"` | `"auto"` | 已生效 | 三态主题；优先级 `localStorage > XM.theme > auto` |
| `accent` | 十六进制字符串 / `null` | `null` | 已生效 | 覆盖主强调色，同步写 `--xm-accent` 等令牌 |
| `logo` | URL 字符串 / `null` | `null` | 已生效 | 头像；内存预加载成功才改 DOM，失败静默回退 |
| `analyticsId` | 32 位十六进制字符串 / `null` | `null` | 已生效 | 百度统计 ID；**默认关闭**，注入器只接受合法 ID，否则不创建脚本、不发请求 |
| `cursorEffects` | `http(s)://` URL 字符串 / `null` | 原作者博客路径 | 已生效 | 光标特效脚本；**首次使用请替换成自己的 URL 或置 `null` 关闭**，只接受 `^https?://` |
| `cursorUrl` | `http(s)://` 或 `data:image/` URL / `null` | `null` | 已生效 | 运行时写 `--xm-cursor`；留 `null` 用 CSS 默认，见 `docs/tokens.md` |
| `selectors` | object | 内置映射表 | 已生效 | 按 key **合并**进 `XM_ADAPTER.SELECTORS`（非替换），见 `docs/adapter.md` |
| `features` | object | 全部开启 | 已生效 | `toc` / `copy` / `lineNumbers` / `lightbox` / `readingTime` / `progress`；设为 `false` 时组件 DOM 完全不生成、监听不注册 |
| `debug` | boolean | `false` | 已生效 | 组件抛异常时输出一条 `console.warn`，默认静默 |

页脚配置块暴露上表常用字段；`analyticsId` / `cursorEffects` / `cursorUrl` 三项是**可选资源**配置，
其中 `cursorEffects` 默认值仍指向原作者博客 `/home/` 路径（线上体验不变），换博客务必替换或置 `null`。
需要 `features` / `selectors` / `debug` 时，在 `window.XM` 里自行追加一行即可，主脚本会读取；
配置归一化是纯函数，**不会写回 `window.XM`**。

## 非法值一律回落默认、不抛错

配置读取分散在主脚本里，全部做了防御：

- `theme`：只有 `"auto" / "dark" / "light"` 合法；其它值（含 `null`、数字、拼错的字符串）
  等同未设置，回落 `"auto"`。
- `accent`：非十六进制字符串在解析时回落到默认冷蓝，不会写入坏掉的 CSS 变量。
- `logo`：非字符串、空串、非法 URL、非 http/https/data 协议、或图片加载失败/超时，
  一律静默回退平台默认头像，不改动 DOM、不抛错（参考 `initLogo` 的独立 try/catch）。
- `selectors`：非法选择器字符串被 try/catch 丢弃并回落默认候选（见 `docs/adapter.md`）。
- `analyticsId`：只接受 `/^[a-f0-9]{32}$/i`（32 位十六进制）。`null` / 空串 / 非法值一律
  **不创建 `<script>`、不发任何请求**；这是 fail-open 到「不加载」，不是回落某个默认 ID。
- `cursorEffects`：只接受以 `^https?://` 开头的字符串。`null` / 空串 / 相对路径 / 其它协议
  一律不注入脚本。`window.XM` 缺失时注入器同样静默 return。
- `cursorUrl`：只接受 `http(s)://` 或 `data:image/` 开头的字符串，且值里禁止出现
  `"` / `;` / `}`（防 CSS 注入，因为值会拼进 `url("...")`）。非法 / `null` 则什么都不做，
  沿用 `tokens.css` 的 `--xm-cursor` 默认值。

两个条件注入器都在 `window.XM` 缺失时静默 `return`，不抛错、不写 DOM；
统计与光标特效引用不再是写死在页脚的标签，而是「配置合法才动态注入」。

换句话说：**写错配置最多让该项回到默认，绝不会把整段脚本弄崩**。

## 部署相关

粘贴手法、二次 `Ctrl+A`、CDN 缓存戳与保存后读回确认，见 `docs/deployment.md`。

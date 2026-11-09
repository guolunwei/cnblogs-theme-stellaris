#!/usr/bin/env node
/**
 * 星轨 Stellaris · 构建脚本
 * 用法：node build.js
 * 产出：
 *   dist/custom.css              可读版 CSS（页面定制CSS代码 · 源文件，改样式改这里）
 *   dist/custom.min.css          压缩版 CSS（同上，单行，粘贴更稳）
 *   dist/custom.paste.css        粘贴版 CSS（去前导空白）
 *   dist/page-begin.html         页首HTML代码（loading spinner，不含 JS）
 *   dist/page-begin.paste.html   页首粘贴版
 *   dist/page-end.html           页脚HTML代码（配置 + 统计 + 光标特效 + 内联增强脚本）
 *   dist/page-end.paste.html     页脚粘贴版（全内联，默认安装方式）
 *   dist/config.paste.html       配置段独立快照（不是第 4 个粘贴框）
 *   dist/stellaris.js            增强脚本独立产物（adapter.js + enhance.js，供 CDN 外链）
 *   dist/page-end.cdn.html       精简页脚可读版（①②③ 内联 + ④ 外链）
 *   dist/page-end.cdn.paste.html 精简页脚粘贴版
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "src");
const DIST = path.join(__dirname, "dist");

const CSS_ORDER = ["keep.css", "tokens.css", "base.css", "layout.css", "components.css"];
const JS_ORDER = ["adapter.js", "enhance.js"];

/* Optional output override for dry-run/verification: build changes can be
   validated in a temp dir without touching the shipped paste artifacts. */
const rawOut = process.env.XM_BUILD_OUT
  || ((process.argv.find((a) => a.startsWith("--out=")) || "").slice(6));
const OUT = rawOut ? path.resolve(__dirname, rawOut) : DIST;

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

/* ---------- CSS ---------- */
const css = CSS_ORDER.map((f) => {
  const p = path.join(SRC, f);
  if (!fs.existsSync(p)) throw new Error("缺少源文件: " + f);
  return `/* ==== ${f} ==== */\n` + fs.readFileSync(p, "utf8").trim() + "\n";
}).join("\n");

fs.writeFileSync(path.join(OUT, "custom.css"), css, "utf8");

const min = css
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\s*\n\s*/g, "")
  .replace(/\s{2,}/g, " ")
  .replace(/\s*([{};:,>])\s*/g, "$1")
  .trim();

fs.writeFileSync(path.join(OUT, "custom.min.css"), min, "utf8");

// 粘贴安全版：去注释、压空白，但保留原有换行结构。
// 博客园的 CSS 文本框是 CodeMirror，超长单行会渲染崩溃，所以不要用 custom.min.css 直接贴。
const paste = css
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/[ \t]+/g, " ")
  .replace(/ *\n */g, "\n")
  .replace(/\n{2,}/g, "\n")
  .replace(/^\n+|\n+$/g, "")
  .trim();

fs.writeFileSync(path.join(OUT, "custom.paste.css"), paste, "utf8");

/* ---------- 页首 ----------
 * 只放 loading spinner。JS 全部放页脚 —— 博客园后台明确建议「JS 权限已开通，
 * 建议在页脚HTML代码中添加代码」，而且页首混入 <script> 会让 CodeMirror
 * 自动缩进把整段 HTML 逐行缩进，后续维护很难看。
 */
/* JS sources are concatenated in order so the adapter registers window.XM_ADAPTER
   before enhance.js runs. Mirrors CSS_ORDER; every source is checked for an
   inline script-closing token that would break the pasted footer. */
const js = JS_ORDER.map((f) => {
  const p = path.join(SRC, f);
  if (!fs.existsSync(p)) throw new Error("Missing JS source: " + f);
  const text = fs.readFileSync(p, "utf8").trim();
  if (text.includes("</script")) throw new Error(f + " contains a script-closing token");
  return `/* ==== ${f} ==== */\n` + text + "\n";
}).join("\n");

/* Favicon is a data URI (transparent background, zero external requests) and
   lives in this template constant so every rebuild keeps it. Brand-level color
   changes must be synced in three places: the SVG file, this URI, og-cover. */
const spinner = `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cellipse cx='12' cy='12' rx='10' ry='4.5' transform='rotate(-32 12 12)' fill='none' stroke='%235FB2FF' stroke-width='1.6'/%3E%3Cpath d='M12 7.2 L13.4 10.6 L16.8 12 L13.4 13.4 L12 16.8 L10.6 13.4 L7.2 12 L10.6 10.6 Z' fill='%235FB2FF'/%3E%3Ccircle cx='20.5' cy='6.7' r='1.9' fill='%23F0C987'/%3E%3C/svg%3E">
<div id="loading">
    <div class="spinner-box">
        <div class="blue-orbit leo"></div>
        <div class="green-orbit leo"></div>
        <div class="red-orbit leo"></div>
        <div class="white-orbit w1 leo"></div>
        <div class="white-orbit w2 leo"></div>
        <div class="white-orbit w3 leo"></div>
    </div>
</div>`;

const pageBegin = `${spinner}
`;

fs.writeFileSync(path.join(OUT, "page-begin.html"), pageBegin, "utf8");

/* ---------- 页脚 ---------- */
/* Config-only <script> block, shared by the footer and config.paste.html so
   the standalone snapshot always matches what is pasted into the footer. */
const CONFIG_BLOCK = `<!-- ===== 星轨 Stellaris · 配置（改这里就能调主题，详见 README） ===== -->
<script>
window.XM = {
  theme: "auto",   // "auto" 跟随系统 | "dark" 常驻深色 | "light" 常驻浅色
  accent: null,    // 例："#FF7A59"，留 null 用默认冷蓝
  logo: null,      // 例："https://.../avatar.png"，留 null 用平台默认（占位图隐藏）
  analyticsId: null,   // Baidu Tongji ID; null disables the request entirely
  cursorEffects: "https://blog-static.cnblogs.com/files/home/cursor-effects.js", // null disables; replace with your own URL
  cursorUrl: null      // override --xm-cursor at runtime; null keeps the CSS default
};
</script>`;

const pageEnd = `${CONFIG_BLOCK}

<!-- analytics: opt-in; a pasted copy must not report to the author's account -->
<script>
(function () {
  var id = window.XM && window.XM.analyticsId;
  /* Only a valid 32-char hex id fires a request; anything else fails open to no load. */
  if (typeof id !== "string" || !/^[a-f0-9]{32}$/i.test(id)) return;
  var _hmt = _hmt || [];
  /* The wrapper makes this var local; publish it so hm.js sees the global queue. */
  window._hmt = window._hmt || _hmt;
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?" + id;
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(hm, s);
})();
</script>

<!-- cursor effect: opt-in; the default asset sits on the author's blog path -->
<script>
(function () {
  var url = window.XM && window.XM.cursorEffects;
  /* Only absolute http(s) URLs are injectable; anything else fails open to no load.
     Keep this check backslash-free: this whole block lives in a template literal. */
  if (typeof url !== "string") return;
  var scheme = url.toLowerCase();
  if (scheme.indexOf("http://") !== 0 && scheme.indexOf("https://") !== 0) return;
  var s = document.createElement("script");
  s.src = url;
  document.head.appendChild(s);
})();
</script>

<!-- ===== 星轨 Stellaris · 增强脚本（零依赖原生 JS） ===== -->
<script>
${js}
</script>
`;

/* ---------- 构建期语法闸门 ----------
 * Template literals eat backslash escapes: /^https?:\/\// once shipped as
 * /^https?:/// and silently broke the whole cursor-effects script. Compile every
 * inline block and the standalone JS before writing so a syntax error can never
 * reach dist/ again. An external <script src> has no inline body and never
 * matches scriptRe, so the CDN footer yields one fewer block — that is expected.
 * Both the inline loop and the standalone file share compile(). */
function compile(code, label) {
  try {
    new Function(code);
  } catch (err) {
    throw new Error(label + " has a syntax error: " + err.message);
  }
}

function compileInlineBlocks(html, label) {
  const scriptRe = /<script>([\s\S]*?)<\/script>/g;
  let match, n = 0;
  while ((match = scriptRe.exec(html)) !== null) {
    compile(match[1], label + " inline script #" + (++n));
  }
  return n;
}

/* 粘贴版：去掉每行前导空白。
 * 博客园页脚框的 CodeMirror 开着自动缩进，如果贴带缩进的文本，它会在原有缩进上
 * 再叠一层，而且逐行累积——贴一次往里嵌一层，改主题再贴一次又深一层。
 * 贴这一份，让 CodeMirror 自己排版，重复粘贴结果才稳定。 */
const stripLeading = (html) => html
  .split("\n")
  .map((l) => l.replace(/^[ \t]+/, ""))
  .join("\n");
const pageEndPaste = stripLeading(pageEnd);

/* ---------- 精简页脚（JS 走 CDN 外链） ----------
 * 纯增量产物：默认 page-end.html / page-end.paste.html 逐字节不变，线上三框与已调通
 * 的部署链路不受影响。这里只把第 ④ 段内联增强脚本换成同步外链标签，①②③ 保持内联。
 * @main 指向仓库真实存在的 stellaris.js；禁用 async/defer（防闪白属性与 load 监听
 * 依赖同步执行），不加 SRI（分支内容可变，不适合完整性校验）。 */
const CDN_SCRIPT_TAG = `<script src="https://cdn.jsdelivr.net/gh/guolunwei/cnblogs-theme-stellaris@main/dist/stellaris.js"></script>`;
/* The 4th inline block is unique in pageEnd (js is ~50KB and has no </script
   token). Replace by string, never re-embed in a template literal, so enhance.js
   regex backslashes survive into the standalone file. */
const enhanceInline = `<script>\n${js}\n</script>`;
if (!pageEnd.includes(enhanceInline)) {
  throw new Error("cannot locate the inline enhance block in pageEnd");
}
const pageEndCdn = pageEnd.replace(enhanceInline, () => CDN_SCRIPT_TAG);
const pageEndCdnPaste = stripLeading(pageEndCdn);

/* Compile the exact strings written to dist/. */
compile(js, "dist/stellaris.js");
compileInlineBlocks(pageEnd, "page-end.html");
compileInlineBlocks(pageEndPaste, "page-end.paste.html");
compileInlineBlocks(pageEndCdn, "page-end.cdn.html");
compileInlineBlocks(pageEndCdnPaste, "page-end.cdn.paste.html");

/* Raw bytes from fs.readFileSync — never re-embedded in a template literal. */
fs.writeFileSync(path.join(OUT, "stellaris.js"), js, "utf8");
fs.writeFileSync(path.join(OUT, "page-end.html"), pageEnd, "utf8");
fs.writeFileSync(path.join(OUT, "page-end.paste.html"), pageEndPaste, "utf8");
fs.writeFileSync(path.join(OUT, "page-end.cdn.html"), pageEndCdn, "utf8");
fs.writeFileSync(path.join(OUT, "page-end.cdn.paste.html"), pageEndCdnPaste, "utf8");

/* Config-only snapshot for docs / copy convenience. NOT a 4th paste box:
   the footer box already contains this exact block. */
const configPaste = CONFIG_BLOCK
  .split("\n")
  .map((l) => l.replace(/^[ \t]+/, ""))
  .join("\n") + "\n";
fs.writeFileSync(path.join(OUT, "config.paste.html"), configPaste, "utf8");

/* 页首同样出一份粘贴版（spinner 是纯 HTML，影响小，但保持一致） */
fs.writeFileSync(
  path.join(OUT, "page-begin.paste.html"),
  pageBegin
    .split("\n")
    .map((l) => l.replace(/^[ \t]+/, ""))
    .join("\n"),
  "utf8"
);

/* ---------- 汇总 ---------- */
const kb = (n) => (n / 1024).toFixed(1) + " KB";
console.log("构建完成 → dist/");
console.log("  custom.css        " + kb(fs.statSync(path.join(OUT, "custom.css")).size) + "  （源文件，改样式改这里）");
console.log("  custom.paste.css  " + kb(fs.statSync(path.join(OUT, "custom.paste.css")).size) + "  （粘贴到「页面定制CSS代码」）");
console.log("  custom.min.css    " + kb(fs.statSync(path.join(OUT, "custom.min.css")).size) + "  （单行压缩，勿直接粘贴）");
console.log("  page-begin.html   " + kb(fs.statSync(path.join(OUT, "page-begin.html")).size) + "  （粘贴到「页首HTML代码」，用 .paste.html 版）");
console.log("  page-end.html     " + kb(fs.statSync(path.join(OUT, "page-end.html")).size) + "  （粘贴到「页脚HTML代码」，用 .paste.html 版）");
console.log("  *.paste.html      " + kb(fs.statSync(path.join(OUT, "page-end.paste.html")).size) + "  （去前导空白，CodeMirror 自动缩进不会累积）");
console.log("  config.paste.html " + kb(fs.statSync(path.join(OUT, "config.paste.html")).size) + "  (config snapshot, not a 4th paste box)");
console.log("  stellaris.js      " + kb(fs.statSync(path.join(OUT, "stellaris.js")).size) + "  （增强脚本独立产物，供 CDN 外链）");
console.log("  page-end.cdn.html " + kb(fs.statSync(path.join(OUT, "page-end.cdn.html")).size) + "  （精简页脚可读版，④ 走外链）");
console.log("  page-end.cdn.paste.html " + kb(fs.statSync(path.join(OUT, "page-end.cdn.paste.html")).size) + "  （精简页脚粘贴版，①②③ 内联 + ④ 外链）");

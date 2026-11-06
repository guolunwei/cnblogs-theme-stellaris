#!/usr/bin/env node
/**
 * 星轨 Stellaris · 构建脚本
 * 用法：node build.js
 * 产出：
 *   dist/custom.css        可读版 CSS（页面定制CSS代码 · 源文件，改样式改这里）
 *   dist/custom.min.css    压缩版 CSS（同上，单行，粘贴更稳）
 *   dist/page-begin.html   页首HTML代码（loading spinner，不含 JS）
 *   dist/page-end.html     页脚HTML代码（统计 + 光标特效 + 配置 + 增强脚本）
 *   dist/deploy.md         粘贴位置说明
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
  /* Only absolute http(s) URLs are injectable; anything else fails open to no load. */
  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) return;
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

fs.writeFileSync(path.join(OUT, "page-end.html"), pageEnd, "utf8");

/* 粘贴版：去掉每行前导空白。
 * 博客园页脚框的 CodeMirror 开着自动缩进，如果贴带缩进的文本，它会在原有缩进上
 * 再叠一层，而且逐行累积——贴一次往里嵌一层，改主题再贴一次又深一层。
 * 贴这一份，让 CodeMirror 自己排版，重复粘贴结果才稳定。 */
const pageEndPaste = pageEnd
  .split("\n")
  .map((l) => l.replace(/^[ \t]+/, ""))
  .join("\n");

fs.writeFileSync(path.join(OUT, "page-end.paste.html"), pageEndPaste, "utf8");

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

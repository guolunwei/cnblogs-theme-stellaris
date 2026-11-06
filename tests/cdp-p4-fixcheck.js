const { spawn } = require("child_process");
const os = require("os"), path = require("path"), fs = require("fs");
const CHROME = process.env.XM_CHROME || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ROOT = path.join(__dirname, "..");
const css = fs.readFileSync(path.join(ROOT, "dist", "custom.paste.css"), "utf8");
const pageEnd = fs.readFileSync(path.join(ROOT, "dist", "page-end.paste.html"), "utf8");

// Extract the enhanced script (last <script> block) from the built footer.
const marker = pageEnd.indexOf("Stellaris");
const s = pageEnd.lastIndexOf("<script>");
const e = pageEnd.indexOf("</script>", s);
const enhance = pageEnd.slice(s + "<script>".length, e);
if (!/function nativeLnTable/.test(enhance)) throw new Error("built footer is stale: fix not present");
if (!/table\.hljs-ln td\.hljs-ln-numbers/.test(css)) throw new Error("built css is stale: fix not present");

const IMG = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const hlRows = [":root {", "  --xm-bg: #0f151d;", "}"].map((t, i) =>
  '<tr><td class="hljs-ln-line hljs-ln-numbers" data-line-number="' + (i + 1) + '"><div class="hljs-ln-n" data-line-number="' + (i + 1) + '"></div></td>' +
  '<td class="hljs-ln-line hljs-ln-code" data-line-number="' + (i + 1) + '"><span>' + t.replace(/</g, "&lt;") + '</span></td></tr>').join("");

const fixture = `<!doctype html><html><head><meta charset="utf-8"><title>p4 fixcheck</title>
<style>${css}</style>
<script>
window.__copied = [];
try { Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: function (t) { window.__copied.push(t); return Promise.resolve(); } } }); }
catch (err) { window.__hookErr = String(err); }
</script></head><body>
<div id="home"><div id="header"><h1 id="blogTitle"><h1>t</h1></h1></div>
<div id="main"><div id="mainContent"><div class="forFlow"><div id="topics"><div class="post">
<div id="cnblogs_post_body">
<a id="cb_post_title_url" href="#">Fixcheck</a>
<p>Intro paragraph with some words for reading time estimation.</p>
<pre><code class="language-css hljs"><table class="hljs-ln"><tbody>${hlRows}</tbody></table></code></pre>
<pre><code class="language-js">const a = 1;
const b = 2;
const c = 3;</code></pre>
<img src="${IMG}" alt="probe" />
<table><thead><tr><th>Head</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>
</div></div></div></div></div></div></div>
<script>window.XM = { theme: "auto", accent: null, logo: null };</script>
<script>${enhance}</script>
</body></html>`;

const fixturePath = path.join(os.tmpdir(), "p4-fixcheck.html");
fs.writeFileSync(fixturePath, fixture, "utf8");

const outFile = path.join(__dirname, "cdp-p4-fixcheck-result.json");
const port = 9920 + Math.floor(Math.random() * 150);
const userDir = fs.mkdtempSync(path.join(os.tmpdir(), "p4f-"));
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--window-size=1440,900", "--remote-debugging-port=" + port, "--user-data-dir=" + userDir, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const probe = String.raw`(function(){
  var out = { hookErr: window.__hookErr || null };
  var pres = Array.prototype.slice.call(document.querySelectorAll("#cnblogs_post_body pre"));
  out.preCount = pres.length;
  var a = pres[0], b = pres[1];

  /* Case A: native hljs line-number table present */
  out.native = {
    hasTable: !!a.querySelector("table.hljs-ln"),
    gutterPresent: !!a.querySelector(".xm-code-ln"),
    hasLnClass: a.classList.contains("has-ln"),
    display: getComputedStyle(a).display,
    numCellPadding: (function(){ var t=a.querySelector("td.hljs-ln-numbers"); return t?getComputedStyle(t).padding:null; })(),
    numCellBorderRight: (function(){ var t=a.querySelector("td.hljs-ln-numbers"); return t?getComputedStyle(t).borderRightWidth:null; })(),
    numCellColor: (function(){ var t=a.querySelector("td.hljs-ln-numbers"); return t?getComputedStyle(t).color:null; })(),
    codeCellPaddingLeft: (function(){ var t=a.querySelector("td.hljs-ln-code"); return t?getComputedStyle(t).paddingLeft:null; })(),
    codeRowExcludedFromHover: (function(){
      var tr = a.querySelector("tbody tr");
      return tr ? !tr.matches("#cnblogs_post_body table:not(.hljs-ln) tbody tr") : null;
    })()
  };
  a.querySelector(".xm-copy").click();

  /* Case B: plain text code, our own gutter */
  var g = b.querySelector(".xm-code-ln");
  var code = b.querySelector("code");
  out.plain = {
    gutterPresent: !!g,
    hasLnClass: b.classList.contains("has-ln"),
    gutterText: g ? g.textContent : null,
    gutterLines: g ? g.textContent.replace(/\r?\n$/, "").split("\n").length : 0,
    codeLines: (code.textContent || "").replace(/\r?\n$/, "").split("\n").length,
    gutterInsideCode: g ? code.contains(g) : null,
    gutterLineHeight: g ? getComputedStyle(g).lineHeight : null,
    codeLineHeight: getComputedStyle(code).lineHeight,
    display: getComputedStyle(b).display
  };
  b.querySelector(".xm-copy").click();
  var contentRow = document.querySelector("#cnblogs_post_body table:not(.hljs-ln) tbody tr");
  out.contentRowMatchesHoverSelector = contentRow ? contentRow.matches("#cnblogs_post_body table:not(.hljs-ln) tbody tr") : null;

  window.setTimeout(function(){}, 0);
  out.copied = window.__copied.slice();
  return JSON.stringify(out);
})()`;

(async () => {
  let ws;
  for (let i = 0; i < 40; i++) {
    try {
      const l = await (await fetch("http://127.0.0.1:" + port + "/json/list")).json();
      const p = l.find(t => t.type === "page");
      if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; }
    } catch (e) {}
    await sleep(250);
  }
  if (!ws) throw new Error("no CDP websocket");
  let id = 0; const pen = new Map();
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pen.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pen.has(m.id)) { pen.get(m.id)(m); pen.delete(m.id); } };
  await new Promise(r => ws.onopen = r);
  await send("Page.enable"); await send("Runtime.enable");
  await send("Page.navigate", { url: "file:///" + fixturePath.replace(/\\/g, "/") });
  await sleep(2500);
  const r = await send("Runtime.evaluate", { expression: probe, returnByValue: true });
  const val = r.result && r.result.result && r.result.result.value;
  let o; try { o = JSON.parse(val); } catch (e) { o = { error: "parse-fail", raw: String(val).slice(0, 800), exception: r.result && r.result.exceptionDetails }; }

  const checks = [];
  const add = (n, ok, d) => checks.push({ check: n, pass: !!ok, detail: d });
  add("clipboard hook installed", !o.hookErr, o.hookErr);
  add("two code blocks", o.preCount === 2, o.preCount);
  if (o.native) {
    add("native table detected", o.native.hasTable, o.native.hasTable);
    add("no duplicate gutter in native mode", !o.native.gutterPresent, o.native.gutterPresent);
    add("has-ln removed in native mode", !o.native.hasLnClass, o.native.hasLnClass);
    add("pre NOT flex in native mode", o.native.display !== "flex", o.native.display);
    add("native number cell padding reset", o.native.numCellPadding === "0px 12px 0px 0px", o.native.numCellPadding);
    add("native number cell right border", o.native.numCellBorderRight === "1px", o.native.numCellBorderRight);
    add("native number cell muted color", /139, 155, 176/.test(o.native.numCellColor || ""), o.native.numCellColor);
    add("code row excluded from table hover", o.native.codeRowExcludedFromHover === true, o.native.codeRowExcludedFromHover);
  }
  if (o.plain) {
    add("own gutter present for plain code", o.plain.gutterPresent, o.plain.gutterPresent);
    add("gutter line count == code line count", o.plain.gutterLines === o.plain.codeLines, [o.plain.gutterLines, o.plain.codeLines, o.plain.gutterText]);
    add("gutter NOT inside code", o.plain.gutterInsideCode === false, o.plain.gutterInsideCode);
    add("gutter line-height == code line-height", o.plain.gutterLineHeight === o.plain.codeLineHeight, [o.plain.gutterLineHeight, o.plain.codeLineHeight]);
  }
  if (o.copied) {
    add("two copy payloads captured", o.copied.length === 2, o.copied.length);
    if (o.copied[0] !== undefined) {
      add("native copy: no tabs", o.copied[0].indexOf("\t") === -1, JSON.stringify(o.copied[0].slice(0, 90)));
      add("native copy: no doubled blank lines", o.copied[0].indexOf("\n\n") === -1, JSON.stringify(o.copied[0].slice(0, 90)));
      add("native copy: 3 clean lines", o.copied[0].split("\n").length === 3, o.copied[0].split("\n").length);
    }
    if (o.copied[1] !== undefined) {
      add("plain copy: no tabs", o.copied[1].indexOf("\t") === -1, JSON.stringify(o.copied[1].slice(0, 90)));
      add("plain copy: 3 clean lines", o.copied[1].split("\n").length === 3, o.copied[1].split("\n").length);
      add("plain copy: no line numbers", !/^\s*\d+\s+/m.test(o.copied[1]), JSON.stringify(o.copied[1].slice(0, 90)));
    }
  }
  add("content table still matches hover selector", o.contentRowMatchesHoverSelector === true, o.contentRowMatchesHoverSelector);

  o.checks = checks;
  o.summary = { total: checks.length, passed: checks.filter(c => c.pass).length, failed: checks.filter(c => !c.pass).length };
  console.log("\n===== Phase 4 FIX verification (built dist, local fixture) =====");
  checks.forEach(c => console.log((c.pass ? "  PASS  " : "  FAIL  ") + c.check + "  ->  " + JSON.stringify(c.detail)));
  console.log("\nSUMMARY: " + o.summary.passed + "/" + o.summary.total + " passed, " + o.summary.failed + " failed");
  fs.writeFileSync(outFile, JSON.stringify(o, null, 2), "utf8");
  console.log("RESULT -> " + outFile);
  ws.close(); chrome.kill(); process.exit(0);
})().catch(e => { console.error("FAIL", e.message); try { chrome.kill(); } catch (_) {} process.exit(1); });

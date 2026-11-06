const { spawn } = require("child_process");
const os = require("os"), path = require("path"), fs = require("fs");

const ROOT = path.join(__dirname, "..");
const outFile = path.join(__dirname, "cdp-batch2-verify-result.json");

/* A missing browser is an environment problem, never a fabricated pass. */
function notRun(reason) {
  const o = { status: "NOT RUN", reason: reason, checks: [], summary: { total: 0, passed: 0, failed: 0 } };
  console.log("NOT RUN: " + reason);
  fs.writeFileSync(outFile, JSON.stringify(o, null, 2), "utf8");
  console.log("RESULT -> " + outFile);
  process.exit(0);
}

const CHROME = [
  process.env.XM_CHROME,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
].filter(Boolean).find((p) => { try { return fs.existsSync(p); } catch (e) { return false; } });
if (!CHROME) notRun("no Chrome/Edge binary found (XM_CHROME unset and standard install paths missing)");

const css = fs.readFileSync(path.join(ROOT, "dist", "custom.paste.css"), "utf8");
const pageEnd = fs.readFileSync(path.join(ROOT, "dist", "page-end.paste.html"), "utf8");
const s = pageEnd.lastIndexOf("<script>");
const e = pageEnd.indexOf("</script>", s);
const enhance = pageEnd.slice(s + "<script>".length, e);

const IMG = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const hlRows = [":root {", "  --xm-bg: #0f151d;", "}"].map((t, i) =>
  '<tr><td class="hljs-ln-line hljs-ln-numbers" data-line-number="' + (i + 1) + '"><div class="hljs-ln-n" data-line-number="' + (i + 1) + '"></div></td>' +
  '<td class="hljs-ln-line hljs-ln-code" data-line-number="' + (i + 1) + '"><span>' + t.replace(/</g, "&lt;") + '</span></td></tr>').join("");

/* Head hooks: error capture, clipboard, and an in-memory localStorage that
   records setItem/removeItem so we can prove an explicit write, not a null. */
function makeHead(opts) {
  const clip = opts.clipboard === "reject"
    ? 'writeText: function () { return Promise.reject(new Error("blocked")); }'
    : 'writeText: function (t) { window.__copied.push(t); return Promise.resolve(); }';
  const execHook = opts.clipboard === "reject"
    ? 'try { document.execCommand = function () { return false; }; } catch (e) {}'
    : "";
  return `<script>
window.__errors = [];
window.addEventListener("error", function (ev) { window.__errors.push(String(ev.message || (ev.error && ev.error.message) || ev)); });
window.__copied = [];
window.__hookErr = null;
try {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { ${clip} } });
} catch (err) { window.__hookErr = String(err); }
${execHook}
(function () {
  var store = {};
  window.__lsSet = []; window.__lsRemove = []; window.__lsGet = [];
  var shim = {
    getItem: function (k) { window.__lsGet.push(k); return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { window.__lsSet.push([k, String(v)]); store[k] = String(v); },
    removeItem: function (k) { window.__lsRemove.push(k); delete store[k]; },
    clear: function () { store = {}; },
    key: function (i) { var ks = Object.keys(store); return i < ks.length ? ks[i] : null; },
    get length () { return Object.keys(store).length; }
  };
  try { Object.defineProperty(window, "localStorage", { configurable: true, value: shim }); window.__lsBackend = "shim"; }
  catch (err) { window.__lsBackend = "native"; }
})();
</script>`;
}

const BODY = `<div id="home"><div id="header"><div id="blogTitle"><h1>Stellaris Test Blog</h1></div></div>
<div id="main"><div id="mainContent"><div class="forFlow"><div id="topics"><div class="post">
<div id="cnblogs_post_body">
<a id="cb_post_title_url" href="#">A Test Post</a>
<p>Intro paragraph with enough words for a reading time estimate on the fixture page.</p>
<h2>First Section</h2>
<p>Body paragraph that describes the first topic in some detail for the probe.</p>
<pre><code class="language-css hljs"><table class="hljs-ln"><tbody>${hlRows}</tbody></table></code></pre>
<pre><code class="language-js">const a = 1;
const b = 2;
const c = 3;</code></pre>
<h3>Nested Detail</h3>
<img id="bareImg" src="${IMG}" alt="bare photo" />
<a id="linkWrap" href="#linked-anchor"><img id="linkImg" src="${IMG}" alt="linked photo" /></a>
<h2>Second Section</h2>
<p>Final paragraph adds a little more content for the reading time calculation.</p>
</div></div></div></div></div>
<div id="sideBar"><ul id="navList"><li><a href="#nav-home">Home</a></li><li><a href="#nav-archive">Archive</a></li></ul></div>
</div></div>`;

function makeFixture(opts) {
  const xm = opts.xm || { theme: "auto", accent: null, logo: null };
  const remove = opts.removePostBody
    ? '<script>var __pb=document.getElementById("cnblogs_post_body");if(__pb&&__pb.parentNode)__pb.parentNode.removeChild(__pb);</script>'
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><title>batch2 ${opts.name || ""}</title>
<style>${css}</style>
${makeHead(opts)}</head><body>
${BODY}
<script>window.XM = ${JSON.stringify(xm)};</script>
${remove}
<script>${enhance}</script>
</body></html>`;
}

/* Each probe is an async IIFE returning a JSON string; CDP awaits the promise
   so time-based behaviour (1600ms timer, live-region rAF) can be observed. */
const PROBE_MAIN = String.raw`(async function () {
  var out = {};
  var delay = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var root = document.documentElement;
  var pb = document.getElementById("cnblogs_post_body");

  var bare = document.getElementById("bareImg");
  bare.click();
  var dlg = document.querySelector("dialog.xm-lightbox");
  out.a1 = { exists: !!dlg, tag: dlg ? dlg.tagName : null };
  out.a2 = dlg ? { open: dlg.open, modal: dlg.matches(":modal"), hasShowModal: typeof dlg.showModal === "function" } : null;
  var cb = dlg ? dlg.querySelector(".xm-lightbox__close") : null;
  var rect = cb ? cb.getBoundingClientRect() : null;
  out.a3size = rect ? { w: rect.width, h: rect.height } : null;
  if (cb) cb.click();
  await delay(80);
  out.a3 = {
    openAfter: dlg ? dlg.open : null,
    focusBack: document.activeElement === bare,
    activeId: document.activeElement ? document.activeElement.id : null
  };

  var li = document.getElementById("linkImg");
  var ev = new MouseEvent("click", { bubbles: true, cancelable: true });
  li.dispatchEvent(ev);
  var dlg2 = document.querySelector("dialog.xm-lightbox");
  out.a4 = { zoomAttr: li.getAttribute("data-xm-zoom"), dlgOpen: dlg2 ? dlg2.open : "no-dialog", defaultPrevented: ev.defaultPrevented };

  /* Cursor is tokenized in the final build: prove the universal rule still
     carries var(--xm-cursor, auto) AND :root still defines the real url.
     A var()-dependent declaration serializes to "" via the IDL style.cursor
     getter, so read the literal through getPropertyValue("cursor"). */
  /* The build has several selectorText==="*" rules; collect every one so a
     later cursor-less "*" rule cannot overwrite the tokenized declaration. */
  var universalSeen = false, universalCursors = [], cursorVarValue = null;
  for (var i = 0; i < document.styleSheets.length; i++) {
    var rules;
    try { rules = document.styleSheets[i].cssRules; } catch (err) { continue; }
    if (!rules) continue;
    for (var j = 0; j < rules.length; j++) {
      var rule = rules[j];
      if (rule.selectorText === "*" && rule.style) {
        universalSeen = true;
        universalCursors.push(rule.style.getPropertyValue("cursor").trim());
      }
      if (rule.style && rule.style.getPropertyValue) {
        var cv = rule.style.getPropertyValue("--xm-cursor");
        if (cv) cursorVarValue = cv.trim();
      }
    }
  }
  out.a5 = {
    inlineCursor: bare.style.cursor,
    universalExists: universalSeen,
    universalCursors: universalCursors,
    universalCursor: universalCursors.filter(function (v) { return v; })[0] || null,
    cursorVar: cursorVarValue
  };

  var sts = document.querySelectorAll("#xm-copy-status");
  var st = sts[0];
  out.a6 = { count: sts.length, role: st ? st.getAttribute("role") : null, live: st ? st.getAttribute("aria-live") : null, atomic: st ? st.getAttribute("aria-atomic") : null };

  var pres = pb.querySelectorAll("pre");
  var b0 = pres[0].querySelector(".xm-copy");
  var b1 = pres[1].querySelector(".xm-copy");
  out.a10pre = { count: pres.length, p0HasTable: !!pres[0].querySelector("table.hljs-ln"), p1HasTable: !!pres[1].querySelector("table.hljs-ln"), b0: !!b0, b1: !!b1 };

  var ariaBefore = b0.getAttribute("aria-label");
  b0.click();
  await delay(70);
  var liveSuccess = st ? st.textContent : null;
  var ariaAfterSuccess = b0.getAttribute("aria-label");
  var btnTextDone = b0.textContent;
  b0.click();
  await delay(70);
  var liveDouble = st ? st.textContent : null;
  var ariaAfterDouble = b0.getAttribute("aria-label");
  var statusCount2 = document.querySelectorAll("#xm-copy-status").length;
  await delay(1750);
  var btnTextReset = b0.textContent;
  b1.click();
  await delay(70);
  var copied = window.__copied.slice();
  out.a7 = { before: ariaBefore, afterSuccess: ariaAfterSuccess, afterDouble: ariaAfterDouble };
  out.a8 = { liveSuccess: liveSuccess, liveDouble: liveDouble, btnTextDone: btnTextDone, btnTextReset: btnTextReset, statusCount: statusCount2 };
  out.a10 = { native: copied.length ? copied[0] : null, plain: copied.length ? copied[copied.length - 1] : null, copiedCount: copied.length };

  out.a13 = {
    backend: window.__lsBackend,
    getItem: (function () { try { return localStorage.getItem("xm-theme-mode"); } catch (err) { return "throw:" + err; } })(),
    setLog: window.__lsSet.slice(),
    removeLog: window.__lsRemove.slice(),
    errors: window.__errors.slice(),
    dataTheme: root.getAttribute("data-theme")
  };

  var cs = getComputedStyle(root);
  out.a14base = {
    inlineGlow: root.style.getPropertyValue("--xm-glow-color"),
    computedGlow: cs.getPropertyValue("--xm-glow-color").trim(),
    gradEnd: cs.getPropertyValue("--xm-grad-end").trim(),
    inlineAccent: root.style.getPropertyValue("--xm-accent")
  };
  out.hookErr = window.__hookErr;
  out.errors = window.__errors.slice();
  return JSON.stringify(out);
})()`;

const PROBE_REJECT = String.raw`(async function () {
  var out = {};
  var delay = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var pb = document.getElementById("cnblogs_post_body");
  var b0 = pb.querySelector("pre .xm-copy");
  var st = document.getElementById("xm-copy-status");
  var ariaBefore = b0.getAttribute("aria-label");
  b0.click();
  await delay(120);
  out.a9 = {
    live: st ? st.textContent : null,
    btnText: b0.textContent,
    isDone: b0.classList.contains("is-done"),
    aria: b0.getAttribute("aria-label"),
    ariaBefore: ariaBefore,
    copied: window.__copied.slice(),
    execReturnsFalse: (function () { try { return document.execCommand("copy"); } catch (err) { return "throw"; } })()
  };
  out.hookErr = window.__hookErr;
  out.errors = window.__errors.slice();
  return JSON.stringify(out);
})()`;

const PROBE_NOLB = String.raw`(async function () {
  var out = {};
  var dlg = document.querySelector("dialog.xm-lightbox");
  var bare = document.getElementById("bareImg");
  out.a11 = {
    dialog: dlg ? dlg.tagName : null,
    copyBtn: !!document.querySelector(".xm-copy"),
    fab: !!document.querySelector(".xm-fab"),
    themeBtn: !!document.querySelector(".xm-fab__btn--theme"),
    tocBtn: !!document.querySelector(".xm-fab__btn--toc"),
    tocPanel: !!document.getElementById("xm-toc-panel"),
    progress: !!document.querySelector(".xm-progress"),
    zoomAttrOnBare: bare ? bare.getAttribute("data-xm-zoom") : null
  };
  out.errors = window.__errors.slice();
  return JSON.stringify(out);
})()`;

const PROBE_NOPB = String.raw`(async function () {
  var out = {};
  var ns = document.querySelectorAll("body nav");
  var emptyNav = false;
  for (var i = 0; i < ns.length; i++) { if (ns[i].children.length === 0) { emptyNav = true; break; } }
  var skip = document.querySelector("a.xm-skip");
  out.a12 = {
    pbPresent: !!document.getElementById("cnblogs_post_body"),
    themeBtn: !!document.querySelector(".xm-fab__btn--theme"),
    progress: !!document.querySelector(".xm-progress"),
    fab: !!document.querySelector(".xm-fab"),
    tocPanel: !!document.getElementById("xm-toc-panel"),
    tocBtn: !!document.querySelector(".xm-fab__btn--toc"),
    lightboxDialog: !!document.querySelector("dialog.xm-lightbox"),
    readmeta: !!document.querySelector(".xm-readmeta"),
    emptyNav: emptyNav,
    navCount: ns.length,
    emptySrcImg: document.querySelectorAll('img[src=""]').length,
    emptyHrefA: document.querySelectorAll('a[href=""]').length,
    skipHref: skip ? skip.getAttribute("href") : null
  };
  out.errors = window.__errors.slice();
  return JSON.stringify(out);
})()`;

const PROBE_THEME_BAD = String.raw`(async function () {
  var out = {};
  out.a13b = {
    getItem: (function () { try { return localStorage.getItem("xm-theme-mode"); } catch (err) { return "throw:" + err; } })(),
    setLog: window.__lsSet.slice(),
    removeLog: window.__lsRemove.slice(),
    dataTheme: document.documentElement.getAttribute("data-theme"),
    errors: window.__errors.slice()
  };
  out.errors = window.__errors.slice();
  return JSON.stringify(out);
})()`;

const PROBE_ACC_BAD = String.raw`(async function () {
  var out = {};
  var root = document.documentElement, cs = getComputedStyle(root);
  out.a14invalid = {
    inlineGlow: root.style.getPropertyValue("--xm-glow-color"),
    inlineAccent: root.style.getPropertyValue("--xm-accent"),
    inlineAccentSoft: root.style.getPropertyValue("--xm-accent-soft"),
    inlineAccentText: root.style.getPropertyValue("--xm-accent-text"),
    computedGlow: cs.getPropertyValue("--xm-glow-color").trim(),
    gradEnd: cs.getPropertyValue("--xm-grad-end").trim(),
    errors: window.__errors.slice()
  };
  return JSON.stringify(out);
})()`;

const PROBE_ACC_OK = String.raw`(async function () {
  var out = {};
  var root = document.documentElement, cs = getComputedStyle(root);
  out.a14valid = {
    inlineGlow: root.style.getPropertyValue("--xm-glow-color"),
    inlineAccent: root.style.getPropertyValue("--xm-accent"),
    computedGlow: cs.getPropertyValue("--xm-glow-color").trim(),
    gradEnd: cs.getPropertyValue("--xm-grad-end").trim(),
    errors: window.__errors.slice()
  };
  return JSON.stringify(out);
})()`;

const scenarios = [
  { name: "main", mobile: true, opts: { name: "main", xm: { theme: "auto", accent: null, logo: null }, clipboard: "ok" }, probe: PROBE_MAIN },
  { name: "reject", opts: { name: "reject", xm: { theme: "auto", accent: null, logo: null }, clipboard: "reject" }, probe: PROBE_REJECT },
  { name: "no-lightbox", opts: { name: "no-lightbox", xm: { theme: "auto", accent: null, logo: null, features: { lightbox: false } }, clipboard: "ok" }, probe: PROBE_NOLB },
  { name: "no-postbody", opts: { name: "no-postbody", xm: { theme: "auto", accent: null, logo: null }, clipboard: "ok", removePostBody: true }, probe: PROBE_NOPB },
  { name: "theme-invalid", opts: { name: "theme-invalid", xm: { theme: "not-a-mode", accent: null, logo: null }, clipboard: "ok" }, probe: PROBE_THEME_BAD },
  { name: "accent-invalid", opts: { name: "accent-invalid", xm: { theme: "auto", accent: "not-a-color", logo: null }, clipboard: "ok" }, probe: PROBE_ACC_BAD },
  { name: "accent-valid", opts: { name: "accent-valid", xm: { theme: "auto", accent: "#FF7A59", logo: null }, clipboard: "ok" }, probe: PROBE_ACC_OK }
];
scenarios.forEach((sc, i) => {
  sc.file = path.join(os.tmpdir(), "xm-b2-" + i + "-" + sc.name + ".html");
  fs.writeFileSync(sc.file, makeFixture(sc.opts), "utf8");
});

const LABELS = {
  "1": "native dialog.xm-lightbox",
  "2": "showModal open + :modal",
  "3": "close btn >=44px, close + focus restore",
  "4": "link-wrapped img not hijacked",
  "5": "no inline cursor + *{cursor:var(--xm-cursor,auto)} + :root --xm-cursor default [UPDATED]",
  "6": "unique #xm-copy-status a11y attrs",
  "7": "copy aria-label fixed before/after",
  "8": "success announce + 1600ms timer + no dup",
  "9": "reject -> fallback -> failure announce",
  "10": "native & plain copy payloads clean",
  "11": "lightbox=false keeps other components",
  "12": "postBody removed degrades cleanly",
  "13": "theme auto explicit write + invalid fallback",
  "14": "accent isolation + grad-end stable"
};

const port = 9920 + Math.floor(Math.random() * 150);
const userDir = fs.mkdtempSync(path.join(os.tmpdir(), "xm-b2-profile-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  "--window-size=1440,900", "--allow-file-access-from-files",
  "--remote-debugging-port=" + port, "--user-data-dir=" + userDir, "about:blank"
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  /* Stale guards kept verbatim from the p4 harness: phase-4 logic must still ship. */
  if (!/function nativeLnTable/.test(enhance)) throw new Error("built footer is stale: nativeLnTable missing");
  if (!/table\.hljs-ln td\.hljs-ln-numbers/.test(css)) throw new Error("built css is stale: hljs-ln number cell rule missing");

  let ws;
  for (let i = 0; i < 20; i++) {
    try {
      const list = await (await fetch("http://127.0.0.1:" + port + "/json/list")).json();
      const page = list.find((t) => t.type === "page");
      if (page) { ws = new WebSocket(page.webSocketDebuggerUrl); break; }
    } catch (err) {}
    await sleep(250);
  }
  if (!ws) { try { chrome.kill(); } catch (_) {} return notRun("CDP websocket unreachable on port " + port + " after 5s (chrome=" + CHROME + ")"); }

  let id = 0; const pen = new Map();
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pen.set(i, res); ws.send(JSON.stringify({ id: i, method: method, params: params })); });
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pen.has(m.id)) { pen.get(m.id)(m); pen.delete(m.id); } };
  await new Promise((r) => (ws.onopen = r));
  await send("Page.enable"); await send("Runtime.enable"); await send("Emulation.enable");

  const res = {};
  for (const sc of scenarios) {
    if (sc.mobile) await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    else await send("Emulation.clearDeviceMetricsOverride");
    await send("Page.navigate", { url: "file:///" + sc.file.replace(/\\/g, "/") });
    await sleep(1400);
    const r = await send("Runtime.evaluate", { expression: sc.probe, returnByValue: true, awaitPromise: true });
    const val = r.result && r.result.result && r.result.result.value;
    let o;
    try { o = JSON.parse(val); } catch (err) {
      o = { __probeError: "parse-or-exception", raw: String(val).slice(0, 400), exception: (r.result && r.result.exceptionDetails) || null };
    }
    res[sc.name] = o;
  }

  const R = (n) => res[n] || {};
  const G = (o, k) => (o && o[k]) || {};
  const s1 = R("main"), s2 = R("reject"), s3 = R("no-lightbox"),
    s4 = R("no-postbody"), s5 = R("theme-invalid"), s6 = R("accent-invalid"), s7 = R("accent-valid");
  const a1 = G(s1, "a1"), a2 = G(s1, "a2"), a3 = G(s1, "a3"), a3s = G(s1, "a3size"),
    a4 = G(s1, "a4"), a5 = G(s1, "a5"), a6 = G(s1, "a6"), a7 = G(s1, "a7"),
    a8 = G(s1, "a8"), a10 = G(s1, "a10"), a10p = G(s1, "a10pre"), a13 = G(s1, "a13"),
    base = G(s1, "a14base"), a9 = G(s2, "a9"), a11 = G(s3, "a11"), a12 = G(s4, "a12"),
    a13b = G(s5, "a13b"), inv = G(s6, "a14invalid"), val = G(s7, "a14valid");

  const checks = [];
  const add = (n, ok, d, extra) => checks.push(Object.assign({ check: n, label: LABELS[n], pass: !!ok, detail: d }, extra || {}));

  add("1", a1.exists === true && a1.tag === "DIALOG", a1);
  add("2", !!s1.a2 && a2.open === true && a2.modal === true, a2 || { missing: true });
  {
    const sizeOK = !!s1.a3size && a3s.w >= 44 && a3s.h >= 44;
    add("3", sizeOK && a3.openAfter === false && a3.focusBack === true, { size: a3s || null, openAfter: a3.openAfter, focusBack: a3.focusBack, activeId: a3.activeId });
  }
  add("4", a4.zoomAttr === null && a4.dlgOpen === false && a4.defaultPrevented === false, a4);
  {
    const cursorTokenOK = Array.isArray(a5.universalCursors) && a5.universalCursors.indexOf("var(--xm-cursor, auto)") !== -1;
    const ok5 = a5.inlineCursor === "" && a5.universalExists === true && cursorTokenOK &&
      typeof a5.cursorVar === "string" && /url\(/i.test(a5.cursorVar) && /mouse\.ico/i.test(a5.cursorVar);
    add("5", ok5, a5, {
      updated: true,
      updateNote: "strengthened per team-lead ruling: AND of (a) a universal *{cursor} rule still present and equal to var(--xm-cursor, auto) (tokenized, cursor still effective), (b) the rule carrying --xm-cursor still contains url( and mouse.ico (default not lost). Original intent (no inline style.cursor) retained; old literal url( check replaced, not deleted. CSSOM note: read via getPropertyValue('cursor'); build has several '*' rules, so all values are collected rather than letting a later cursor-less '*' rule overwrite the tokenized one.",
      expected: "inlineCursor='' AND universalExists=true AND some * rule cursor='var(--xm-cursor, auto)' AND cursorVar contains url( and mouse.ico",
      actual: "inlineCursor=" + JSON.stringify(a5.inlineCursor) + " universalExists=" + a5.universalExists +
        " universalCursorIsVar=" + cursorTokenOK +
        " cursorVarHasUrl=" + /url\(/i.test(a5.cursorVar || "") + " cursorVarHasMouseIco=" + /mouse\.ico/i.test(a5.cursorVar || "")
    });
  }
  add("6", a6.count === 1 && a6.role === "status" && a6.live === "polite" && a6.atomic === "true", a6);
  {
    const ok = a7.before === "复制代码" && a7.afterSuccess === "复制代码" && a7.afterDouble === "复制代码" &&
      a9.ariaBefore === "复制代码" && a9.aria === "复制代码";
    add("7", ok, { success: a7, failure: { before: a9.ariaBefore, after: a9.aria } });
  }
  {
    const ok = /已复制/.test(a8.liveSuccess || "") && a8.btnTextDone === "已复制" && a8.btnTextReset === "复制" &&
      a8.statusCount === 1 && a8.liveDouble === "已复制代码";
    add("8", ok, a8);
  }
  {
    const ok = /复制失败，请手动选择代码/.test(a9.live || "") && !/已复制/.test(a9.btnText || "") && a9.isDone === false;
    add("9", ok, { live: a9.live, btnText: a9.btnText, isDone: a9.isDone, execReturnsFalse: a9.execReturnsFalse });
  }
  {
    const clean = (x) => typeof x === "string" && x.indexOf("\t") === -1 && x.indexOf("\n\n") === -1;
    const ok = a10p.p0HasTable === true && a10p.p1HasTable === false && clean(a10.native) && clean(a10.plain) && a10.copiedCount >= 2;
    add("10", ok, { pre: a10p, native: a10.native, plain: a10.plain, copiedCount: a10.copiedCount });
  }
  add("11", a11.dialog === null && a11.copyBtn && a11.fab && a11.themeBtn && a11.tocPanel && a11.progress, a11);
  {
    const ok = a12.pbPresent === false && a12.themeBtn && a12.progress && a12.fab &&
      !a12.tocPanel && !a12.tocBtn && !a12.lightboxDialog && !a12.readmeta &&
      a12.emptyNav === false && a12.emptySrcImg === 0 && a12.emptyHrefA === 0;
    add("12", ok, a12);
  }
  {
    const wrote = (o) => o.getItem === "auto" && o.setLog && o.setLog.some((x) => x[0] === "xm-theme-mode" && x[1] === "auto") &&
      o.removeLog && !o.removeLog.some((k) => k === "xm-theme-mode");
    const ok = wrote(a13) && a13.errors && a13.errors.length === 0 && wrote(a13b) && a13b.dataTheme === "auto" && a13b.errors && a13b.errors.length === 0;
    add("13", ok, { auto: a13, invalid: a13b });
  }
  {
    const bad = /NaN|not-a-color|undefined|invalid/i;
    const noBadInline = inv.inlineGlow === "" && inv.inlineAccent === "" && inv.inlineAccentSoft === "" && inv.inlineAccentText === "";
    const glowOK = /^rgba?\(/i.test(inv.computedGlow || "") && !bad.test(inv.computedGlow || "");
    const wroteGlow = /255,\s*122,\s*89/.test(val.inlineGlow || "") && val.inlineAccent === "#FF7A59";
    const gradStable = !!base.gradEnd && base.gradEnd === val.gradEnd && base.gradEnd === inv.gradEnd;
    const ok = noBadInline && glowOK && wroteGlow && gradStable && inv.errors && inv.errors.length === 0 && val.errors && val.errors.length === 0;
    add("14", ok, { invalid: inv, valid: val, baseline: base, gradStable: gradStable });
  }

  const env = {
    browser: CHROME,
    deviceMetrics: "390x844 mobile on 'main' scenario; others default",
    clipboardHookErrMain: s1.hookErr || null,
    localStorageBackend: a13.backend || null,
    probeErrors: Object.keys(res).filter((k) => res[k] && res[k].__probeError).map((k) => ({ name: k, err: res[k].__probeError }))
  };
  const summary = { total: checks.length, passed: checks.filter((c) => c.pass).length, failed: checks.filter((c) => !c.pass).length };

  console.log("\n===== Batch2 runtime verification (offline fixture + CDP) =====");
  console.log("ENV: " + JSON.stringify(env));
  checks.forEach((c) => console.log((c.pass ? "  PASS  " : "  FAIL  ") + "[" + c.check + "] " + c.label + "  ->  " + JSON.stringify(c.detail)));
  console.log("\nSUMMARY: " + summary.passed + "/" + summary.total + " passed, " + summary.failed + " failed");
  fs.writeFileSync(outFile, JSON.stringify({ status: "RUN", env: env, checks: checks, summary: summary, scenarios: res }, null, 2), "utf8");
  console.log("RESULT -> " + outFile);
  ws.close(); chrome.kill(); process.exit(summary.failed ? 1 : 0);
})().catch((err) => {
  console.error("ERROR: " + err.message);
  try { chrome.kill(); } catch (_) {}
  const o = { status: "ERROR", reason: err.message, checks: [], summary: { total: 0, passed: 0, failed: 0 } };
  try { fs.writeFileSync(outFile, JSON.stringify(o, null, 2), "utf8"); } catch (_) {}
  process.exit(1);
});

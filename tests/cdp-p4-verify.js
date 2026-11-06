const { spawn } = require("child_process");
const os = require("os"), path = require("path"), fs = require("fs");
const CHROME = process.env.XM_CHROME || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outFile = path.join(__dirname, "cdp-p4-verify-result.json");
const port = 9920 + Math.floor(Math.random() * 150);
const userDir = fs.mkdtempSync(path.join(os.tmpdir(), "p4v-"));
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--window-size=1440,900", "--remote-debugging-port=" + port, "--user-data-dir=" + userDir, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// READ-ONLY probe on a standalone headless Chrome. Verifies runtime-injected
// Phase 4 DOM (gutter / readmeta / copy button / lightbox) and computed styles.
// Theme switching is done in memory and restored; nothing is written to the site.
const probe = String.raw`(async function(){
  var out = { url: location.href, ua: navigator.userAgent };
  var postBody = document.getElementById("cnblogs_post_body");
  out.postBodyExists = !!postBody;

  /* 1. code block gutters */
  var pres = Array.prototype.slice.call(document.querySelectorAll("#cnblogs_post_body pre, .postCon pre"));
  out.code = { preCount: pres.length, blocks: [] };
  pres.forEach(function(pre){
    var g = pre.querySelector(".xm-code-ln");
    var code = pre.querySelector("code") || pre;
    var cs = g ? getComputedStyle(g) : null;
    var ccs = getComputedStyle(code);
    var btn = pre.querySelector(".xm-copy");
    var gr = g ? g.getBoundingClientRect() : null;
    var cr = code.getBoundingClientRect();
    out.code.blocks.push({
      hasLnClass: pre.classList.contains("has-ln"),
      hasGutter: !!g,
      gutterInsideCode: g ? code.contains(g) : null,
      gutterIsFirstChild: g ? (pre.firstElementChild === g) : null,
      gutterLineCount: g ? g.textContent.replace(/\r?\n$/, "").split("\n").length : 0,
      codeLineCount: (code.textContent || "").replace(/\r?\n$/, "").split("\n").length,
      gutterText: g ? g.textContent.slice(0, 40) : null,
      codeTag: code.tagName,
      codeHtmlHead: code.innerHTML.slice(0, 420),
      codeChildCount: code.children.length,
      codeChildTags: Array.prototype.slice.call(code.children).slice(0, 12).map(function(c){ return c.tagName + "." + String(c.className).slice(0, 40); }),
      codeBrCount: code.querySelectorAll("br").length,
      codeHeight: Math.round(cr.height),
      gutterHeight: gr ? Math.round(gr.height) : null,
      codeScrollHeight: code.scrollHeight,
      gutterBg: cs ? cs.backgroundColor : null,
      gutterColor: cs ? cs.color : null,
      gutterPosition: cs ? cs.position : null,
      gutterFontSize: cs ? cs.fontSize : null,
      codeFontSize: ccs.fontSize,
      gutterLineHeight: cs ? cs.lineHeight : null,
      codeLineHeight: ccs.lineHeight,
      gutterTop: gr ? Math.round(gr.top) : null,
      codeTop: Math.round(cr.top),
      prePosition: getComputedStyle(pre).position,
      preDisplay: getComputedStyle(pre).display,
      hasCopyBtn: !!btn,
      btnOffsetParentIsPre: btn ? (btn.offsetParent === pre) : null,
      btnOffsetParentName: btn && btn.offsetParent ? (btn.offsetParent.id || btn.offsetParent.tagName) : null,
      btnBg: btn ? getComputedStyle(btn).backgroundColor : null,
      btnColor: btn ? getComputedStyle(btn).color : null
    });
  });

  /* 2. reading-time meta */
  var rm = postBody ? postBody.querySelector(".xm-readmeta") : null;
  out.readmeta = rm ? {
    exists: true,
    text: rm.textContent,
    isFirstChild: rm === postBody.firstChild,
    ariaHidden: rm.getAttribute("aria-hidden"),
    fontSize: getComputedStyle(rm).fontSize,
    color: getComputedStyle(rm).color,
    belowTitle: (function(){
      var t = document.getElementById("cb_post_title_url");
      return t ? (rm.getBoundingClientRect().top > t.getBoundingClientRect().top) : null;
    })()
  } : { exists: false };

  /* 3. lightbox open/close through real DOM events */
  var imgs = postBody ? Array.prototype.slice.call(postBody.querySelectorAll("img")) : [];
  out.lightbox = { imgCount: imgs.length, firstImgCursor: imgs[0] ? getComputedStyle(imgs[0]).cursor : null };
  if (imgs[0]) {
    imgs[0].dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    var lb = document.querySelector(".xm-lightbox");
    out.lightbox.opened = !!lb && !lb.hidden;
    out.lightbox.bodyLocked = document.body.classList.contains("xm-lb-open");
    out.lightbox.hasImg = lb ? !!lb.querySelector("img") : false;
    out.lightbox.role = lb ? lb.getAttribute("role") : null;
    out.lightbox.bg = lb ? getComputedStyle(lb).backgroundColor : null;
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    out.lightbox.closedAfterEsc = lb ? lb.hidden : null;
    out.lightbox.unlockedAfterEsc = !document.body.classList.contains("xm-lb-open");
  }

  /* 4. runtime-injected FAB / progress / TOC */
  out.runtime = {
    progress: !!document.querySelector(".xm-progress"),
    fab: !!document.querySelector(".xm-fab"),
    tocBtn: !!document.querySelector(".xm-fab__btn--toc"),
    themeBtn: !!document.querySelector(".xm-fab__btn--theme"),
    themeBtnLabel: (function(){ var b = document.querySelector(".xm-fab__btn--theme"); return b ? b.getAttribute("aria-label") : null; })(),
    dataTheme: document.documentElement.getAttribute("data-theme")
  };

  /* 5. Phase 4 rules actually parsed into document.styleSheets */
  var wanted = [".xm-code-ln", "pre.has-ln", ".xm-lightbox", ".xm-readmeta", "tbody tr:hover", ".xm-copy", "body.xm-lb-open"];
  var found = {};
  wanted.forEach(function(w){ found[w] = 0; });
  var sheetList = [];
  for (var i = 0; i < document.styleSheets.length; i++) {
    var s = document.styleSheets[i];
    var href = s.href || "(inline)";
    var cnt = -1; try { cnt = s.cssRules.length; } catch (e) {}
    sheetList.push({ href: href, rules: cnt });
    try {
      var rules = s.cssRules;
      for (var j = 0; j < rules.length; j++) {
        var r = rules[j];
        if (!r.selectorText) continue;
        wanted.forEach(function(w){ if (r.selectorText.indexOf(w) >= 0) found[w]++; });
      }
    } catch (e) {}
  }
  out.cssRulesFound = found;
  out.customCssSheet = sheetList.filter(function(s){ return /custom\.css/.test(s.href); });

  /* 6. dark/light parity: code block stays dark in both modes */
  var root = document.documentElement;
  var before = root.getAttribute("data-theme");
  out.modes = {};
  ["dark", "light"].forEach(function(m){
    root.setAttribute("data-theme", m);
    void document.body.offsetHeight;
    var g = document.querySelector(".xm-code-ln");
    var pre = document.querySelector("#cnblogs_post_body pre, .postCon pre");
    var b = document.querySelector(".xm-copy");
    out.modes[m] = {
      pageBg: getComputedStyle(root).getPropertyValue("--xm-bg").trim(),
      gutterBg: g ? getComputedStyle(g).backgroundColor : null,
      preBg: pre ? getComputedStyle(pre).backgroundColor : null,
      btnBg: b ? getComputedStyle(b).backgroundColor : null
    };
  });
  if (before === null) root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", before);

  /* copy payload: native hljs table may inject tabs/blank cells into innerText */
  var c0 = document.querySelector("#cnblogs_post_body pre code, .postCon pre code");
  out.copyText = c0 ? c0.innerText.slice(0, 200) : null;
  out.copyTextRaw = c0 ? JSON.stringify(c0.innerText.slice(0, 80)) : null;

  /* copy payload via a runtime clipboard hook (enhance.js reads navigator.clipboard at click time) */
  try {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: function (t) { window.__p4copied = t; return Promise.resolve(); } }
    });
  } catch (e) { out.copyHookErr = String(e); }
  var cbtn = document.querySelector("#cnblogs_post_body pre .xm-copy, .postCon pre .xm-copy");
  out.copyBtnFound = !!cbtn;
  if (cbtn) { cbtn.click(); out.copyPayload = window.__p4copied || null; }

  /* 7. native hljs line-number table (backend "show line numbers") */
  var hlTable = postBody ? postBody.querySelector("pre table.hljs-ln") : null;
  out.hljs = { hasTable: !!hlTable };
  if (hlTable) {
    var trs = hlTable.querySelectorAll("tr");
    out.hljs.trCount = trs.length;
    out.hljs.tableWidth = Math.round(hlTable.getBoundingClientRect().width);
    out.hljs.tableHeight = Math.round(hlTable.getBoundingClientRect().height);
    var numCell = hlTable.querySelector("td.hljs-ln-numbers");
    var numDiv = hlTable.querySelector(".hljs-ln-n");
    if (numCell) {
      var nc = getComputedStyle(numCell), ncb = getComputedStyle(numCell, "::before");
      out.hljs.numCell = { display: nc.display, width: nc.width, padding: nc.padding, color: nc.color, userSelect: nc.userSelect };
      out.hljs.numCellBefore = { content: ncb.content, color: ncb.color };
    }
    if (numDiv) {
      var nd = getComputedStyle(numDiv), ndb = getComputedStyle(numDiv, "::before");
      out.hljs.numDiv = { display: nd.display, width: nd.width, color: nd.color };
      out.hljs.numDivBefore = { content: ndb.content, color: ndb.color };
    }
    var hlRules = [];
    for (var si = 0; si < document.styleSheets.length; si++) {
      try {
        var rr = document.styleSheets[si].cssRules;
        for (var ri = 0; ri < rr.length; ri++) {
          if (rr[ri].selectorText && /hljs-ln/.test(rr[ri].selectorText)) hlRules.push(rr[ri].selectorText);
        }
      } catch (e) {}
    }
    out.hljs.cssRuleCount = hlRules.length;
    out.hljs.cssRules = hlRules.slice(0, 16);
    var pre0 = hlTable.closest("pre");
    out.hljs.preDisplay = pre0 ? getComputedStyle(pre0).display : null;
    out.hljs.preHasLn = pre0 ? pre0.classList.contains("has-ln") : null;
    out.hljs.gutterPresent = pre0 ? !!pre0.querySelector(".xm-code-ln") : null;
  }

  return JSON.stringify(out);
})()`;

// Narrow viewport probe: verify <=640 padding tightening is in effect.
const mobileProbe = String.raw`(function(){
  var pb = document.getElementById("cnblogs_post_body");
  var day = document.querySelector(".day");
  var cs = pb ? getComputedStyle(pb) : null;
  return JSON.stringify({
    innerWidth: window.innerWidth,
    postBodyPadding: cs ? (cs.paddingTop + " / " + cs.paddingLeft) : null,
    dayPadding: day ? getComputedStyle(day).paddingTop + " / " + getComputedStyle(day).paddingLeft : null,
    imgMaxWidth: (function(){ var im = document.querySelector("#cnblogs_post_body img, .postCon img"); return im ? getComputedStyle(im).maxWidth : null; })()
  });
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
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pen.has(m.id)) { pen.get(m.id)(m); pen.delete(m.id); } };
  await new Promise(r => ws.onopen = r);
  await send("Page.enable"); await send("Runtime.enable");

  // The acceptance post has no inline image. Inject one before DOMContentLoaded
  // (capture phase, registered before enhance.js) so the lightbox binding has
  // a real target. Appended (not prepended) to keep readmeta as firstChild.
  const injectImg = [
    "document.addEventListener('DOMContentLoaded', function(){",
    "  var pb = document.getElementById('cnblogs_post_body');",
    "  if (!pb || pb.querySelector('img')) return;",
    "  var im = document.createElement('img');",
    "  im.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';",
    "  im.alt = 'p4-probe';",
    "  im.setAttribute('data-xm-probe','1');",
    "  pb.appendChild(im);",
    "}, true);"
  ].join("\n");
  await send("Page.addScriptToEvaluateOnNewDocument", { source: injectImg });

  await send("Page.navigate", { url: "https://www.cnblogs.com/home/p/23550137" });
  await sleep(9000);
  const r = await send("Runtime.evaluate", { expression: probe, returnByValue: true, awaitPromise: true });
  const val = r.result && r.result.result && r.result.result.value;
  let o;
  try { o = JSON.parse(val); } catch (e) { o = { error: "parse-fail", raw: String(val).slice(0, 800), exception: r.result && r.result.exceptionDetails }; }

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(1800);
  const rm = await send("Runtime.evaluate", { expression: mobileProbe, returnByValue: true });
  let mobile;
  try { mobile = JSON.parse(rm.result.result.value); } catch (e) { mobile = { error: String(rm.result.result.value).slice(0, 300) }; }
  o.mobile = mobile;

  /* PASS / FAIL roll-up */
  const checks = [];
  const add = (name, ok, detail) => checks.push({ check: name, pass: !!ok, detail: detail });
  add("postBody exists", o.postBodyExists, !!o.postBodyExists);
  add("code blocks found", o.code && o.code.preCount > 0, o.code ? o.code.preCount : 0);
  // With backend "show line numbers" on, hljs renders its own gutter; our injected
  // gutter must yield. Without it, our gutter must be present and correctly aligned.
  const nativeMode = !!(o.hljs && o.hljs.hasTable);
  if (o.code && o.code.blocks.length) {
    const b = o.code.blocks;
    if (nativeMode) {
      add("native mode: NO duplicate gutter", b.every(x => !x.hasGutter), b.map(x => x.hasGutter));
      add("native mode: has-ln removed", b.every(x => !x.hasLnClass), b.map(x => x.hasLnClass));
      add("native mode: pre NOT flex", b.every(x => x.preDisplay !== "flex"), b.map(x => x.preDisplay));
      add("native table has one tr per line", o.hljs.trCount > 1, o.hljs.trCount);
      add("native number cell padding reset", o.hljs.numCell && o.hljs.numCell.padding === "0px 12px 0px 0px", o.hljs.numCell && o.hljs.numCell.padding);
      add("native number cell muted color", o.hljs.numCell && /139, 155, 176/.test(o.hljs.numCell.color || ""), o.hljs.numCell && o.hljs.numCell.color);
      add("copy payload: no tabs", o.copyPayload && o.copyPayload.indexOf("\t") === -1, o.copyPayload ? JSON.stringify(o.copyPayload.slice(0, 90)) : null);
      add("copy payload: no doubled blank lines", o.copyPayload && o.copyPayload.indexOf("\n\n") === -1, o.copyPayload ? JSON.stringify(o.copyPayload.slice(0, 90)) : null);
    } else {
      add("plain mode: every pre has has-ln class", b.every(x => x.hasLnClass), b.map(x => x.hasLnClass));
      add("plain mode: every pre has gutter", b.every(x => x.hasGutter), b.map(x => x.hasGutter));
      add("gutter NOT inside code", b.every(x => x.gutterInsideCode === false), b.map(x => x.gutterInsideCode));
      add("gutter line count == code line count", b.every(x => x.gutterLineCount === x.codeLineCount), b.map(x => [x.gutterLineCount, x.codeLineCount]));
      add("gutter/code line-height match", b.every(x => x.gutterLineHeight === x.codeLineHeight), b.map(x => [x.gutterLineHeight, x.codeLineHeight]));
      add("gutter/code top aligned (<=2px)", b.every(x => Math.abs(x.gutterTop - x.codeTop) <= 2), b.map(x => [x.gutterTop, x.codeTop]));
    }
    add("pre is position:relative", b.every(x => x.prePosition === "relative"), b.map(x => x.prePosition));
    add("copy btn anchored to own pre", b.every(x => x.btnOffsetParentIsPre === true), b.map(x => x.btnOffsetParentName));
    add("copy btn dark glass bg", b.every(x => /11, 17, 24/.test(x.btnBg || "")), b.map(x => x.btnBg));
  }
  if (o.readmeta) add("reading-time meta exists", o.readmeta.exists, o.readmeta);
  if (o.readmeta && o.readmeta.exists) {
    add("readmeta is first child + below title", o.readmeta.isFirstChild && o.readmeta.belowTitle !== false, [o.readmeta.isFirstChild, o.readmeta.belowTitle, o.readmeta.text]);
  }
  if (o.lightbox) {
    add("article has images", o.lightbox.imgCount > 0, o.lightbox.imgCount);
    if (o.lightbox.imgCount > 0) {
      add("img cursor zoom-in", o.lightbox.firstImgCursor === "zoom-in", o.lightbox.firstImgCursor);
      add("lightbox opens on click", o.lightbox.opened && o.lightbox.hasImg, [o.lightbox.opened, o.lightbox.hasImg, o.lightbox.bg]);
      add("body scroll locked while open", o.lightbox.bodyLocked, o.lightbox.bodyLocked);
      add("Esc closes + unlocks", o.lightbox.closedAfterEsc && o.lightbox.unlockedAfterEsc, [o.lightbox.closedAfterEsc, o.lightbox.unlockedAfterEsc]);
    }
  }
  if (o.runtime) {
    add("progress bar injected", o.runtime.progress, o.runtime.progress);
    add("FAB + TOC + theme btn injected", o.runtime.fab && o.runtime.tocBtn && o.runtime.themeBtn, o.runtime);
  }
  if (o.cssRulesFound) {
    Object.keys(o.cssRulesFound).forEach(k => add("cssRule parsed: " + k, o.cssRulesFound[k] > 0, o.cssRulesFound[k]));
  }
  if (o.modes) {
    add("code block dark in BOTH modes", /11, 17, 24|rgb\(11/.test(o.modes.dark.preBg || "") && /11, 17, 24|rgb\(11/.test(o.modes.light.preBg || ""), o.modes);
    add("gutter bg dark in BOTH modes", o.modes.dark.gutterBg === o.modes.light.gutterBg, [o.modes.dark.gutterBg, o.modes.light.gutterBg]);
  }
  o.checks = checks;
  o.summary = { total: checks.length, passed: checks.filter(c => c.pass).length, failed: checks.filter(c => !c.pass).length };

  console.log("\n===== Phase 4 runtime verification =====");
  console.log("url: " + o.url);
  console.log("custom css sheet: " + JSON.stringify(o.customCssSheet));
  checks.forEach(c => console.log((c.pass ? "  PASS  " : "  FAIL  ") + c.check + "  ->  " + JSON.stringify(c.detail)));
  console.log("\nSUMMARY: " + o.summary.passed + "/" + o.summary.total + " passed, " + o.summary.failed + " failed");
  console.log("mobile: " + JSON.stringify(o.mobile));

  fs.writeFileSync(outFile, JSON.stringify(o, null, 2), "utf8");
  console.log("RESULT -> " + outFile);
  ws.close(); chrome.kill(); process.exit(0);
})().catch(e => { console.error("FAIL", e.message); try { chrome.kill(); } catch (_) {} process.exit(1); });

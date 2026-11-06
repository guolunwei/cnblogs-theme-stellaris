const { spawn } = require("child_process");
const os = require("os"), path = require("path"), fs = require("fs");
const CHROME = process.env.XM_CHROME || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const target = process.argv[2] || "https://www.cnblogs.com/home/p/23550137";
const outFile = path.join(__dirname, "cdp-header-result.json");
const port = 9920 + Math.floor(Math.random() * 150);
const userDir = fs.mkdtempSync(path.join(os.tmpdir(), "hdr-"));
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--window-size=1440,900", `--remote-debugging-port=${port}`, `--user-data-dir=${userDir}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Deterministic, READ-ONLY probe: DOM existence, computed style, all matching CSS
// rules with source/order, ancestor overflow chain, and post-scroll is-stuck state.
const probe = String.raw`(async function(){
  var out = { url: location.href, ua: navigator.userAgent };
  var h = document.getElementById('header');
  out.headerExists = !!h;
  if (h) {
    out.headerTag = h.tagName; out.headerId = h.id;
    out.headerClass = String(h.className || '');
    out.headerOuterStart = h.outerHTML.slice(0, 420);
    var cs = getComputedStyle(h);
    out.computedBefore = {
      position: cs.position, top: cs.top, zIndex: cs.zIndex,
      overflow: cs.overflow, overflowX: cs.overflowX, overflowY: cs.overflowY,
      display: cs.display, height: cs.height, transform: cs.transform,
      backgroundColor: cs.backgroundColor,
      backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter
    };
    out.rectTopBefore = h.getBoundingClientRect().top;
    out.classListBefore = String(h.className || '');
    var chain = [], p = h.parentElement;
    while (p && chain.length < 12) {
      var pcs = getComputedStyle(p);
      chain.push({
        tag: p.tagName, id: p.id, cls: String(p.className || '').slice(0, 90),
        position: pcs.position, overflow: pcs.overflow,
        overflowX: pcs.overflowX, overflowY: pcs.overflowY,
        height: pcs.height, clientHeight: p.clientHeight, scrollHeight: p.scrollHeight,
        transform: pcs.transform, contain: pcs.contain
      });
      p = p.parentElement;
    }
    out.ancestors = chain;
  }
  var sheets = [];
  for (var i = 0; i < document.styleSheets.length; i++) {
    var s = document.styleSheets[i];
    var rec = { index: i, href: s.href, media: s.media ? s.media.mediaText : null, rules: [] };
    try {
      var rs = s.cssRules; rec.ruleCount = rs.length;
      for (var j = 0; j < rs.length; j++) {
        var r = rs[j];
        if (r.selectorText && /#header/.test(r.selectorText) && r.style && r.style.position) {
          rec.rules.push({ idx: j, selector: r.selectorText, position: r.style.position, cssText: r.cssText.slice(0, 260) });
        }
      }
    } catch (e) { rec.error = String(e).slice(0, 140); }
    sheets.push(rec);
  }
  out.styleSheets = sheets;

  var hrefs = sheets.map(function(s){ return s.href; }).filter(Boolean);
  out.files = [];
  for (var k = 0; k < hrefs.length; k++) {
    var u = hrefs[k], f = { url: u, order: k };
    try {
      var txt = await fetch(u, { cache: 'no-store' }).then(function(r){ return r.text(); });
      f.length = txt.length;
      var re = /#header[^{}]*\{[^{}]*\}/g, m, hits = [];
      while ((m = re.exec(txt)) !== null && hits.length < 25) {
        if (/position/.test(m[0])) hits.push({ at: m.index, text: m[0].slice(0, 240) });
      }
      f.headerPositionBlocks = hits;
      f.hasSticky = /#header[^{}]*\{[^}]*position\s*:\s*sticky/.test(txt);
      f.hasRelative = /#header[^{}]*\{[^}]*position\s*:\s*relative/.test(txt);
      f.head = txt.slice(0, 160);
    } catch (e) { f.error = String(e).slice(0, 140); }
    out.files.push(f);
  }

  try {
    window.scrollTo(0, 800);
    await new Promise(function(r){ setTimeout(r, 500); });
    out.scrollYAfter = window.scrollY;
    out.docScrollHeight = document.documentElement.scrollHeight;
    out.docClientHeight = document.documentElement.clientHeight;
    if (h) {
      out.rectTopAfter = h.getBoundingClientRect().top;
      out.classListAfter = String(h.className || '');
      out.isStuck = h.classList.contains('is-stuck');
      var ca = getComputedStyle(h);
      out.computedAfter = {
        position: ca.position, top: ca.top,
        backgroundColor: ca.backgroundColor,
        backdropFilter: ca.backdropFilter || ca.webkitBackdropFilter,
        boxShadow: ca.boxShadow
      };
    }
  } catch (e) { out.scrollError = String(e); }
  return JSON.stringify(out);
})()`;

(async () => {
  let ws;
  for (let i = 0; i < 40; i++) {
    try {
      const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
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
  await send("Page.navigate", { url: target });
  await sleep(7000);
  const r = await send("Runtime.evaluate", { expression: probe, returnByValue: true, awaitPromise: true });
  const val = r.result && r.result.result && r.result.result.value;
  fs.writeFileSync(outFile, val || JSON.stringify({ error: "no value", raw: JSON.stringify(r).slice(0, 2000) }), "utf8");
  if (val) {
    try {
      const o = JSON.parse(val);
      console.log("SUMMARY:", JSON.stringify({
        headerExists: o.headerExists,
        computedPosition: o.computedBefore && o.computedBefore.position,
        computedTop: o.computedBefore && o.computedBefore.top,
        isStuck: o.isStuck,
        rectTopBefore: o.rectTopBefore, rectTopAfter: o.rectTopAfter,
        scrollYAfter: o.scrollYAfter,
        sheetCount: o.styleSheets && o.styleSheets.length,
        ruleHits: (o.styleSheets || []).reduce((a, s) => a + (s.rules ? s.rules.length : 0), 0),
        filesWithSticky: (o.files || []).filter(f => f.hasSticky).map(f => f.url),
        filesWithRelative: (o.files || []).filter(f => f.hasRelative).map(f => f.url),
        ancestorNonVisibleOverflow: (o.ancestors || []).filter(a => a.overflow !== "visible" || a.overflowX !== "visible" || a.overflowY !== "visible")
      }, null, 2));
    } catch (e) { console.log("RESULT written (not JSON):", String(val).slice(0, 300)); }
  } else {
    console.log("ERROR payload:", JSON.stringify(r).slice(0, 1000));
  }
  ws.close(); chrome.kill(); process.exit(0);
})().catch(e => { console.error("FAIL", e.message); try { chrome.kill(); } catch (_) {} process.exit(1); });

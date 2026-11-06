const { spawn } = require("child_process");
const os = require("os"), path = require("path"), fs = require("fs");
const CHROME = process.env.XM_CHROME || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outFile = path.join(__dirname, "cdp-p0-verify-result.json");
const port = 9920 + Math.floor(Math.random() * 150);
const userDir = fs.mkdtempSync(path.join(os.tmpdir(), "p0v-"));
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--window-size=1440,900", `--remote-debugging-port=${port}`, `--user-data-dir=${userDir}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PAGES = [
  { label: "home", url: "https://www.cnblogs.com/home" },
  { label: "article", url: "https://www.cnblogs.com/home/p/23550137" }
];

// READ-ONLY probe. Temporarily sets html[data-theme] and (briefly) swaps the
// blogLogo src to a data URI to prove the conditional hide releases real logos.
// Everything is restored before the probe returns; nothing is written to the site.
const probe = String.raw`(async function(){
  var out = { url: location.href, ua: navigator.userAgent, modes: {} };
  var root = document.documentElement;
  var themeBefore = root.getAttribute("data-theme");
  var MODES = ["light", "dark"];

  function walk(rules, href, media, all){
    for (var j = 0; j < rules.length; j++){
      var r = rules[j];
      try { if (r.selectorText) all.push({ href: href, media: media, selector: r.selectorText, cssText: String(r.cssText).slice(0, 420) }); } catch(e){}
      if (r.cssRules) {
        var m2 = media;
        try { if (r.conditionText) m2 = (media ? media + " & " : "") + r.conditionText; } catch(e){}
        try { walk(r.cssRules, href, m2, all); } catch(e){}
      }
    }
  }
  var allRules = [];
  var sheets = [];
  for (var i = 0; i < document.styleSheets.length; i++){
    var s = document.styleSheets[i];
    var href = s.href || "(inline:" + i + ")";
    var media = s.media ? s.media.mediaText : "";
    var cnt = -1; try { cnt = s.cssRules.length; } catch(e){}
    sheets.push({ index: i, href: href, media: media, ruleCount: cnt });
    try { walk(s.cssRules, href, media, allRules); }
    catch(e){ allRules.push({ href: href, media: media, selector: "<CROSS-ORIGIN-BLOCKED>", cssText: String(e).slice(0, 140) }); }
  }
  out.sheets = sheets;
  out.flatRuleCount = allRules.length;
  function rulesFor(re){
    return allRules.filter(function(r){ return re.test(r.selector); })
      .map(function(r){ return { href: r.href, media: r.media, selector: r.selector, cssText: r.cssText }; });
  }

  function hex2rgb(h){
    h = String(h).trim().replace("#", "");
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  }
  function lum(c){
    var s = c.map(function(v){ v = v/255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
    return 0.2126*s[0] + 0.7152*s[1] + 0.0722*s[2];
  }
  function ratio(a, b){
    var l1 = lum(hex2rgb(a)), l2 = lum(hex2rgb(b));
    var hi = Math.max(l1,l2), lo = Math.min(l1,l2);
    return (hi+0.05)/(lo+0.05);
  }
  function pseudo(el, p){
    var c = getComputedStyle(el, p);
    return { content: c.content, display: c.display, width: c.width, height: c.height,
      backgroundColor: c.backgroundColor, backgroundImage: String(c.backgroundImage).slice(0, 150),
      opacity: c.opacity, transform: c.transform, borderRadius: c.borderRadius,
      left: c.left, right: c.right, bottom: c.bottom };
  }

  for (var mi = 0; mi < MODES.length; mi++){
    var MODE = MODES[mi];
    root.setAttribute("data-theme", MODE);
    void document.body.offsetHeight;
    var rs = getComputedStyle(root);
    var t = {};
    ["--xm-bg","--xm-bg-elevated","--xm-surface","--xm-surface-hover","--xm-border-strong","--xm-text-muted","--xm-accent","--xm-accent-text"]
      .forEach(function(k){ t[k] = rs.getPropertyValue(k).trim(); });
    var m = { mode: MODE, themeApplied: root.getAttribute("data-theme"), tokens: t };

    m.contrast = { muted: {}, borderStrong: {} };
    var surf = { "--xm-bg": t["--xm-bg"], "--xm-bg-elevated": t["--xm-bg-elevated"],
      "--xm-surface": t["--xm-surface"], "--xm-surface-hover": t["--xm-surface-hover"] };
    Object.keys(surf).forEach(function(k){
      try { m.contrast.muted[k] = +ratio(t["--xm-text-muted"], surf[k]).toFixed(2); } catch(e){ m.contrast.muted[k] = "ERR"; }
      try { m.contrast.borderStrong[k] = +ratio(t["--xm-border-strong"], surf[k]).toFixed(2); } catch(e){ m.contrast.borderStrong[k] = "ERR"; }
    });

    var img = document.getElementById("blogLogo");
    var lnk = document.getElementById("lnkBlogLogo");
    if (img){
      var ci = getComputedStyle(img);
      m.avatar = { outerHTML: img.outerHTML, srcAttr: img.getAttribute("src"),
        currentSrc: img.currentSrc, nw: img.naturalWidth, nh: img.naturalHeight,
        display: ci.display, width: ci.width, height: ci.height,
        borderRadius: ci.borderRadius, border: ci.border, boxShadow: ci.boxShadow,
        objectFit: ci.objectFit, lnkDisplay: lnk ? getComputedStyle(lnk).display : null };
      var orig = img.getAttribute("src");
      img.setAttribute("src", "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
      void document.body.offsetHeight;
      m.avatar.realSrcDisplay = getComputedStyle(img).display;
      m.avatar.realSrcLnkDisplay = lnk ? getComputedStyle(lnk).display : null;
      m.avatar.realSrcWidth = getComputedStyle(img).width;
      m.avatar.realSrcHeight = getComputedStyle(img).height;
      img.setAttribute("src", orig);
      void document.body.offsetHeight;
      m.avatar.restoredDisplay = getComputedStyle(img).display;
    } else { m.avatar = { missing: true }; }
    m.avatarRules = rulesFor(/blogLogo|lnkBlogLogo/).slice(0, 20);

    var links = Array.prototype.slice.call(document.querySelectorAll("#navList a.menu"));
    var cur = links.filter(function(a){ return a.classList.contains("is-current"); });
    var non = links.filter(function(a){ return !a.classList.contains("is-current"); });
    m.nav = { linkCount: links.length, isCurrentCount: cur.length,
      currentIds: cur.map(function(a){ return a.id; }),
      currentPaddingLeft: cur.length ? getComputedStyle(cur[0]).paddingLeft : null,
      currentBefore: cur.length ? pseudo(cur[0], "::before") : null,
      currentAfter: cur.length ? pseudo(cur[0], "::after") : null,
      nonCurrentAfter: non.length ? pseudo(non[0], "::after") : null };
    m.navRules = rulesFor(/navList a\.menu::/).slice(0, 25);
    m.sidebarRules = rulesFor(/newsItem ul li a::before/).slice(0, 10);
    out.modes[MODE] = m;
  }

  if (themeBefore === null) root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", themeBefore);

  var h = document.getElementById("header");
  out.sticky = { headerExists: !!h };
  if (h){
    var cb = getComputedStyle(h);
    out.sticky.before = { position: cb.position, top: cb.top, zIndex: cb.zIndex, rectTop: h.getBoundingClientRect().top };
    try {
      window.scrollTo(0, 800);
      await new Promise(function(r){ setTimeout(r, 600); });
      out.sticky.scrollY = window.scrollY;
      out.sticky.rectTopAfter = h.getBoundingClientRect().top;
      out.sticky.isStuck = h.classList.contains("is-stuck");
      var ca = getComputedStyle(h);
      out.sticky.after = { backgroundColor: ca.backgroundColor,
        backdropFilter: ca.backdropFilter || ca.webkitBackdropFilter, boxShadow: ca.boxShadow };
      window.scrollTo(0, 0);
    } catch(e){ out.sticky.error = String(e); }
  }
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

  const results = [];
  for (const pg of PAGES) {
    await send("Page.navigate", { url: pg.url });
    await sleep(9000);
    const r = await send("Runtime.evaluate", { expression: probe, returnByValue: true, awaitPromise: true });
    const val = r.result && r.result.result && r.result.result.value;
    let o;
    try { o = JSON.parse(val); } catch (e) { o = { error: "parse-fail", raw: String(val).slice(0, 600), runtimeError: r.result && r.result.exceptionDetails }; }
    o.label = pg.label;
    results.push(o);

    const cssHref = (o.sheets || []).map(s => s.href).filter(h => /custom\.css/.test(h))[0] || "?";
    const d = o.modes && o.modes.dark, l = o.modes && o.modes.light;
    console.log("\n===== " + pg.label + " =====");
    console.log("cssHref=" + cssHref + "  flatRuleCount=" + o.flatRuleCount);
    ["dark", "light"].forEach(function(mk){
      const m = o.modes && o.modes[mk]; if (!m) return;
      console.log(" [" + mk + "] border-strong=" + m.tokens["--xm-border-strong"] + " text-muted=" + m.tokens["--xm-text-muted"]);
      console.log("   contrast muted  : " + JSON.stringify(m.contrast.muted));
      console.log("   contrast border : " + JSON.stringify(m.contrast.borderStrong));
      console.log("   avatar: display=" + m.avatar.display + " lnk=" + m.avatar.lnkDisplay +
        " | realSrc->display=" + m.avatar.realSrcDisplay + " lnk=" + m.avatar.realSrcLnkDisplay +
        " " + m.avatar.realSrcWidth + "x" + m.avatar.realSrcHeight + " | restored=" + m.avatar.restoredDisplay);
      console.log("   avatarRules: " + m.avatarRules.map(r => r.selector).join(" | "));
      console.log("   nav: links=" + m.nav.linkCount + " isCurrent=" + m.nav.isCurrentCount +
        " ids=" + JSON.stringify(m.nav.currentIds));
      if (m.nav.currentBefore) console.log("   current ::before content=" + m.nav.currentBefore.content + " opacity=" + m.nav.currentBefore.opacity);
      if (m.nav.currentAfter) console.log("   current ::after height=" + m.nav.currentAfter.height + " opacity=" + m.nav.currentAfter.opacity + " transform=" + m.nav.currentAfter.transform + " bg=" + m.nav.currentAfter.backgroundImage);
      if (m.nav.nonCurrentAfter) console.log("   non-current ::after opacity=" + m.nav.nonCurrentAfter.opacity + " transform=" + m.nav.nonCurrentAfter.transform);
      console.log("   navRules: " + m.navRules.map(r => r.selector).join(" | "));
      console.log("   sidebarRules: " + m.sidebarRules.map(r => r.selector).join(" | "));
    });
    console.log(" sticky: " + JSON.stringify(o.sticky));
  }

  fs.writeFileSync(outFile, JSON.stringify(results, null, 2), "utf8");
  console.log("\nRESULT -> " + outFile);
  ws.close(); chrome.kill(); process.exit(0);
})().catch(e => { console.error("FAIL", e.message); try { chrome.kill(); } catch (_) {} process.exit(1); });

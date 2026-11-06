const { spawn } = require("child_process");
const os = require("os"), path = require("path"), fs = require("fs");
const CHROME = process.env.XM_CHROME || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const target = process.argv[2] || "https://www.cnblogs.com/home";
const port = 9920 + Math.floor(Math.random() * 150);
const userDir = fs.mkdtempSync(path.join(os.tmpdir(), "vrf-"));
const chrome = spawn(CHROME, ["--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check","--window-size=1440,900",`--remote-debugging-port=${port}`,`--user-data-dir=${userDir}`,"about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  let ws;
  for (let i = 0; i < 40; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const p = l.find(t => t.type === "page"); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch (e) {} await sleep(250); }
  let id = 0; const pen = new Map();
  const send = (method, p = {}) => new Promise((res) => { const i = ++id; pen.set(i, res); ws.send(JSON.stringify({ id: i, method, params: p })); });
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pen.has(m.id)) { pen.get(m.id)(m); pen.delete(m.id); } };
  await new Promise((r) => (ws.onopen = r));
  await send("Page.enable"); await send("Runtime.enable");
  await send("Page.navigate", { url: target });
  await sleep(5000);
  const probe = `(async function(){
    var h=document.querySelector("#header");
    var cs=getComputedStyle(h);
    var cssurl=null;
    [].slice.call(document.querySelectorAll('link[rel=stylesheet]')).forEach(function(a){ if(/custom\\.css/.test(a.href)) cssurl=a.href; });
    var fileHas=false, fileRules=null;
    if(cssurl){
      try{
        var t=await fetch(cssurl).then(function(r){return r.text();});
        fileHas=/#header\\{position:sticky/.test(t);
        var m=t.match(/#header\\{[^}]*\\}/g); fileRules=m;
      }catch(e){ fileRules='fetchErr:'+e.message; }
    }
    var applied=[];
    for(var i=0;i<document.styleSheets.length;i++){
      try{ var rs=document.styleSheets[i].cssRules; for(var j=0;j<rs.length;j++){ var r=rs[j]; if(r.selectorText && r.selectorText.indexOf("#header")>=0 && r.style && r.style.position){ applied.push(r.selectorText+"="+r.style.position); } } }catch(e){}
    }
    return JSON.stringify({
      computedPosition:cs.position, computedTop:cs.top, computedZ:cs.zIndex,
      cssurl:cssurl, fileHasStickyLine:fileHas, fileHeaderRules:fileRules, appliedHeaderRules:applied
    });
  })()`;
  const r = await send("Runtime.evaluate", { expression: probe, returnByValue: true, awaitPromise: true });
  console.log("VERIFY:", r.result.result.value);
  ws.close(); chrome.kill(); process.exit(0);
})().catch((e) => { console.error("FAIL", e.message); chrome.kill(); process.exit(1); });

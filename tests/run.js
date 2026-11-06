#!/usr/bin/env node
/* Stellaris CDP regression runner.
 * Runs each diagnostic script in order and aggregates pass/fail by exit code.
 * No hard-coded node/Chrome paths: node is process.execPath; Chrome is
 * resolved from env vars, common install locations, then PATH.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const HERE = __dirname;
const NODE = process.execPath;

const SUITES = [
  "cdp-verify.js",
  "cdp-header.js",
  "cdp-p0-verify.js",
  "cdp-p4-verify.js",
  "cdp-p4-fixcheck.js"
];

function firstExisting(list) {
  for (const p of list) {
    try {
      if (p && fs.existsSync(p)) return p;
    } catch (e) { /* ignore an unusable path */ }
  }
  return null;
}

function findChrome() {
  /* 1. Explicit environment override. */
  const envPath = firstExisting(
    ["XM_CHROME", "CHROME_PATH", "CHROME_BIN"].map((k) => process.env[k])
  );
  if (envPath) return envPath;

  /* 2. Common install locations (Windows / macOS / Linux, Chrome + Edge). */
  const common = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ];
  const hit = firstExisting(common);
  if (hit) return hit;

  /* 3. PATH lookup. */
  const names = process.platform === "win32"
    ? ["chrome.exe", "msedge.exe"]
    : ["google-chrome", "chromium", "chrome", "msedge"];
  const dirs = (process.env.PATH || "").split(path.delimiter);
  for (const d of dirs) {
    for (const n of names) {
      const p = path.join(d, n);
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

function tail(text, lines) {
  const arr = String(text || "").split("\n").filter((l) => l.trim() !== "");
  return arr.slice(-lines).join("\n");
}

const dryRun = process.argv.includes("--dry-run") || process.env.XM_DRYRUN === "1";
const chrome = findChrome();

console.log("=== Stellaris CDP regression ===");
console.log("node   : " + NODE);
console.log("chrome : " + (chrome || "NOT FOUND"));
console.log("suites : " + SUITES.length);
SUITES.forEach((s, i) => console.log("  [" + (i + 1) + "] " + s));

if (dryRun) {
  console.log("--dry-run: diagnostics not executed (no network / no Chrome launch).");
  if (!chrome) {
    console.log("Hint: set XM_CHROME=/path/to/chrome(or msedge), or install Chrome/Edge.");
  }
  console.log("Summary: 0 run, 0 failed (dry-run).");
  process.exit(0);
}

if (!chrome) {
  console.log("");
  console.log("Chrome/Edge not found. These diagnostics drive a headless browser via CDP,");
  console.log("so a local Chrome or Edge is required. Set XM_CHROME to its full path, or");
  console.log("install Chrome/Edge in a standard location, then re-run.");
  console.log("Nothing was executed; this is not a test failure.");
  console.log("Summary: 0 run, 0 failed (environment not ready).");
  process.exit(0);
}

const env = Object.assign({}, process.env, { XM_CHROME: chrome });
const results = [];
let failed = 0;

for (const s of SUITES) {
  const file = path.join(HERE, s);
  if (!fs.existsSync(file)) {
    results.push({ name: s, status: "MISSING" });
    failed++;
    console.log("[" + s + "] MISSING (file not found)");
    continue;
  }
  const r = spawnSync(NODE, [file], {
    env: env,
    encoding: "utf8",
    timeout: 120000,
    windowsHide: true
  });
  const ok = !r.error && r.status === 0;
  const status = ok ? "PASS" : "FAIL";
  if (!ok) failed++;
  results.push({ name: s, status: status });
  console.log("[" + s + "] " + status + " (exit=" + (r.status === null ? "timeout/error" : r.status) + ")");
  const out = tail(r.stdout, 8);
  if (out) console.log(out.split("\n").map((l) => "    " + l).join("\n"));
  if (!ok && r.stderr) {
    const err = tail(r.stderr, 4);
    if (err) console.log(err.split("\n").map((l) => "    " + l).join("\n"));
  }
}

console.log("");
console.log("=== Summary ===");
results.forEach((r) => console.log("  " + (r.status === "PASS" ? "PASS" : "FAIL") + "  " + r.name));
console.log(results.length + " total, " + (results.length - failed) + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);

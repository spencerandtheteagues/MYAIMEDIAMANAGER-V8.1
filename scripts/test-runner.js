// scripts/test-runner.js
/* eslint-disable no-console */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import dayjs from "dayjs";

const PHASE = process.argv.includes("--phase=int") ? "int"
           : process.argv.includes("--phase=e2e") ? "e2e" : "full";

const RUN_ID = dayjs().format("YYYYMMDD-HHmmss");
const ROOT = path.resolve(".");
const ART_DIR = path.join(ROOT, "test-artifacts", RUN_ID);
const LOG_DIR = path.join(ART_DIR, "logs");
const DATA_DIR = path.join(ART_DIR, "data");
const IMG_DIR = path.join(ART_DIR, "images");
const VID_DIR = path.join(ART_DIR, "videos");
const SCR_DIR = path.join(ART_DIR, "screens");

for (const d of [ART_DIR, LOG_DIR, DATA_DIR, IMG_DIR, VID_DIR, SCR_DIR]) fs.mkdirSync(d, { recursive: true });

function run(cmd, env = {}) {
  console.log(`\n$ ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
  } catch (error) {
    console.error(`Command failed: ${cmd}`);
    throw error;
  }
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
}

async function buildReport(results, outDir) {
  const dataDir = path.join(outDir, "data");
  const imgDir = path.join(outDir, "images");
  const vidDir = path.join(outDir, "videos");
  const scrDir = path.join(outDir, "screens");
  const list = (dir, exts) => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => exts.some(e => f.endsWith(e))) : [];

  const imgs = list(imgDir, [".png",".jpg",".jpeg"]);
  const vids = list(vidDir, [".mp4",".webm"]);
  const scrs = list(scrDir, [".png"]);

  const html = `<!doctype html>
<html><head>
<meta charset="utf-8"/>
<title>Test Report ${results.runId}</title>
<style>
 body{background:#0a0a0b;color:#e5e7eb;font-family:ui-sans-serif,system-ui}
 .chip{display:inline-block;padding:4px 8px;border-radius:999px;margin-right:6px}
 .pass{background:#065f46} .fail{background:#7f1d1d}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
 .card{background:#111114;border:1px solid #1f2937;border-radius:12px;padding:10px}
 video, img{width:100%;border-radius:8px}
 a{color:#a78bfa}
</style></head>
<body>
<h1>Run ${results.runId} — <span class="chip ${results.status==="PASS"?"pass":"fail"}">${results.status}</span></h1>
<h2>Phases</h2>
${results.phases.map(p=>`<span class="chip ${p.status==="PASS"?"pass":"fail"}">${p.name}: ${p.status}</span>`).join("")}

<h2>UI Screenshots</h2>
<div class="grid">${scrs.map(f=>`<div class="card"><img src="./screens/${f}"/><div>${f}</div></div>`).join("")}</div>

<h2>Generated Images</h2>
<div class="grid">${imgs.map(f=>`<div class="card"><img src="./images/${f}"/><div>${f}</div></div>`).join("")}</div>

<h2>Generated Videos</h2>
<div class="grid">${vids.map(f=>`<div class="card"><video controls src="./videos/${f}"></video><div>${f}</div></div>`).join("")}</div>

<h2>Data</h2>
<ul>
  ${(fs.existsSync(dataDir)?fs.readdirSync(dataDir):[]).map(f=>`<li><a href="./data/${f}">${f}</a></li>`).join("")}
</ul>
</body></html>`;
  fs.writeFileSync(path.join(outDir, "report.html"), html);
}

(async () => {
  const results = { runId: RUN_ID, startedAt: new Date().toISOString(), phases: [], status: "PENDING" };

  // Health gates
  try {
    run(`node scripts/check-health.js ${ART_DIR}`);
    results.phases.push({ name: "health", status: "PASS" });
  } catch (error) {
    console.error("Health check failed:", error.message);
    results.phases.push({ name: "health", status: "FAIL" });
    results.status = "FAIL";
    await buildReport(results, ART_DIR);
    process.exit(1);
  }

  // Unit (optional)
  if (PHASE === "full") {
    try {
      // Using vitest if available, otherwise skip
      if (fs.existsSync(path.join(ROOT, "node_modules", ".bin", "vitest"))) {
        run(`npm run test:unit`);
        results.phases.push({ name: "unit", status: "PASS" });
      } else {
        console.log("Skipping unit tests (vitest not installed)");
        results.phases.push({ name: "unit", status: "SKIP" });
      }
    } catch (error) {
      console.error("Unit tests failed:", error.message);
      results.phases.push({ name: "unit", status: "FAIL" });
      results.status = "FAIL";
    }
  }

  // Integration API checks
  if (PHASE === "full" || PHASE === "int") {
    try {
      run(`node scripts/run-int-tests.js ${ART_DIR}`);
      results.phases.push({ name: "integration", status: "PASS" });
    } catch (error) {
      console.error("Integration tests failed:", error.message);
      results.phases.push({ name: "integration", status: "FAIL" });
      results.status = "FAIL";
    }
  }

  // E2E (artifact producing)
  if (PHASE === "full" || PHASE === "e2e") {
    try {
      // Check if playwright config exists
      const configPath = path.join(ROOT, "playwright.config.ts");
      if (fs.existsSync(configPath)) {
        run(`npx playwright test --config=${configPath} --reporter=list`, {
          ART_DIR, IMG_DIR, VID_DIR, SCR_DIR, DATA_DIR
        });
      } else {
        // Run with default config
        run(`npx playwright test --reporter=list`, {
          ART_DIR, IMG_DIR, VID_DIR, SCR_DIR, DATA_DIR
        });
      }
      results.phases.push({ name: "e2e", status: "PASS" });
    } catch (error) {
      console.error("E2E tests failed:", error.message);
      results.phases.push({ name: "e2e", status: "FAIL" });
      results.status = "FAIL";
    }
  }

  results.status = results.status === "PENDING" ? "PASS" : results.status;
  results.endedAt = new Date().toISOString();
  writeJson(path.join(DATA_DIR, "results.json"), results);
  await buildReport(results, ART_DIR);
  console.log(`\n✅ Test Run Complete: ${results.status}`);
  console.log(`📁 Artifacts: ${ART_DIR}`);
  console.log(`📊 Report: ${path.join(ART_DIR, "report.html")}`);
  
  if (results.status !== "PASS") {
    console.log(`\n❌ Tests failed. Review the report for details.`);
    process.exit(1);
  }
})();
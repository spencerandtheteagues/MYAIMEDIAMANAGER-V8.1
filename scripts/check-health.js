// scripts/check-health.js
import fs from "node:fs";
import path from "node:path";

const ART_DIR = process.argv[2];
if (!ART_DIR) {
  console.error("Usage: node scripts/check-health.js <artifact-dir>");
  process.exit(1);
}

const base = process.env.E2E_BASE_URL || "http://localhost:5000";
const out = { base, ts: new Date().toISOString(), health: null, ready: null };

console.log(`Checking health at ${base}...`);

try {
  // Check /health endpoint
  const healthResponse = await fetch(`${base}/health`);
  if (healthResponse.status !== 200) {
    throw new Error(`Health check failed with status ${healthResponse.status}`);
  }
  const healthData = await healthResponse.json();
  out.health = { status: 200, data: healthData };
  console.log("✓ Health check passed");

  // Check /ready endpoint
  const readyResponse = await fetch(`${base}/ready`);
  const readyData = await readyResponse.json();
  out.ready = { status: readyResponse.status, data: readyData };
  
  if (readyResponse.status !== 200) {
    console.error("✗ Ready check failed");
    fs.mkdirSync(path.join(ART_DIR, "data"), { recursive: true });
    fs.writeFileSync(path.join(ART_DIR, "data", "health.json"), JSON.stringify(out, null, 2));
    throw new Error(`Ready check failed with status ${readyResponse.status}`);
  }
  console.log("✓ Ready check passed");

  // Save successful health check data
  fs.mkdirSync(path.join(ART_DIR, "data"), { recursive: true });
  fs.writeFileSync(path.join(ART_DIR, "data", "health.json"), JSON.stringify(out, null, 2));
  
  console.log("✓ All health checks passed");
  process.exit(0);
} catch (error) {
  console.error("Health check error:", error.message);
  // Save error data
  fs.mkdirSync(path.join(ART_DIR, "data"), { recursive: true });
  fs.writeFileSync(path.join(ART_DIR, "data", "health-error.json"), JSON.stringify({
    ...out,
    error: error.message
  }, null, 2));
  process.exit(1);
}
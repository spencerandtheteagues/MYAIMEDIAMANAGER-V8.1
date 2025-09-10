// scripts/security-audit.js
import fs from "node:fs";
import path from "node:path";

const vulnerabilities = [];
const fixes = [];

// Check for common security issues
function auditFile(filePath, content) {
  const relPath = path.relative(".", filePath);
  
  // 1. Check for hardcoded secrets
  const secretPatterns = [
    /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi,
    /secret\s*[:=]\s*["'][^"']+["']/gi,
    /password\s*[:=]\s*["'][^"']+["']/gi,
    /token\s*[:=]\s*["'][^"']+["']/gi,
  ];
  
  for (const pattern of secretPatterns) {
    if (pattern.test(content) && !filePath.includes(".env") && !filePath.includes("example")) {
      vulnerabilities.push({
        severity: "HIGH",
        file: relPath,
        issue: "Potential hardcoded secret",
        fix: "Move to environment variables"
      });
    }
  }
  
  // 2. Check for SQL injection risks
  if (filePath.includes(".ts") || filePath.includes(".js")) {
    if (/db\.(query|execute|run)\s*\([^)]*\$\{/g.test(content)) {
      vulnerabilities.push({
        severity: "CRITICAL",
        file: relPath,
        issue: "Potential SQL injection via template literals",
        fix: "Use parameterized queries"
      });
    }
    
    if (/eval\s*\(/g.test(content)) {
      vulnerabilities.push({
        severity: "CRITICAL",
        file: relPath,
        issue: "Use of eval() function",
        fix: "Remove eval() and use safer alternatives"
      });
    }
  }
  
  // 3. Check for XSS vulnerabilities
  if (filePath.includes(".tsx") || filePath.includes(".jsx")) {
    if (/dangerouslySetInnerHTML/g.test(content)) {
      vulnerabilities.push({
        severity: "HIGH",
        file: relPath,
        issue: "Use of dangerouslySetInnerHTML",
        fix: "Sanitize HTML content or use text content"
      });
    }
    
    if (/innerHTML\s*=/g.test(content)) {
      vulnerabilities.push({
        severity: "HIGH",
        file: relPath,
        issue: "Direct innerHTML assignment",
        fix: "Use textContent or sanitized HTML"
      });
    }
  }
  
  // 4. Check for missing input validation
  if (filePath.includes("routes") || filePath.includes("api")) {
    const hasValidation = /zod|joi|yup|express-validator/g.test(content);
    const hasBodyAccess = /req\.body/g.test(content);
    
    if (hasBodyAccess && !hasValidation && !content.includes("insertSchema")) {
      vulnerabilities.push({
        severity: "MEDIUM",
        file: relPath,
        issue: "Missing input validation on request body",
        fix: "Add Zod validation for all inputs"
      });
    }
  }
  
  // 5. Check for insecure session configuration
  if (filePath.includes("server") && content.includes("session")) {
    if (!content.includes("secure: true") && !content.includes("NODE_ENV")) {
      vulnerabilities.push({
        severity: "MEDIUM",
        file: relPath,
        issue: "Session cookie not set to secure in production",
        fix: "Set secure: true for production"
      });
    }
    
    if (!content.includes("httpOnly: true")) {
      vulnerabilities.push({
        severity: "HIGH",
        file: relPath,
        issue: "Session cookie not set to httpOnly",
        fix: "Set httpOnly: true"
      });
    }
  }
  
  // 6. Check for missing rate limiting
  if (filePath.includes("routes") && content.includes("POST")) {
    if (!content.includes("rate") && !content.includes("limit")) {
      vulnerabilities.push({
        severity: "MEDIUM",
        file: relPath,
        issue: "Missing rate limiting on POST endpoints",
        fix: "Add express-rate-limit middleware"
      });
    }
  }
  
  // 7. Check for CORS issues
  if (filePath.includes("server") && content.includes("cors")) {
    if (content.includes("origin: true") || content.includes("origin: '*'")) {
      vulnerabilities.push({
        severity: "MEDIUM",
        file: relPath,
        issue: "CORS allows all origins",
        fix: "Restrict CORS to specific domains"
      });
    }
  }
}

// Scan the codebase
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith(".") && file !== "node_modules" && file !== "dist") {
        scanDirectory(filePath);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
        const content = fs.readFileSync(filePath, "utf-8");
        auditFile(filePath, content);
      }
    }
  }
}

// Additional checks
function performAdditionalChecks() {
  // Check for .env in gitignore
  if (fs.existsSync(".gitignore")) {
    const gitignore = fs.readFileSync(".gitignore", "utf-8");
    if (!gitignore.includes(".env")) {
      vulnerabilities.push({
        severity: "CRITICAL",
        file: ".gitignore",
        issue: ".env not in gitignore",
        fix: "Add .env to .gitignore"
      });
    }
  }
  
  // Check package.json for vulnerable dependencies
  if (fs.existsSync("package.json")) {
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
    
    // Check for outdated security-critical packages
    const criticalPackages = ["bcryptjs", "helmet", "express-rate-limit", "cors"];
    for (const pkgName of criticalPackages) {
      if (!pkg.dependencies[pkgName] && !pkg.devDependencies?.[pkgName]) {
        fixes.push({
          type: "DEPENDENCY",
          package: pkgName,
          action: "Install security package"
        });
      }
    }
  }
  
  // Check for HTTPS enforcement
  const serverFiles = ["server/index.ts", "server/routes.ts"];
  for (const file of serverFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, "utf-8");
      if (!content.includes("helmet") && !content.includes("hsts")) {
        vulnerabilities.push({
          severity: "MEDIUM",
          file: file,
          issue: "Missing HTTPS enforcement headers",
          fix: "Add helmet middleware with HSTS"
        });
      }
    }
  }
}

// Run the audit
console.log("🔍 Starting Security Audit...\n");

scanDirectory("server");
scanDirectory("client/src");
performAdditionalChecks();

// Sort vulnerabilities by severity
const severityOrder = { "CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3 };
vulnerabilities.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

// Generate report
console.log("=".repeat(80));
console.log("SECURITY AUDIT REPORT");
console.log("=".repeat(80));
console.log(`Total Issues Found: ${vulnerabilities.length}`);

const bySeverity = {};
for (const vuln of vulnerabilities) {
  if (!bySeverity[vuln.severity]) bySeverity[vuln.severity] = 0;
  bySeverity[vuln.severity]++;
}

console.log("\nSummary:");
for (const [severity, count] of Object.entries(bySeverity)) {
  console.log(`  ${severity}: ${count}`);
}

console.log("\n" + "=".repeat(80));
console.log("VULNERABILITIES:");
console.log("=".repeat(80));

for (const vuln of vulnerabilities) {
  console.log(`\n[${vuln.severity}] ${vuln.file}`);
  console.log(`  Issue: ${vuln.issue}`);
  console.log(`  Fix: ${vuln.fix}`);
}

if (fixes.length > 0) {
  console.log("\n" + "=".repeat(80));
  console.log("RECOMMENDED FIXES:");
  console.log("=".repeat(80));
  for (const fix of fixes) {
    console.log(`\n${fix.type}: ${fix.package}`);
    console.log(`  Action: ${fix.action}`);
  }
}

// Save report
const report = {
  timestamp: new Date().toISOString(),
  totalIssues: vulnerabilities.length,
  bySeverity,
  vulnerabilities,
  fixes
};

fs.writeFileSync("security-audit-report.json", JSON.stringify(report, null, 2));

console.log("\n" + "=".repeat(80));
console.log(`📊 Full report saved to: security-audit-report.json`);
console.log("=".repeat(80));

// Exit with error if critical issues found
if (bySeverity["CRITICAL"]) {
  console.error("\n⚠️  CRITICAL vulnerabilities found! Fix immediately.");
  process.exit(1);
} else if (vulnerabilities.length === 0) {
  console.log("\n✅ No vulnerabilities found!");
  process.exit(0);
} else {
  console.log("\n⚠️  Non-critical vulnerabilities found. Review and fix.");
  process.exit(0);
}
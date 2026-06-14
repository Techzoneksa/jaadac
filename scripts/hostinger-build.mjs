import { execSync } from "node:child_process";
import { existsSync, cpSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const appsWeb = join(root, "apps/web");

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  JAAD CLOUD — Hostinger Build Script");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// Step 1: Install
console.log("[1/3] Installing apps/web dependencies...");
execSync("npm install", { cwd: appsWeb, stdio: "inherit" });

// Step 2: Build
console.log("\n[2/3] Building Next.js app (standalone)...");
execSync("npm run build", { cwd: appsWeb, stdio: "inherit" });

// Step 3: Prepare standalone folder at root for Hostinger
console.log("\n[3/3] Preparing standalone folder at root...");
const nextDir = join(appsWeb, ".next");
const standaloneSrc = join(nextDir, "standalone");
const staticSrc = join(nextDir, "static");
const publicSrc = join(appsWeb, "public");

const destDir = join(root, "standalone");

// Clean + create destination
if (existsSync(destDir)) {
  rmSync(destDir, { recursive: true, force: true });
}

if (!existsSync(standaloneSrc)) {
  console.error("\n❌ apps/web/.next/standalone not found. Build may have failed.");
  process.exit(1);
}

cpSync(standaloneSrc, destDir, { recursive: true });

// Copy .next/static to standalone/apps/web/.next/static
const destNextStatic = join(destDir, "apps/web/.next/static");
mkdirSync(destNextStatic, { recursive: true });
cpSync(staticSrc, destNextStatic, { recursive: true });

// Copy public/ to standalone/apps/web/public if exists
if (existsSync(publicSrc)) {
  const destPublic = join(destDir, "apps/web/public");
  mkdirSync(destPublic, { recursive: true });
  cpSync(publicSrc, destPublic, { recursive: true });
}

// Copy .next/static also to root standalone/.next/static as fallback
try {
  const destStaticFallback = join(destDir, ".next/static");
  mkdirSync(destStaticFallback, { recursive: true });
  cpSync(staticSrc, destStaticFallback, { recursive: true });
} catch {
  // non-critical
}

// Locate real server inside apps/web
const realServer = join(destDir, "apps/web/server.js");

if (!existsSync(realServer)) {
  console.error("\n❌ apps/web/server.js not found in standalone output. Check build.");
  process.exit(1);
}

// Create standalone/server.js wrapper
const wrapperPath = join(destDir, "server.js");
const wrapperContent = [
  `import { chdir } from "node:process";`,
  `import { fileURLToPath } from "node:url";`,
  `import { dirname, join } from "node:path";`,
  ``,
  `const __dirname = dirname(fileURLToPath(import.meta.url));`,
  `const realDir = join(__dirname, "apps/web");`,
  `chdir(realDir);`,
  `await import("./apps/web/server.js");`,
  ``,
].join("\n");

writeFileSync(wrapperPath, wrapperContent, "utf-8");

// Validate final output — both files must exist
const outputDir = destDir;
const serverFiles = [
  ["standalone/server.js", wrapperPath],
  ["standalone/apps/web/server.js", realServer],
];

const missing = serverFiles.filter(([, p]) => !existsSync(p));
if (missing.length > 0) {
  console.error("\n❌ ERROR: No output directory found after build");
  for (const [label] of missing) {
    console.error(`   Missing: ${label}`);
  }
  process.exit(1);
}

// Step 4: Write .htaccess to public_html/ on Hostinger server
const publicHtml = "/home/u633767125/domains/jaadscloud.com/public_html";
if (existsSync(publicHtml)) {
  const htaccessContent = [
    "Options -Indexes",
    "RewriteEngine On",
    "RewriteCond %{REQUEST_FILENAME} !-f",
    "RewriteCond %{REQUEST_FILENAME} !-d",
    "RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]",
    "",
  ].join("\n");
  writeFileSync(join(publicHtml, ".htaccess"), htaccessContent, "utf-8");
  console.log("   .htaccess written to public_html/  ✔");
} else {
  console.log("   public_html/ not found (local build) — skipping .htaccess");
}

console.log(`\n✅ Hostinger build complete.`);
console.log(`   Output: ${outputDir}`);
for (const [label] of serverFiles) {
  console.log(`   ${label}  ✔`);
}

import { execSync } from "node:child_process";
import { existsSync, cpSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const appsWeb = join(root, "apps/web");

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  JAAD CLOUD — Hostinger Build Script");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

console.log("[1/3] Installing apps/web dependencies...");
execSync("npm install", { cwd: appsWeb, stdio: "inherit" });

console.log("\n[2/3] Building Next.js app...");
execSync("npm run build", { cwd: appsWeb, stdio: "inherit" });

console.log("\n[3/3] Copying .next to root for Hostinger...");
const srcNext = join(appsWeb, ".next");
const destNext = join(root, ".next");

if (existsSync(destNext)) {
  rmSync(destNext, { recursive: true, force: true });
}

cpSync(srcNext, destNext, { recursive: true });

console.log("\n✅ Hostinger build complete.");
console.log(`   Source: ${srcNext}`);
console.log(`   Output: ${destNext}`);

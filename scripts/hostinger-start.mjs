import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const appDir = join(root, "apps/web");
const port = process.env.PORT || "3000";

// Determine which .next to use and where to run from
const rootNext = join(root, ".next");
const appNext = join(appDir, ".next");
const useRootNext = existsSync(rootNext) && !existsSync(appNext);
const cwd = useRootNext ? root : appDir;
const nextDir = useRootNext ? "root" : "apps/web";

// Next.js binary from apps/web (available after npm install)
const nextBin = join(appDir, "node_modules/next/dist/bin/next");

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  JAAD CLOUD — Hostinger Start Script");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
console.log("  Next.js from:", nextDir);
console.log("  CWD:", cwd);
console.log("  Port:", port);
console.log("  Node:", process.version);
console.log("  NODE_PATH:", join(appDir, "node_modules"));
if (process.env.SCRIPT_NAME) {
  console.log("  ⚠ SCRIPT_NAME is set:", process.env.SCRIPT_NAME);
  console.log("  This may affect routing. Clear it in hPanel if routes break.");
}
console.log("");

const child = spawn(
  process.execPath,
  [nextBin, "start", "-p", port],
  {
    cwd,
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: port,
      NODE_PATH: join(appDir, "node_modules"),
    },
  },
);

child.on("exit", (code, signal) => {
  console.log(`\n❌ Next.js exited (code: ${code}, signal: ${signal})`);
  process.exit(code ?? 1);
});

process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));

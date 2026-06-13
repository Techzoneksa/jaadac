import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const appDir = join(root, "apps/web");
const port = process.env.PORT || "3000";

const rootNext = join(root, ".next");
const appNext = join(appDir, ".next");
const useRootNext = existsSync(rootNext) && !existsSync(appNext);
const cwd = useRootNext ? root : appDir;
const nextBin = join(appDir, "node_modules/next/dist/bin/next");

console.log("[JAAD CLOUD] Starting Next.js...");
console.log(`  Port: ${port}`);
console.log(`  Build: ${useRootNext ? "root .next" : "apps/web .next"}`);
console.log(`  NODE_PATH: ${join(appDir, "node_modules")}`);
if (process.env.SCRIPT_NAME) {
  console.log("  ⚠ SCRIPT_NAME is set:", process.env.SCRIPT_NAME);
}

const child = spawn(process.execPath, [nextBin, "start", "-p", port], {
  cwd,
  stdio: "inherit",
  env: { ...process.env, PORT: port, NODE_PATH: join(appDir, "node_modules") },
});

child.on("exit", (code) => process.exit(code ?? 1));
process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const port = process.env.PORT || "3000";

const standaloneDir = join(root, "standalone");
const candidates = [
  join(standaloneDir, "server.js"),
  join(standaloneDir, "apps/web/server.js"),
];

const serverFile = candidates.find((f) => existsSync(f));
const serverDir = serverFile ? dirname(serverFile) : null;

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  JAAD CLOUD — Hostinger Start Script");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
console.log("  Port:", port);
console.log("  Node:", process.version);

function runFallback() {
  console.log("\n  ⚠ Standalone not found, falling back to next start...\n");
  const appDir = join(root, "apps/web");
  const nextBin = join(appDir, "node_modules/next/dist/bin/next");
  const rootNext = join(root, ".next");
  const appNext = join(appDir, ".next");
  const useRootNext = existsSync(rootNext) && !existsSync(appNext);
  const cwd = useRootNext ? root : appDir;

  const child = spawn(process.execPath, [nextBin, "start", "-p", port], {
    cwd,
    stdio: "inherit",
    env: { ...process.env, PORT: port, NODE_PATH: join(appDir, "node_modules") },
  });
  child.on("exit", (code) => process.exit(code ?? 1));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
  process.on("SIGINT", () => child.kill("SIGINT"));
}

function runStandalone(file, cwd) {
  console.log("  Server:", file);
  console.log("  CWD:", cwd);
  if (process.env.SCRIPT_NAME) {
    console.log("  ⚠ SCRIPT_NAME is set:", process.env.SCRIPT_NAME);
  }
  console.log("");

  const child = spawn(process.execPath, [file], {
    cwd,
    stdio: "inherit",
    env: { ...process.env, PORT: port, HOSTNAME: "0.0.0.0" },
  });
  child.on("exit", (code, signal) => {
    console.log(`\n❌ Standalone server exited (code: ${code}, signal: ${signal})`);
    process.exit(code ?? 1);
  });
  process.on("SIGTERM", () => child.kill("SIGTERM"));
  process.on("SIGINT", () => child.kill("SIGINT"));
}

if (serverFile && serverDir) {
  runStandalone(serverFile, serverDir);
} else {
  runFallback();
}

import { spawn } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const appDir = join(root, "apps/web");
const port = process.env.PORT || "3000";

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  JAAD CLOUD — Hostinger Start Script");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
console.log("  App directory:", appDir);
console.log("  Port:", port);
console.log("  Node:", process.version);
console.log("");

const child = spawn("npm", ["run", "start", "--", "-p", port], {
  cwd: appDir,
  stdio: "inherit",
  shell: true,
  env: { ...process.env, PORT: port },
});

child.on("exit", (code, signal) => {
  console.log(`\n❌ Next.js exited (code: ${code}, signal: ${signal})`);
  process.exit(code ?? 1);
});

process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));

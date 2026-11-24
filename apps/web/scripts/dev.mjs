// Starts local Supabase if needed, then Next.js.
import { spawn, spawnSync } from "node:child_process";

const SUPABASE_DIR = "../.."; // repo root, where supabase/config.toml lives
const run = (cmd, opts = {}) => spawnSync(cmd, { shell: true, ...opts });

if (run("docker info", { stdio: "ignore" }).status !== 0) {
  console.error("\n✖ Docker is not running. Open Docker Desktop, wait until it's ready, then run `npm run dev` again.\n");
  process.exit(1);
}

if (run(`supabase status --workdir ${SUPABASE_DIR}`, { stdio: "ignore" }).status === 0) {
  console.log("✔ Local Supabase already running.");
} else {
  console.log("Starting local Supabase (first run downloads Docker images and can take a few minutes)...");
  if (run(`supabase start --workdir ${SUPABASE_DIR}`, { stdio: "inherit" }).status !== 0) {
    console.error("\n✖ `supabase start` failed. See the output above.\n");
    process.exit(1);
  }
}

console.log("Mailpit inbox (local emails): http://127.0.0.1:54424\n");

const next = spawn("next dev", { shell: true, stdio: "inherit" });
next.on("exit", (code) => process.exit(code ?? 0));

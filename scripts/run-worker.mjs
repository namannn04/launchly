import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { applyEnvFilesToProcess } from "./load-env.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

applyEnvFilesToProcess();

const workerEntry = path.join(projectRoot, "backend/workers/deployWorker.ts");
const tsxCli = path.join(projectRoot, "node_modules/tsx/dist/cli.mjs");

const child = spawn(process.execPath, [tsxCli, workerEntry], {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error("Failed to start deploy worker:", error);
  process.exit(1);
});

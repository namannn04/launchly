import { spawn } from "node:child_process";
import net from "node:net";

import type { DeploymentRuntime } from "@prisma/client";

import { prisma } from "../../lib/prisma";

type StartRuntimeInput = {
  projectId: string;
  sourceDir: string;
  runtime: DeploymentRuntime;
  env: Record<string, string>;
};

async function isPortAvailable(port: number) {
  return new Promise<boolean>((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, "127.0.0.1");
  });
}

async function findFreePort(start = 4100, end = 4600) {
  for (let port = start; port <= end; port += 1) {
    const available = await isPortAvailable(port);

    if (available) {
      return port;
    }
  }

  throw new Error("No free runtime port available");
}

async function waitForHealth(url: string, timeoutMs = 20_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      if (response.ok || response.status < 500) {
        return true;
      }
    } catch {
      // Runtime is still booting.
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 800);
    });
  }

  return false;
}

export async function stopRuntimeIfRunning(projectId: string) {
  const deployment = await prisma.deployment.findUnique({
    where: { projectId },
    select: {
      runtimePid: true,
    },
  });

  const pid = deployment?.runtimePid;

  if (!pid) {
    return;
  }

  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // Process already exited.
    }
  }

  await prisma.deployment.update({
    where: { projectId },
    data: {
      runtimePid: null,
      runtimePort: null,
      runtimeStatus: null,
    },
  });
}

export async function startRuntime(input: StartRuntimeInput) {
  if (input.runtime !== "nextjs" && input.runtime !== "node") {
    return null;
  }

  await stopRuntimeIfRunning(input.projectId);

  const port = await findFreePort();
  const commandArgs = ["run", "start"];
  const runtimeEnv = {
    ...process.env,
    ...input.env,
    PORT: String(port),
  };

  const child = spawn("npm", commandArgs, {
    cwd: input.sourceDir,
    stdio: "ignore",
    detached: true,
    env: runtimeEnv,
  });

  child.unref();

  const runtimeUrl = `http://127.0.0.1:${port}`;
  const healthy = await waitForHealth(runtimeUrl);

  await prisma.deployment.update({
    where: { projectId: input.projectId },
    data: {
      runtimePid: child.pid ?? null,
      runtimePort: port,
      runtimeStatus: healthy ? "healthy" : "starting",
    },
  });

  return {
    runtimeUrl,
    healthy,
    pid: child.pid ?? null,
    port,
  };
}

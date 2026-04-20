import { spawn } from "node:child_process";
import { access, copyFile, cp, mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";

import type { DeploymentRuntime } from "@prisma/client";
import simpleGit from "simple-git";

import { prisma } from "../../lib/prisma";
import { getProjectDeploymentUrl } from "../../lib/deployment/url";
import { decryptSecret } from "../../lib/security/encryption";
import { resolveProjectEnvironmentVariables } from "../../lib/security/projectEnv";
import { startRuntime, stopRuntimeIfRunning } from "./runtimeManager";
import type { DeployJobData, DeploymentStatus } from "./deployTypes";

const deploymentsRoot = path.join(process.cwd(), "backend", "deployments");

type PackageJson = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

function detectRuntimeFromPackageJson(packageJson: PackageJson | null): DeploymentRuntime {
  const scripts = packageJson?.scripts ?? {};
  const dependencies = {
    ...(packageJson?.dependencies ?? {}),
    ...(packageJson?.devDependencies ?? {}),
  };

  const startScript = scripts.start?.toLowerCase() ?? "";
  const buildScript = scripts.build?.toLowerCase() ?? "";

  const hasNext = Boolean(dependencies.next) || startScript.includes("next start") || buildScript.includes("next build");

  if (hasNext) {
    return "nextjs";
  }

  const backendDeps = [
    "express",
    "fastify",
    "koa",
    "hono",
    "@nestjs/core",
    "socket.io",
  ];

  const hasBackendDep = backendDeps.some((dep) => Boolean(dependencies[dep]));

  if (hasBackendDep) {
    return "node";
  }

  const nodeStartLike = /(\bnode\b|\btsx\b|\bts-node\b|\bnodemon\b|\bpm2\b|\bnest start\b|\bfastify\b|\bexpress\b)/;

  if (startScript && nodeStartLike.test(startScript)) {
    return "node";
  }

  return "static";
}

function timestampLog(message: string) {
  const now = new Date().toISOString();
  return `[${now}] ${message}`;
}

async function appendDeploymentLog(projectId: string, message: string) {
  const logLine = timestampLog(message);

  const current = await prisma.deployment.findUnique({
    where: { projectId },
    select: { logs: true },
  });

  const nextLogs = current?.logs ? `${current.logs}\n${logLine}` : logLine;

  await prisma.deployment.update({
    where: { projectId },
    data: {
      logs: nextLogs,
    },
  });

  console.log(logLine);
}

async function setDeploymentStatus(
  projectId: string,
  status: DeploymentStatus,
  extra?: { deploymentUrl?: string; error?: string; runtime?: DeploymentRuntime; runtimePort?: number | null; runtimePid?: number | null; runtimeStatus?: string | null },
) {
  await prisma.deployment.update({
    where: { projectId },
    data: {
      status,
      deploymentUrl: extra?.deploymentUrl,
      error: extra?.error,
      runtime: extra?.runtime,
      runtimePort: extra?.runtimePort,
      runtimePid: extra?.runtimePid,
      runtimeStatus: extra?.runtimeStatus,
    },
  });
}

function buildAuthenticatedRepoUrl(repoUrl: string, token: string) {
  const parsed = new URL(repoUrl);

  if (parsed.hostname !== "github.com") {
    return repoUrl;
  }

  return `https://x-access-token:${encodeURIComponent(token)}@github.com${parsed.pathname}`;
}

function ensureTrustedRepo(repoUrl: string) {
  const parsed = new URL(repoUrl);

  if (parsed.protocol !== "https:" || parsed.hostname !== "github.com") {
    throw new Error("Only HTTPS GitHub repositories are allowed for deployment.");
  }
}

function redactLogLine(raw: string, secrets: Record<string, string>) {
  let next = raw;

  for (const secret of Object.values(secrets)) {
    if (!secret || secret.length < 4) {
      continue;
    }

    next = next.split(secret).join("[REDACTED]");
  }

  return next;
}

async function runCommand(
  command: string,
  args: string[],
  cwd: string,
  projectId: string,
  step: string,
  injectedEnv: Record<string, string>,
) {
  await appendDeploymentLog(projectId, `Running ${step}: ${command} ${args.join(" ")}`);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        ...injectedEnv,
      },
    });

    child.stdout.on("data", (chunk) => {
      const line = redactLogLine(chunk.toString().trim(), injectedEnv);
      void appendDeploymentLog(projectId, `${step}: ${line}`);
    });

    child.stderr.on("data", (chunk) => {
      const line = redactLogLine(chunk.toString().trim(), injectedEnv);
      void appendDeploymentLog(projectId, `${step} [stderr]: ${line}`);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${step} failed with exit code ${code ?? -1}`));
    });
  });
}

async function detectBuildOutput(sourceDir: string) {
  const distDir = path.join(sourceDir, "dist");
  const buildDir = path.join(sourceDir, "build");
  const outDir = path.join(sourceDir, "out");
  const indexPath = path.join(sourceDir, "index.html");

  try {
    const distStat = await stat(distDir);
    if (distStat.isDirectory()) {
      return distDir;
    }
  } catch {
    // ignore missing dist folder
  }

  try {
    const buildStat = await stat(buildDir);
    if (buildStat.isDirectory()) {
      return buildDir;
    }
  } catch {
    // ignore missing build folder
  }

  try {
    const outStat = await stat(outDir);
    if (outStat.isDirectory()) {
      return outDir;
    }
  } catch {
    // ignore missing out folder
  }

  try {
    await access(indexPath);
    return sourceDir;
  } catch {
    // ignore missing index.html
  }

  const htmlFiles = (await readdir(sourceDir)).filter((entry) => entry.toLowerCase().endsWith(".html"));

  if (htmlFiles.length === 1) {
    return sourceDir;
  }

  throw new Error("Build output not found. Expected dist/, build/, out/, or static HTML files.");
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function deployRepository(job: DeployJobData) {
  const { projectId, repoUrl, stackUserId, environment } = job;

  ensureTrustedRepo(repoUrl);
  await setDeploymentStatus(projectId, "building");
  await appendDeploymentLog(projectId, `Deployment started for ${environment}`);

  const deploymentDir = path.join(deploymentsRoot, projectId);
  const sourceDir = path.join(deploymentDir, "source");
  const outputDir = path.join(deploymentDir, "output");

  try {
    await stopRuntimeIfRunning(projectId);

    await rm(deploymentDir, { recursive: true, force: true });
    await mkdir(sourceDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });

    const connection = await prisma.userGithubConnection.findUnique({
      where: { stackUserId },
      select: {
        githubAccessToken: true,
        githubAccessTokenIv: true,
        githubAccessTokenTag: true,
        githubAccessTokenKeyVer: true,
      },
    });

    let token = connection?.githubAccessToken;

    if (
      connection?.githubAccessToken &&
      connection.githubAccessTokenIv &&
      connection.githubAccessTokenTag &&
      connection.githubAccessTokenKeyVer
    ) {
      try {
        token = decryptSecret(
          {
            value: connection.githubAccessToken,
            iv: connection.githubAccessTokenIv,
            tag: connection.githubAccessTokenTag,
            keyVersion: connection.githubAccessTokenKeyVer,
          },
          `github:${stackUserId}`,
        );
      } catch {
        token = null;
        await appendDeploymentLog(projectId, "Warning: Could not decrypt GitHub token; using unauthenticated clone");
      }
    }

    const injectedEnv = await resolveProjectEnvironmentVariables({
      stackUserId,
      projectId,
      environment,
    });

    const cloneUrl = token ? buildAuthenticatedRepoUrl(repoUrl, token) : repoUrl;

    await appendDeploymentLog(projectId, `Cloning repository ${repoUrl}`);
    await simpleGit(sourceDir).clone(cloneUrl, sourceDir);

    const packageJsonPath = path.join(sourceDir, "package.json");
    const hasPackageJson = await fileExists(packageJsonPath);
    let runtime: DeploymentRuntime = "static";

    if (hasPackageJson) {
      let packageJson: PackageJson | null = null;

      try {
        const raw = await readFile(packageJsonPath, "utf8");
        packageJson = JSON.parse(raw) as PackageJson;
      } catch {
        packageJson = null;
      }

      runtime = detectRuntimeFromPackageJson(packageJson);
      await setDeploymentStatus(projectId, "building", { runtime });
      await appendDeploymentLog(projectId, `Detected runtime: ${runtime}`);

      await runCommand("npm", ["install"], sourceDir, projectId, "install", injectedEnv);

      if (packageJson?.scripts?.build) {
        await runCommand("npm", ["run", "build"], sourceDir, projectId, "build", injectedEnv);

        if (runtime === "static") {
          const hasNextBuildId = await fileExists(path.join(sourceDir, ".next", "BUILD_ID"));
          const hasNextDir = await fileExists(path.join(sourceDir, ".next"));

          if (hasNextBuildId || hasNextDir) {
            runtime = "nextjs";
            await setDeploymentStatus(projectId, "building", { runtime });
            await appendDeploymentLog(projectId, "Detected Next.js runtime from .next build output");
          }
        }
      } else {
        await appendDeploymentLog(projectId, "No build script found, using repository files as deploy output");
      }
    } else {
      await appendDeploymentLog(projectId, "No package.json found, treating repository as static files");
    }

    if (runtime === "static") {
      const buildOutputDir = await detectBuildOutput(sourceDir);
      await appendDeploymentLog(projectId, `Detected build output: ${buildOutputDir}`);

      await rm(outputDir, { recursive: true, force: true });
      await cp(buildOutputDir, outputDir, { recursive: true });

      const indexPath = path.join(outputDir, "index.html");
      const hasIndex = await fileExists(indexPath);

      if (!hasIndex) {
        const htmlFiles = (await readdir(outputDir)).filter((entry) => entry.toLowerCase().endsWith(".html"));

        if (htmlFiles.length === 1) {
          await copyFile(path.join(outputDir, htmlFiles[0]), indexPath);
        }
      }

      await access(indexPath);
    } else {
      await appendDeploymentLog(projectId, "Skipping static artifact checks for backend runtime deployment");
    }

    const deploymentUrl = getProjectDeploymentUrl(projectId);
    let runtimePort: number | null = null;
    let runtimePid: number | null = null;
    let runtimeStatus: string | null = null;

    if (runtime === "nextjs" || runtime === "node") {
      const startedRuntime = await startRuntime({
        projectId,
        sourceDir,
        runtime,
        env: injectedEnv,
      });

      if (startedRuntime) {
        runtimePort = startedRuntime.port;
        runtimePid = startedRuntime.pid;
        runtimeStatus = startedRuntime.healthy ? "healthy" : "starting";
        await appendDeploymentLog(projectId, `Runtime started on port ${startedRuntime.port} (${runtimeStatus})`);
      }
    } else {
      await stopRuntimeIfRunning(projectId);
    }

    await setDeploymentStatus(projectId, "success", { deploymentUrl, runtimePort, runtimePid, runtimeStatus });
    await appendDeploymentLog(projectId, `Deployment success. URL: ${deploymentUrl}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown deployment error";
    await setDeploymentStatus(projectId, "failed", { error: message });
    await appendDeploymentLog(projectId, `Deployment failed: ${message}`);
    throw error;
  }
}

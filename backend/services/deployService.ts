import { spawn } from "node:child_process";
import { access, copyFile, cp, mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";

import simpleGit from "simple-git";

import { prisma } from "../../lib/prisma";
import type { DeployJobData, DeploymentStatus } from "./deployTypes";

const deploymentsRoot = path.join(process.cwd(), "backend", "deployments");

type PackageJson = {
  scripts?: Record<string, string>;
};

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

async function setDeploymentStatus(projectId: string, status: DeploymentStatus, extra?: { deploymentUrl?: string; error?: string }) {
  await prisma.deployment.update({
    where: { projectId },
    data: {
      status,
      deploymentUrl: extra?.deploymentUrl,
      error: extra?.error,
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

async function runCommand(command: string, args: string[], cwd: string, projectId: string, step: string) {
  await appendDeploymentLog(projectId, `Running ${step}: ${command} ${args.join(" ")}`);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    child.stdout.on("data", (chunk) => {
      void appendDeploymentLog(projectId, `${step}: ${chunk.toString().trim()}`);
    });

    child.stderr.on("data", (chunk) => {
      void appendDeploymentLog(projectId, `${step} [stderr]: ${chunk.toString().trim()}`);
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
  const { projectId, repoUrl, stackUserId } = job;

  ensureTrustedRepo(repoUrl);
  await setDeploymentStatus(projectId, "building");
  await appendDeploymentLog(projectId, "Deployment started");

  const deploymentDir = path.join(deploymentsRoot, projectId);
  const sourceDir = path.join(deploymentDir, "source");
  const outputDir = path.join(deploymentDir, "output");

  try {
    await rm(deploymentDir, { recursive: true, force: true });
    await mkdir(sourceDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });

    const connection = await prisma.userGithubConnection.findUnique({
      where: { stackUserId },
      select: {
        githubAccessToken: true,
      },
    });
    const token = connection?.githubAccessToken;
    const cloneUrl = token ? buildAuthenticatedRepoUrl(repoUrl, token) : repoUrl;

    await appendDeploymentLog(projectId, `Cloning repository ${repoUrl}`);
    await simpleGit(sourceDir).clone(cloneUrl, sourceDir);

    const packageJsonPath = path.join(sourceDir, "package.json");
    const hasPackageJson = await fileExists(packageJsonPath);

    if (hasPackageJson) {
      await runCommand("npm", ["install"], sourceDir, projectId, "install");

      let packageJson: PackageJson | null = null;

      try {
        const raw = await readFile(packageJsonPath, "utf8");
        packageJson = JSON.parse(raw) as PackageJson;
      } catch {
        packageJson = null;
      }

      if (packageJson?.scripts?.build) {
        await runCommand("npm", ["run", "build"], sourceDir, projectId, "build");
      } else {
        await appendDeploymentLog(projectId, "No build script found, using repository files as deploy output");
      }
    } else {
      await appendDeploymentLog(projectId, "No package.json found, treating repository as static files");
    }

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

    const appPort = process.env.APP_URL_PORT ?? "3000";
    const deploymentUrl = `http://localhost:${appPort}/project/${projectId}/`;

    await setDeploymentStatus(projectId, "success", { deploymentUrl });
    await appendDeploymentLog(projectId, `Deployment success. URL: ${deploymentUrl}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown deployment error";
    await setDeploymentStatus(projectId, "failed", { error: message });
    await appendDeploymentLog(projectId, `Deployment failed: ${message}`);
    throw error;
  }
}

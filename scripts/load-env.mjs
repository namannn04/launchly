import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function parseEnvContent(content) {
  const parsed = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

export function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  return parseEnvContent(readFileSync(filePath, "utf8"));
}

export function getEnvFilePaths() {
  const explicitFile = process.env.DEPLOY_ENV_FILE?.trim();

  if (explicitFile) {
    return [path.isAbsolute(explicitFile) ? explicitFile : path.join(projectRoot, explicitFile)];
  }

  return [path.join(projectRoot, ".env.local"), path.join(projectRoot, ".env")];
}

export function loadMergedEnv() {
  const merged = {};

  for (const filePath of getEnvFilePaths()) {
    Object.assign(merged, loadEnvFile(filePath));
  }

  return merged;
}

export function applyEnvFilesToProcess() {
  const merged = loadMergedEnv();

  for (const [key, value] of Object.entries(merged)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return merged;
}

import { existsSync, readFileSync } from "node:fs";

const requiredKeys = [
  "DATABASE_URL",
  "REDIS_URL",
  "NEXT_PUBLIC_STACK_PROJECT_ID",
  "NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY",
  "STACK_SECRET_SERVER_KEY",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "DEPLOYMENT_BASE_DOMAIN",
  "DEPLOYMENT_URL_SCHEME",
  "APP_URL_PORT",
];

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, "utf8");
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

const fileEnv = loadEnvFile(".env.local");
const hasEncryptionKey = Boolean(process.env.DEPLOY_ENCRYPTION_KEYS || fileEnv.DEPLOY_ENCRYPTION_KEYS);
const hasEncryptionFallback = Boolean(process.env.DEPLOY_ENCRYPTION_KEY || fileEnv.DEPLOY_ENCRYPTION_KEY);
const missingKeys = requiredKeys.filter((key) => !(process.env[key] || fileEnv[key]));

if (!hasEncryptionKey && !hasEncryptionFallback) {
  missingKeys.push("DEPLOY_ENCRYPTION_KEYS or DEPLOY_ENCRYPTION_KEY");
}

if (missingKeys.length > 0) {
  console.error("Missing required environment variables:\n");

  for (const key of missingKeys) {
    console.error(`- ${key}`);
  }

  console.error("\nCopy .env.example to .env.local and fill the missing values.");
  process.exit(1);
}

console.log("Environment looks ready.");

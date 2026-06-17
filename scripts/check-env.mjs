import { applyEnvFilesToProcess, loadMergedEnv } from "./load-env.mjs";

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

applyEnvFilesToProcess();

const fileEnv = loadMergedEnv();
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

  console.error("\nCopy env.example to .env.local (or set DEPLOY_ENV_FILE) and fill the missing values.");
  process.exit(1);
}

console.log("Environment looks ready.");

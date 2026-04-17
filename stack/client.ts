import { StackClientApp } from "@stackframe/stack";

import { stackUrls } from "@/stack/config";

function requiredEnv(name: "NEXT_PUBLIC_STACK_PROJECT_ID" | "NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const projectId = requiredEnv("NEXT_PUBLIC_STACK_PROJECT_ID");
const publishableClientKey = requiredEnv("NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY");

export const stackClientApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  projectId,
  publishableClientKey,
  urls: stackUrls,
});

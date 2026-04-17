import "server-only";

import { StackServerApp } from "@stackframe/stack";

import { stackUrls } from "@/stack/config";

function requiredEnv(
  name:
    | "NEXT_PUBLIC_STACK_PROJECT_ID"
    | "NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY"
    | "STACK_SECRET_SERVER_KEY",
) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const projectId = requiredEnv("NEXT_PUBLIC_STACK_PROJECT_ID");
const publishableClientKey = requiredEnv("NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY");
const secretServerKey = requiredEnv("STACK_SECRET_SERVER_KEY");

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  projectId,
  publishableClientKey,
  secretServerKey,
  urls: stackUrls,
});

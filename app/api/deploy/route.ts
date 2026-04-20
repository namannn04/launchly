import { NextResponse } from "next/server";
import type { DeploymentEnvironment } from "@prisma/client";

import { addDeployJob } from "@/backend/queues/deployQueue";
import { listGitHubRepositories, syncStackUserIdentity } from "@/lib/github-connection/server";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/security/audit";
import { upsertProjectEnvironmentVariables } from "@/lib/security/projectEnv";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { stackServerApp } from "@/stack/server";

type DeployRequestBody = {
  repoUrl?: string;
  projectId?: string;
  environment?: string;
  envVariables?: Array<{
    key?: string;
    value?: string;
  }>;
};

const allowedEnvironments: DeploymentEnvironment[] = ["development", "preview", "production"];

function parseEnvironment(value?: string): DeploymentEnvironment {
  const normalized = value?.toLowerCase() as DeploymentEnvironment | undefined;

  if (normalized && allowedEnvironments.includes(normalized)) {
    return normalized;
  }

  return "production";
}

function sanitizeProjectId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
}

export async function POST(request: Request) {
  const user = await stackServerApp.getUser({ tokenStore: request, or: "return-null" });

  if (!user || user.isAnonymous) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = await enforceRateLimit({
    key: `deploy:${user.id}`,
    limit: 15,
    windowSeconds: 60,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many deploy requests. Please retry shortly." },
      {
        status: 429,
        headers: {
          "retry-after": String(rate.retryAfterSeconds),
        },
      },
    );
  }

  const body = (await request.json()) as DeployRequestBody;

  if (!body.repoUrl || !body.projectId) {
    return NextResponse.json({ error: "repoUrl and projectId are required" }, { status: 400 });
  }

  const repoUrlInput = body.repoUrl;

  let repoUrl: URL;

  try {
    repoUrl = new URL(repoUrlInput);
  } catch {
    return NextResponse.json({ error: "Invalid repoUrl" }, { status: 400 });
  }

  if (repoUrl.protocol !== "https:" || repoUrl.hostname !== "github.com") {
    return NextResponse.json({ error: "Only HTTPS GitHub repositories are allowed" }, { status: 400 });
  }

  const allowedRepositories = await listGitHubRepositories(user.id);
  const trusted = allowedRepositories.some((repository) => {
    const candidates = [repository.htmlUrl, `${repository.htmlUrl}.git`];
    return candidates.includes(repoUrlInput);
  });

  if (!trusted) {
    return NextResponse.json({ error: "Repository is not trusted for this account" }, { status: 403 });
  }

  const projectId = sanitizeProjectId(body.projectId);
  const environment = parseEnvironment(body.environment);

  if (!projectId) {
    return NextResponse.json({ error: "Invalid projectId" }, { status: 400 });
  }

  await syncStackUserIdentity({
    id: user.id,
    displayName: user.displayName,
    primaryEmail: user.primaryEmail,
    profileImageUrl: user.profileImageUrl,
  });

  const envVariables = (body.envVariables ?? []).map((entry) => ({
    key: entry.key ?? "",
    value: entry.value ?? "",
  }));

  try {
    await upsertProjectEnvironmentVariables({
      stackUserId: user.id,
      projectId,
      environment,
      entries: envVariables,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid environment variables";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await prisma.deployment.upsert({
    where: { projectId },
    update: {
      stackUserId: user.id,
      repoUrl: repoUrlInput,
      status: "queued",
      environment,
      runtime: "unknown",
      deploymentUrl: null,
      logs: "",
      error: null,
    },
    create: {
      projectId,
      stackUserId: user.id,
      repoUrl: repoUrlInput,
      status: "queued",
      environment,
      logs: "",
    },
  });

  await addDeployJob({
    projectId,
    repoUrl: repoUrlInput,
    stackUserId: user.id,
    environment,
  });

  await writeAuditLog({
    stackUserId: user.id,
    action: "deploy.queued",
    resourceType: "deployment",
    resourceId: projectId,
    metadata: {
      environment,
      repoUrl: repoUrlInput,
      envCount: envVariables.length,
    },
  });

  return NextResponse.json({
    status: "queued",
    projectId,
    environment,
  });
}

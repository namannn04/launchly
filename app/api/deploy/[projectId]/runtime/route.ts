import path from "node:path";

import type { DeploymentEnvironment } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/security/audit";
import { resolveProjectEnvironmentVariables } from "@/lib/security/projectEnv";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { stackServerApp } from "@/stack/server";
import { startRuntime, stopRuntimeIfRunning } from "@/backend/services/runtimeManager";

type RuntimeActionRequest = {
  action?: "restart";
  environment?: "development" | "preview" | "production";
};

const allowedEnvironments: DeploymentEnvironment[] = ["development", "preview", "production"];

function parseEnvironment(value?: string): DeploymentEnvironment {
  const normalized = value?.toLowerCase() as DeploymentEnvironment | undefined;

  if (normalized && allowedEnvironments.includes(normalized)) {
    return normalized;
  }

  return "production";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const user = await stackServerApp.getUser({ tokenStore: request, or: "return-null" });

  if (!user || user.isAnonymous) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = await enforceRateLimit({
    key: `deploy-runtime:${user.id}`,
    limit: 10,
    windowSeconds: 60,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many runtime actions. Please retry shortly." },
      {
        status: 429,
        headers: {
          "retry-after": String(rate.retryAfterSeconds),
        },
      },
    );
  }

  const { projectId } = await params;
  const body = (await request.json().catch(() => ({}))) as RuntimeActionRequest;
  const environment = parseEnvironment(body.environment);

  if (body.action !== "restart") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  const deployment = await prisma.deployment.findFirst({
    where: {
      projectId,
      stackUserId: user.id,
    },
    select: {
      projectId: true,
      runtime: true,
      environment: true,
    },
  });

  if (!deployment) {
    return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
  }

  if (deployment.runtime !== "nextjs" && deployment.runtime !== "node") {
    return NextResponse.json({ error: "Runtime restart is only available for backend deployments" }, { status: 400 });
  }

  const sourceDir = path.join(process.cwd(), "backend", "deployments", deployment.projectId, "source");

  const env = await resolveProjectEnvironmentVariables({
    stackUserId: user.id,
    projectId: deployment.projectId,
    environment: deployment.environment ?? environment,
  });

  await stopRuntimeIfRunning(deployment.projectId);

  const started = await startRuntime({
    projectId: deployment.projectId,
    sourceDir,
    runtime: deployment.runtime,
    env,
  });

  await writeAuditLog({
    stackUserId: user.id,
    action: "deploy.runtime.restarted",
    resourceType: "deployment",
    resourceId: deployment.projectId,
    metadata: {
      runtime: deployment.runtime,
      runtimePort: started?.port ?? null,
    },
  });

  return NextResponse.json({
    success: true,
    runtime: deployment.runtime,
    runtimeUrl: started?.runtimeUrl ?? null,
    runtimeStatus: started?.healthy ? "healthy" : "starting",
    runtimePort: started?.port ?? null,
  });
}

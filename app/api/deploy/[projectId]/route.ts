import { rm } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { stopRuntimeIfRunning } from "@/backend/services/runtimeManager";
import { getProjectDeploymentUrl } from "@/lib/deployment/url";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/security/audit";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { stackServerApp } from "@/stack/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const user = await stackServerApp.getUser({ tokenStore: request, or: "return-null" });

  if (!user || user.isAnonymous) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const deployment = await prisma.deployment.findFirst({
    where: {
      projectId,
      stackUserId: user.id,
    },
    select: {
      projectId: true,
      repoUrl: true,
      status: true,
      environment: true,
      runtime: true,
      runtimePort: true,
      runtimeStatus: true,
      deploymentUrl: true,
      logs: true,
      error: true,
      updatedAt: true,
    },
  });

  if (!deployment) {
    return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...deployment,
    deploymentUrl: getProjectDeploymentUrl(deployment.projectId),
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const user = await stackServerApp.getUser({ tokenStore: request, or: "return-null" });

  if (!user || user.isAnonymous) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = await enforceRateLimit({
    key: `deploy-delete:${user.id}`,
    limit: 8,
    windowSeconds: 60,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many delete requests. Please retry shortly." },
      {
        status: 429,
        headers: {
          "retry-after": String(rate.retryAfterSeconds),
        },
      },
    );
  }

  const { projectId } = await params;

  const deployment = await prisma.deployment.findFirst({
    where: {
      projectId,
      stackUserId: user.id,
    },
    select: {
      projectId: true,
    },
  });

  if (!deployment) {
    return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
  }

  await stopRuntimeIfRunning(deployment.projectId);

  await prisma.deployment.delete({
    where: {
      projectId: deployment.projectId,
    },
  });

  const deploymentRoot = path.join(process.cwd(), "backend", "deployments", deployment.projectId);
  await rm(deploymentRoot, { recursive: true, force: true });

  await writeAuditLog({
    stackUserId: user.id,
    action: "deploy.deleted",
    resourceType: "deployment",
    resourceId: deployment.projectId,
  });

  return NextResponse.json({ success: true });
}

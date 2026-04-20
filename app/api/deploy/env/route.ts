import type { DeploymentEnvironment } from "@prisma/client";
import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/security/audit";
import { listProjectEnvironmentVariables } from "@/lib/security/projectEnv";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { stackServerApp } from "@/stack/server";

const allowedEnvironments: DeploymentEnvironment[] = ["development", "preview", "production"];

function parseEnvironment(value: string | null): DeploymentEnvironment {
  const normalized = value?.toLowerCase() as DeploymentEnvironment | undefined;

  if (normalized && allowedEnvironments.includes(normalized)) {
    return normalized;
  }

  return "production";
}

export async function GET(request: Request) {
  const user = await stackServerApp.getUser({ tokenStore: request, or: "return-null" });

  if (!user || user.isAnonymous) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = await enforceRateLimit({
    key: `deploy-env-list:${user.id}`,
    limit: 40,
    windowSeconds: 60,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests." },
      {
        status: 429,
        headers: {
          "retry-after": String(rate.retryAfterSeconds),
        },
      },
    );
  }

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId")?.trim();
  const environment = parseEnvironment(url.searchParams.get("environment"));

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const keys = await listProjectEnvironmentVariables({
    stackUserId: user.id,
    projectId,
    environment,
  });

  await writeAuditLog({
    stackUserId: user.id,
    action: "deploy.env.keys.read",
    resourceType: "project-env",
    resourceId: projectId,
    metadata: {
      environment,
      keyCount: keys.length,
    },
  });

  return NextResponse.json({
    projectId,
    environment,
    keys,
  });
}

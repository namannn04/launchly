import type { DeploymentEnvironment } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/security/audit";
import { decryptSecret } from "@/lib/security/encryption";
import { consumeSensitiveActionToken } from "@/lib/security/reauth";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { stackServerApp } from "@/stack/server";

type RevealRequest = {
  projectId?: string;
  key?: string;
  environment?: string;
};

const allowedEnvironments: DeploymentEnvironment[] = ["development", "preview", "production"];

function parseEnvironment(value?: string): DeploymentEnvironment {
  const normalized = value?.toLowerCase() as DeploymentEnvironment | undefined;

  if (normalized && allowedEnvironments.includes(normalized)) {
    return normalized;
  }

  return "production";
}

export async function POST(request: Request) {
  const user = await stackServerApp.getUser({ tokenStore: request, or: "return-null" });

  if (!user || user.isAnonymous) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = await enforceRateLimit({
    key: `deploy-env-reveal:${user.id}`,
    limit: 10,
    windowSeconds: 60,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many reveal attempts. Please retry shortly." },
      {
        status: 429,
        headers: {
          "retry-after": String(rate.retryAfterSeconds),
        },
      },
    );
  }

  const cookies = request.headers.get("cookie") ?? "";
  const reauthToken = cookies
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("launchly_sensitive_action="))
    ?.split("=")[1] ?? null;

  const reauthed = await consumeSensitiveActionToken({
    stackUserId: user.id,
    token: reauthToken ? decodeURIComponent(reauthToken) : null,
  });

  if (!reauthed) {
    return NextResponse.json({ error: "Re-authentication required" }, { status: 401 });
  }

  const body = (await request.json()) as RevealRequest;
  const projectId = body.projectId?.trim();
  const key = body.key?.trim().toUpperCase();
  const environment = parseEnvironment(body.environment);

  if (!projectId || !key) {
    return NextResponse.json({ error: "projectId and key are required" }, { status: 400 });
  }

  const entry = await prisma.projectEnvironmentVariable.findFirst({
    where: {
      stackUserId: user.id,
      projectId,
      environment,
      key,
    },
    select: {
      value: true,
      valueIv: true,
      valueTag: true,
      keyVersion: true,
    },
  });

  if (!entry) {
    return NextResponse.json({ error: "Environment variable not found" }, { status: 404 });
  }

  let value: string;

  try {
    value = decryptSecret(
      {
        value: entry.value,
        iv: entry.valueIv,
        tag: entry.valueTag,
        keyVersion: entry.keyVersion,
      },
      `${projectId}:${environment}:${key}`,
    );
  } catch {
    return NextResponse.json({ error: "Unable to decrypt environment variable" }, { status: 500 });
  }

  const response = NextResponse.json({
    projectId,
    environment,
    key,
    value,
  });

  response.cookies.delete("launchly_sensitive_action");

  await writeAuditLog({
    stackUserId: user.id,
    action: "deploy.env.value.revealed",
    resourceType: "project-env",
    resourceId: projectId,
    metadata: {
      environment,
      key,
    },
  });

  return response;
}

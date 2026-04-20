import type { DeploymentEnvironment } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/security/encryption";

type EnvInput = {
  key: string;
  value: string;
};

function aadFor(projectId: string, environment: DeploymentEnvironment, key: string) {
  return `${projectId}:${environment}:${key}`;
}

function normalizeKey(value: string) {
  return value.trim();
}

export function sanitizeEnvInputs(inputs: EnvInput[]) {
  const deduped = new Map<string, string>();

  for (const entry of inputs) {
    const key = normalizeKey(entry.key);

    if (!key) {
      continue;
    }

    if (!/^[A-Za-z_][A-Za-z0-9_./:-]*$/.test(key)) {
      throw new Error(`Invalid env key: ${entry.key}`);
    }

    if (entry.value.length > 4000) {
      throw new Error(`Env value for ${key} exceeds 4000 characters`);
    }

    deduped.set(key, entry.value);
  }

  if (deduped.size > 100) {
    throw new Error("Too many environment variables. Maximum 100 allowed.");
  }

  return [...deduped.entries()].map(([key, value]) => ({ key, value }));
}

export async function upsertProjectEnvironmentVariables(params: {
  stackUserId: string;
  projectId: string;
  environment: DeploymentEnvironment;
  entries: EnvInput[];
}) {
  const normalized = sanitizeEnvInputs(params.entries);

  await prisma.$transaction(async (tx) => {
    await tx.projectEnvironmentVariable.deleteMany({
      where: {
        stackUserId: params.stackUserId,
        projectId: params.projectId,
        environment: params.environment,
      },
    });

    if (normalized.length === 0) {
      return;
    }

    await tx.projectEnvironmentVariable.createMany({
      data: normalized.map((entry) => {
        const encrypted = encryptSecret(entry.value, aadFor(params.projectId, params.environment, entry.key));

        return {
          stackUserId: params.stackUserId,
          projectId: params.projectId,
          environment: params.environment,
          key: entry.key,
          value: encrypted.value,
          valueIv: encrypted.iv,
          valueTag: encrypted.tag,
          keyVersion: encrypted.keyVersion,
        };
      }),
    });
  });
}

export async function listProjectEnvironmentVariables(params: {
  stackUserId: string;
  projectId: string;
  environment: DeploymentEnvironment;
}) {
  const rows = await prisma.projectEnvironmentVariable.findMany({
    where: {
      stackUserId: params.stackUserId,
      projectId: params.projectId,
      environment: params.environment,
    },
    orderBy: {
      key: "asc",
    },
    select: {
      key: true,
    },
  });

  return rows.map((row) => row.key);
}

export async function resolveProjectEnvironmentVariables(params: {
  stackUserId: string;
  projectId: string;
  environment: DeploymentEnvironment;
}) {
  const rows = await prisma.projectEnvironmentVariable.findMany({
    where: {
      stackUserId: params.stackUserId,
      projectId: params.projectId,
      environment: params.environment,
    },
    select: {
      key: true,
      value: true,
      valueIv: true,
      valueTag: true,
      keyVersion: true,
    },
  });

  const env: Record<string, string> = {};

  for (const row of rows) {
    env[row.key] = decryptSecret(
      {
        value: row.value,
        iv: row.valueIv,
        tag: row.valueTag,
        keyVersion: row.keyVersion,
      },
      aadFor(params.projectId, params.environment, row.key),
    );
  }

  return env;
}

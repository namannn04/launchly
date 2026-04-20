import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";

const REAUTH_TTL_SECONDS = 5 * 60;

function hashToken(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export async function issueSensitiveActionToken(stackUserId: string) {
  const token = randomUUID();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + REAUTH_TTL_SECONDS * 1000);

  await prisma.sensitiveActionToken.create({
    data: {
      stackUserId,
      tokenHash,
      expiresAt,
    },
  });

  return {
    token,
    expiresAt,
    maxAgeSeconds: REAUTH_TTL_SECONDS,
  };
}

export async function consumeSensitiveActionToken(params: {
  stackUserId: string;
  token: string | null;
}) {
  if (!params.token) {
    return false;
  }

  const tokenHash = hashToken(params.token);
  const now = new Date();

  const result = await prisma.sensitiveActionToken.updateMany({
    where: {
      stackUserId: params.stackUserId,
      tokenHash,
      consumedAt: null,
      expiresAt: {
        gt: now,
      },
    },
    data: {
      consumedAt: now,
    },
  });

  return result.count === 1;
}

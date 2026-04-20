import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type AuditInput = {
  stackUserId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
};

export async function writeAuditLog(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        stackUserId: input.stackUserId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        metadata: input.metadata,
      },
    });
  } catch {
    // Avoid blocking critical user actions if audit logging fails.
  }
}

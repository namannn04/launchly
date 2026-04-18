import "server-only";

import { prisma } from "@/lib/prisma";

export async function listDeploymentsByStackUserId(stackUserId: string) {
  return prisma.deployment.findMany({
    where: { stackUserId },
    orderBy: { updatedAt: "desc" },
    select: {
      projectId: true,
      repoUrl: true,
      status: true,
      updatedAt: true,
    },
  });
}

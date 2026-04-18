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
      deploymentUrl: true,
      error: true,
      updatedAt: true,
    },
  });
}

export async function getDeploymentByProjectIdForStackUser(stackUserId: string, projectId: string) {
  return prisma.deployment.findFirst({
    where: {
      stackUserId,
      projectId,
    },
    select: {
      projectId: true,
      repoUrl: true,
      status: true,
      deploymentUrl: true,
      logs: true,
      error: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

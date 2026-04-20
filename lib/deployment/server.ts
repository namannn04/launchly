import "server-only";

import { prisma } from "@/lib/prisma";
import { getProjectDeploymentUrl } from "@/lib/deployment/url";

export async function listDeploymentsByStackUserId(stackUserId: string) {
  const deployments = await prisma.deployment.findMany({
    where: { stackUserId },
    orderBy: { updatedAt: "desc" },
    select: {
      projectId: true,
      repoUrl: true,
      status: true,
      environment: true,
      runtime: true,
      runtimePort: true,
      runtimeStatus: true,
      deploymentUrl: true,
      error: true,
      updatedAt: true,
    },
  });

  return deployments.map((deployment) => ({
    ...deployment,
    deploymentUrl: getProjectDeploymentUrl(deployment.projectId),
  }));
}

export async function getDeploymentByProjectIdForStackUser(stackUserId: string, projectId: string) {
  const deployment = await prisma.deployment.findFirst({
    where: {
      stackUserId,
      projectId,
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
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!deployment) {
    return null;
  }

  return {
    ...deployment,
    deploymentUrl: getProjectDeploymentUrl(deployment.projectId),
  };
}

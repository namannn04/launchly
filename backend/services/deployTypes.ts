import type { DeploymentEnvironment } from "@prisma/client";

export type DeploymentStatus = "queued" | "building" | "success" | "failed";

export type DeployJobData = {
  projectId: string;
  repoUrl: string;
  stackUserId: string;
  environment: DeploymentEnvironment;
};

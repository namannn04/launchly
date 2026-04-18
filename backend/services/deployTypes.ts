export type DeploymentStatus = "queued" | "building" | "success" | "failed";

export type DeployJobData = {
  projectId: string;
  repoUrl: string;
  stackUserId: string;
};

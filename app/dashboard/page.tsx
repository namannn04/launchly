import { redirect } from "next/navigation";
import DashboardPage, { type DashboardProject } from "@/components/dashboard/components/DashboardPage";

import { getProjectDeploymentUrl } from "@/lib/deployment/url";
import { listDeploymentsByStackUserId } from "@/lib/deployment/server";
import { getGitHubConnectionStatus } from "@/lib/github-connection/server";
import { stackServerApp } from "@/stack/server";

type DeploymentListItem = Awaited<ReturnType<typeof listDeploymentsByStackUserId>>[number];

export default async function DashboardRoutePage() {
  const user = await stackServerApp.getUser({ or: "return-null" });

  if (!user || user.isAnonymous) {
    redirect("/");
  }

  const github = await getGitHubConnectionStatus(user.id);

  if (!github.githubConnected) {
    redirect("/");
  }

  const deployments = await listDeploymentsByStackUserId(user.id);

  const projects: DashboardProject[] = deployments.map((deployment: DeploymentListItem) => ({
    id: deployment.projectId,
    name: deployment.repoUrl.split("/").pop()?.replace(/\.git$/, "") ?? deployment.projectId,
    repoUrl: deployment.repoUrl,
    deploymentUrl: getProjectDeploymentUrl(deployment.projectId),
    error: deployment.error,
    status:
      deployment.status === "success"
        ? "Ready"
        : deployment.status === "building" || deployment.status === "queued"
          ? "Building"
          : "Failed",
    lastDeployedAt: deployment.updatedAt.toLocaleString(),
  }));

  return <DashboardPage githubUsername={github.githubUsername} githubAvatar={github.githubAvatar} projects={projects} />;
}

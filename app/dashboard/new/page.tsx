import { redirect } from "next/navigation";

import NewProjectFlowPage from "@/components/importProject/components/NewProjectFlowPage";
import { getGitHubConnectionStatus } from "@/lib/github-connection/server";
import { stackServerApp } from "@/stack/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readString(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function DashboardNewProjectPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await stackServerApp.getUser({ or: "return-null" });

  if (!user || user.isAnonymous) {
    redirect("/");
  }

  const github = await getGitHubConnectionStatus(user.id);

  if (!github.githubConnected) {
    redirect("/");
  }

  const params = await searchParams;

  const repoUrl = readString(params.repoUrl);
  const fullName = readString(params.fullName);
  const repoName = readString(params.repoName);
  const defaultBranch = readString(params.defaultBranch) || "main";
  const owner = readString(params.owner);

  if (!repoUrl || !fullName || !repoName) {
    redirect("/dashboard/import");
  }

  return (
    <NewProjectFlowPage
      githubUsername={github.githubUsername}
      githubAvatar={github.githubAvatar}
      repoUrl={repoUrl}
      fullName={fullName}
      repoName={repoName}
      defaultBranch={defaultBranch}
      owner={owner}
    />
  );
}

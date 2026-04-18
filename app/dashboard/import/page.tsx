import { redirect } from "next/navigation";

import ImportProjectPage from "@/components/importProject/components/ImportProjectPage";
import { getGitHubConnectionStatus } from "@/lib/github-connection/server";
import { stackServerApp } from "@/stack/server";

export default async function DashboardImportPage() {
  const user = await stackServerApp.getUser({ or: "return-null" });

  if (!user || user.isAnonymous) {
    redirect("/");
  }

  const github = await getGitHubConnectionStatus(user.id);

  if (!github.githubConnected) {
    redirect("/");
  }

  return <ImportProjectPage githubUsername={github.githubUsername} githubAvatar={github.githubAvatar} />;
}

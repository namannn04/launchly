import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import ProjectDashboardActions from "@/components/dashboard/components/ProjectDashboardActions";
import ThemeToggle from "@/components/landingPage/components/ThemeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDeploymentByProjectIdForStackUser, listDeploymentsByStackUserId } from "@/lib/deployment/server";
import { getGitHubConnectionStatus } from "@/lib/github-connection/server";
import { stackServerApp } from "@/stack/server";

type DeploymentListItem = Awaited<ReturnType<typeof listDeploymentsByStackUserId>>[number];

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await stackServerApp.getUser({ or: "return-null" });

  if (!user || user.isAnonymous) {
    redirect("/");
  }

  const github = await getGitHubConnectionStatus(user.id);

  if (!github.githubConnected) {
    redirect("/");
  }

  const { projectId } = await params;

  const [deployment, deployments] = await Promise.all([
    getDeploymentByProjectIdForStackUser(user.id, projectId),
    listDeploymentsByStackUserId(user.id),
  ]);

  if (!deployment) {
    redirect("/dashboard");
  }

  const projectName = deployment.repoUrl.split("/").pop()?.replace(/\.git$/, "") ?? deployment.projectId;
  const deploymentPath = `/project/${deployment.projectId}/`;
  const permanentUrl = deployment.deploymentUrl ?? deploymentPath;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="flex flex-col border-b border-border/60 bg-card/55 px-4 py-6 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground">L</span>
            Launchly
          </Link>

          <nav className="mt-8 space-y-2">
            <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Link>

            {deployments.map((item: DeploymentListItem) => (
              <Link
                key={item.projectId}
                href={`/dashboard/project/${item.projectId}`}
                className={
                  item.projectId === projectId
                    ? "block truncate rounded-xl border border-border/70 bg-background/80 px-3 py-2.5 text-sm font-semibold"
                    : "block truncate rounded-xl px-3 py-2.5 text-sm text-muted-foreground"
                }
              >
                {item.repoUrl.split("/").pop()?.replace(/\.git$/, "") ?? item.projectId}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="flex h-screen min-h-0 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 px-4 py-4 backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Project Dashboard</p>
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{projectName}</h1>
              </div>

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <ProjectDashboardActions
                  projectId={deployment.projectId}
                  projectName={projectName}
                  repoUrl={deployment.repoUrl}
                  deploymentUrl={deploymentPath}
                />
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>Production Deployment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                    <div className="overflow-hidden rounded-xl border border-border/70 bg-black/70">
                      <iframe
                        title={`${projectName} preview`}
                        src={deploymentPath}
                        className="h-77.5 w-full bg-white"
                        loading="lazy"
                      />
                    </div>

                    <div className="space-y-3 text-sm">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Deployment</p>
                      <a
                        href={deploymentPath}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-base font-semibold underline-offset-4 hover:underline"
                      >
                        {permanentUrl}
                      </a>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Status</p>
                          <p className="mt-1 font-medium">{deployment.status}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Updated</p>
                          <p className="mt-1 font-medium">{deployment.updatedAt.toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Source</p>
                        <a
                          href={deployment.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block break-all text-muted-foreground underline-offset-4 hover:underline"
                        >
                          {deployment.repoUrl}
                        </a>
                      </div>

                      {deployment.error ? <p className="pt-2 text-red-500">Error: {deployment.error}</p> : null}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card id="build-logs">
                <CardHeader>
                  <CardTitle>Build Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="max-h-105 overflow-auto whitespace-pre-wrap rounded-lg border border-border/70 bg-background/60 p-3 text-xs leading-relaxed">
                    {deployment.logs || "No logs yet."}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </main>
        </section>
      </div>
    </div>
  );
}

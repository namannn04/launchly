import { redirect } from "next/navigation";
import Image from "next/image";

import { getGitHubConnectionStatus } from "@/lib/github-connection/server";
import { stackServerApp } from "@/stack/server";

export default async function DashboardPage() {
  const user = await stackServerApp.getUser({ or: "return-null" });

  if (!user || user.isAnonymous) {
    redirect("/");
  }

  const github = await getGitHubConnectionStatus(user.id);

  if (!github.githubConnected) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-background px-4 py-16 text-foreground sm:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <section className="rounded-2xl border border-border/70 bg-card/75 p-6 backdrop-blur sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Launchly Dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Ready to import your repositories</h1>
          <p className="mt-3 text-muted-foreground">
            Connected to GitHub as <span className="font-semibold text-foreground">{github.githubUsername ?? "unknown"}</span>.
          </p>

          <div className="mt-6 flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 p-3 sm:max-w-sm">
            {github.githubAvatar ? (
              <Image
                src={github.githubAvatar}
                alt={github.githubUsername ?? "GitHub avatar"}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-muted" />
            )}
            <div>
              <p className="text-xs text-muted-foreground">GitHub Account</p>
              <p className="font-medium">{github.githubUsername ?? "Connected"}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

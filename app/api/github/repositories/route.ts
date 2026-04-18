import { NextResponse } from "next/server";

import { listGitHubRepositories, listGitProviders } from "@/lib/github-connection/server";
import { stackServerApp } from "@/stack/server";

export async function GET(request: Request) {
  const user = await stackServerApp.getUser({ tokenStore: request, or: "return-null" });

  if (!user || user.isAnonymous) {
    return NextResponse.json({ authenticated: false, providers: [], repositories: [] }, { status: 401 });
  }

  const [providers, repositories] = await Promise.all([
    listGitProviders(user.id),
    listGitHubRepositories(user.id),
  ]);

  return NextResponse.json({ authenticated: true, providers, repositories });
}

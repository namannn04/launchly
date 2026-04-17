import { NextResponse } from "next/server";

import { getGitHubConnectionStatus, syncStackUserIdentity } from "@/lib/github-connection/server";
import { stackServerApp } from "@/stack/server";

export async function GET(request: Request) {
  const user = await stackServerApp.getUser({ tokenStore: request, or: "return-null" });

  if (!user || user.isAnonymous) {
    return NextResponse.json({
      authenticated: false,
      githubConnected: false,
      githubUsername: null,
      githubAvatar: null,
    });
  }

  await syncStackUserIdentity({
    id: user.id,
    displayName: user.displayName,
    primaryEmail: user.primaryEmail,
    profileImageUrl: user.profileImageUrl,
  });

  const status = await getGitHubConnectionStatus(user.id);

  return NextResponse.json({
    authenticated: true,
    ...status,
  });
}

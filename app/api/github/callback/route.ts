import { NextResponse } from "next/server";

import { syncStackUserIdentity } from "@/lib/github-connection/server";
import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/stack/server";

type GitHubTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GitHubUserResponse = {
  id: number;
  login: string;
  avatar_url: string;
};

function requiredEnv(name: "GITHUB_CLIENT_ID" | "GITHUB_CLIENT_SECRET") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const authError = requestUrl.searchParams.get("error");

  if (authError) {
    return NextResponse.redirect(new URL("/?github=oauth-cancelled", request.url));
  }

  const user = await stackServerApp.getUser({ tokenStore: request, or: "return-null" });

  if (!user || user.isAnonymous) {
    return NextResponse.redirect(new URL("/handler/sign-in?after_auth_return_to=/", request.url));
  }

  await syncStackUserIdentity({
    id: user.id,
    displayName: user.displayName,
    primaryEmail: user.primaryEmail,
    profileImageUrl: user.profileImageUrl,
  });

  const stateCookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("launchly_github_oauth_state="))
    ?.split("=")[1];

  const decodedStateCookie = stateCookie ? decodeURIComponent(stateCookie) : "";
  const [storedState, storedUserId] = decodedStateCookie.split(":");

  if (!code || !state || state !== storedState || storedUserId !== user.id) {
    return NextResponse.redirect(new URL("/?github=invalid-state", request.url));
  }

  let githubClientId: string;
  let githubClientSecret: string;

  try {
    githubClientId = requiredEnv("GITHUB_CLIENT_ID");
    githubClientSecret = requiredEnv("GITHUB_CLIENT_SECRET");
  } catch {
    return NextResponse.redirect(new URL("/?github=missing-config", request.url));
  }

  const callbackUrl = new URL("/api/github/callback", request.url);

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: githubClientId,
      client_secret: githubClientSecret,
      code,
      redirect_uri: callbackUrl.toString(),
      state,
    }),
  });

  const tokenData = (await tokenResponse.json()) as GitHubTokenResponse;
  const accessToken = tokenData.access_token;

  if (!tokenResponse.ok || !accessToken) {
    return NextResponse.redirect(new URL("/?github=token-failed", request.url));
  }

  const profileResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!profileResponse.ok) {
    return NextResponse.redirect(new URL("/?github=profile-failed", request.url));
  }

  const profile = (await profileResponse.json()) as GitHubUserResponse;

  await prisma.userGithubConnection.upsert({
    where: { stackUserId: user.id },
    update: {
      githubConnected: true,
      githubAccountId: String(profile.id),
      githubUsername: profile.login,
      githubAvatar: profile.avatar_url,
      githubAccessToken: accessToken,
    },
    create: {
      stackUserId: user.id,
      githubConnected: true,
      githubAccountId: String(profile.id),
      githubUsername: profile.login,
      githubAvatar: profile.avatar_url,
      githubAccessToken: accessToken,
    },
  });

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.delete("launchly_github_oauth_state");
  response.cookies.set("launchly_github_connected", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}

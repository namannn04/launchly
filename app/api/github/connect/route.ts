import { NextResponse } from "next/server";

import { stackServerApp } from "@/stack/server";

function requiredEnv(name: "GITHUB_CLIENT_ID") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function GET(request: Request) {
  const user = await stackServerApp.getUser({ tokenStore: request, or: "return-null" });

  if (!user || user.isAnonymous) {
    const signInUrl = new URL("/handler/sign-in", request.url);
    signInUrl.searchParams.set("after_auth_return_to", "/");
    return NextResponse.redirect(signInUrl);
  }

  let githubClientId: string;

  try {
    githubClientId = requiredEnv("GITHUB_CLIENT_ID");
  } catch {
    return NextResponse.redirect(new URL("/?github=missing-config", request.url));
  }

  const state = crypto.randomUUID();
  const callbackUrl = new URL("/api/github/callback", request.url);

  const githubAuthorizeUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthorizeUrl.searchParams.set("client_id", githubClientId);
  githubAuthorizeUrl.searchParams.set("redirect_uri", callbackUrl.toString());
  githubAuthorizeUrl.searchParams.set("scope", "repo read:user user:email");
  githubAuthorizeUrl.searchParams.set("state", state);
  githubAuthorizeUrl.searchParams.set("allow_signup", "true");

  const response = NextResponse.redirect(githubAuthorizeUrl);
  response.cookies.set("launchly_github_oauth_state", `${state}:${user.id}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  return response;
}

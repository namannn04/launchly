import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { extractProjectIdFromHost } from "@/lib/deployment/url";

function rewriteSubdomainRequest(request: NextRequest) {
  const projectId = extractProjectIdFromHost(request.headers.get("host"));

  if (!projectId) {
    return null;
  }

  const pathname = request.nextUrl.pathname;
  const projectRoot = `/project/${projectId}`;

  if (pathname === projectRoot || pathname.startsWith(`${projectRoot}/`)) {
    return null;
  }

  const rewrittenUrl = request.nextUrl.clone();
  rewrittenUrl.pathname = pathname === "/" ? projectRoot : `${projectRoot}${pathname}`;

  return NextResponse.rewrite(rewrittenUrl);
}

export async function proxy(request: NextRequest) {
  const rewritten = rewriteSubdomainRequest(request);

  if (rewritten) {
    return rewritten;
  }

  if (!request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  try {
    const statusUrl = new URL("/api/github/status", request.url);
    const statusResponse = await fetch(statusUrl, {
      method: "GET",
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    if (!statusResponse.ok) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const data = (await statusResponse.json()) as {
      authenticated: boolean;
      githubConnected: boolean;
    };

    if (!data.authenticated || !data.githubConnected) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/:path*"],
};

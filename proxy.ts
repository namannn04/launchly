import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
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
  matcher: ["/dashboard/:path*"],
};

import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/security/audit";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { issueSensitiveActionToken } from "@/lib/security/reauth";
import { stackServerApp } from "@/stack/server";

export async function POST(request: Request) {
  const user = await stackServerApp.getUser({ tokenStore: request, or: "return-null" });

  if (!user || user.isAnonymous) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = await enforceRateLimit({
    key: `reauth:${user.id}`,
    limit: 10,
    windowSeconds: 60,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many re-auth attempts. Please retry shortly." },
      {
        status: 429,
        headers: {
          "retry-after": String(rate.retryAfterSeconds),
        },
      },
    );
  }

  const issued = await issueSensitiveActionToken(user.id);

  const response = NextResponse.json({
    success: true,
    expiresAt: issued.expiresAt.toISOString(),
  });

  response.cookies.set("launchly_sensitive_action", issued.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: issued.maxAgeSeconds,
    path: "/",
  });

  await writeAuditLog({
    stackUserId: user.id,
    action: "security.reauth.issued",
    resourceType: "sensitive-action-token",
  });

  return response;
}

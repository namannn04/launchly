import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/stack/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const user = await stackServerApp.getUser({ tokenStore: request, or: "return-null" });

  if (!user || user.isAnonymous) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const deployment = await prisma.deployment.findUnique({
    where: { projectId },
    select: {
      projectId: true,
      repoUrl: true,
      status: true,
      deploymentUrl: true,
      logs: true,
      error: true,
      updatedAt: true,
    },
  });

  if (!deployment) {
    return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
  }

  return NextResponse.json(deployment);
}

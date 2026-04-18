import { NextResponse } from "next/server";

import { addDeployJob } from "@/backend/queues/deployQueue";
import { listGitHubRepositories, syncStackUserIdentity } from "@/lib/github-connection/server";
import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/stack/server";

type DeployRequestBody = {
  repoUrl?: string;
  projectId?: string;
};

function sanitizeProjectId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
}

export async function POST(request: Request) {
  const user = await stackServerApp.getUser({ tokenStore: request, or: "return-null" });

  if (!user || user.isAnonymous) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as DeployRequestBody;

  if (!body.repoUrl || !body.projectId) {
    return NextResponse.json({ error: "repoUrl and projectId are required" }, { status: 400 });
  }

  const repoUrlInput = body.repoUrl;

  let repoUrl: URL;

  try {
    repoUrl = new URL(repoUrlInput);
  } catch {
    return NextResponse.json({ error: "Invalid repoUrl" }, { status: 400 });
  }

  if (repoUrl.protocol !== "https:" || repoUrl.hostname !== "github.com") {
    return NextResponse.json({ error: "Only HTTPS GitHub repositories are allowed" }, { status: 400 });
  }

  const allowedRepositories = await listGitHubRepositories(user.id);
  const trusted = allowedRepositories.some((repository) => {
    const candidates = [repository.htmlUrl, `${repository.htmlUrl}.git`];
    return candidates.includes(repoUrlInput);
  });

  if (!trusted) {
    return NextResponse.json({ error: "Repository is not trusted for this account" }, { status: 403 });
  }

  const projectId = sanitizeProjectId(body.projectId);

  if (!projectId) {
    return NextResponse.json({ error: "Invalid projectId" }, { status: 400 });
  }

  await syncStackUserIdentity({
    id: user.id,
    displayName: user.displayName,
    primaryEmail: user.primaryEmail,
    profileImageUrl: user.profileImageUrl,
  });

  await prisma.deployment.upsert({
    where: { projectId },
    update: {
      stackUserId: user.id,
      repoUrl: repoUrlInput,
      status: "queued",
      deploymentUrl: null,
      logs: "",
      error: null,
    },
    create: {
      projectId,
      stackUserId: user.id,
      repoUrl: repoUrlInput,
      status: "queued",
      logs: "",
    },
  });

  await addDeployJob({
    projectId,
    repoUrl: repoUrlInput,
    stackUserId: user.id,
  });

  return NextResponse.json({
    status: "queued",
    projectId,
  });
}

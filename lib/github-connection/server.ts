import "server-only";

import { prisma } from "@/lib/prisma";

export type GitHubConnectionStatus = {
  githubConnected: boolean;
  githubUsername: string | null;
  githubAvatar: string | null;
};

type StackUserIdentity = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl?: string | null;
};

export async function syncStackUserIdentity(user: StackUserIdentity) {
  await prisma.stackUser.upsert({
    where: { stackUserId: user.id },
    update: {
      displayName: user.displayName,
      primaryEmail: user.primaryEmail,
      profileImageUrl: user.profileImageUrl ?? null,
    },
    create: {
      stackUserId: user.id,
      displayName: user.displayName,
      primaryEmail: user.primaryEmail,
      profileImageUrl: user.profileImageUrl ?? null,
    },
  });
}

export async function getGitHubConnectionByStackUserId(stackUserId: string) {
  return prisma.userGithubConnection.findUnique({
    where: { stackUserId },
    select: {
      githubConnected: true,
      githubUsername: true,
      githubAvatar: true,
    },
  });
}

export async function getGitHubConnectionStatus(stackUserId: string): Promise<GitHubConnectionStatus> {
  const connection = await getGitHubConnectionByStackUserId(stackUserId);

  return {
    githubConnected: Boolean(connection?.githubConnected),
    githubUsername: connection?.githubUsername ?? null,
    githubAvatar: connection?.githubAvatar ?? null,
  };
}

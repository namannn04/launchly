import "server-only";

import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/security/encryption";

export type GitHubConnectionStatus = {
  githubConnected: boolean;
  githubUsername: string | null;
  githubAvatar: string | null;
};

export type GitHubRepository = {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  updatedAt: string;
  htmlUrl: string;
  defaultBranch: string;
  language: string | null;
  ownerLogin: string;
  ownerAvatar: string | null;
  ownerType: "User" | "Organization";
};

export type GitProvider = {
  login: string;
  avatarUrl: string | null;
  type: "User" | "Organization";
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
  const connection = await prisma.userGithubConnection.findUnique({
    where: { stackUserId },
    select: {
      githubConnected: true,
      githubUsername: true,
      githubAvatar: true,
      githubAccessToken: true,
      githubAccessTokenIv: true,
      githubAccessTokenTag: true,
      githubAccessTokenKeyVer: true,
    },
  });

  if (!connection?.githubAccessToken) {
    return connection;
  }

  if (!connection.githubAccessTokenIv || !connection.githubAccessTokenTag || !connection.githubAccessTokenKeyVer) {
    return connection;
  }

  return {
    ...connection,
    githubAccessToken: (() => {
      try {
        return decryptSecret(
          {
            value: connection.githubAccessToken,
            iv: connection.githubAccessTokenIv,
            tag: connection.githubAccessTokenTag,
            keyVersion: connection.githubAccessTokenKeyVer,
          },
          `github:${stackUserId}`,
        );
      } catch {
        return null;
      }
    })(),
  };
}

export async function getGitHubConnectionStatus(stackUserId: string): Promise<GitHubConnectionStatus> {
  const connection = await getGitHubConnectionByStackUserId(stackUserId);

  return {
    githubConnected: Boolean(connection?.githubConnected),
    githubUsername: connection?.githubUsername ?? null,
    githubAvatar: connection?.githubAvatar ?? null,
  };
}

export async function listGitHubRepositories(stackUserId: string): Promise<GitHubRepository[]> {
  const connection = await getGitHubConnectionByStackUserId(stackUserId);

  if (!connection?.githubConnected || !connection.githubAccessToken) {
    return [];
  }

  const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
    headers: {
      Authorization: `Bearer ${connection.githubAccessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const repos = (await response.json()) as Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    updated_at: string;
    html_url: string;
    default_branch: string;
    language: string | null;
    owner: {
      login: string;
      avatar_url: string;
      type: "User" | "Organization";
    };
  }>;

  return repos.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    private: repo.private,
    updatedAt: repo.updated_at,
    htmlUrl: repo.html_url,
    defaultBranch: repo.default_branch,
    language: repo.language,
    ownerLogin: repo.owner.login,
    ownerAvatar: repo.owner.avatar_url,
    ownerType: repo.owner.type,
  }));
}

export async function listGitProviders(stackUserId: string): Promise<GitProvider[]> {
  const connection = await getGitHubConnectionByStackUserId(stackUserId);

  if (!connection?.githubConnected || !connection.githubAccessToken) {
    return [];
  }

  const [viewerResponse, orgsResponse] = await Promise.all([
    fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${connection.githubAccessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    }),
    fetch("https://api.github.com/user/orgs?per_page=100", {
      headers: {
        Authorization: `Bearer ${connection.githubAccessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    }),
  ]);

  const providers: GitProvider[] = [];

  if (viewerResponse.ok) {
    const viewer = (await viewerResponse.json()) as {
      login: string;
      avatar_url: string;
    };

    providers.push({
      login: viewer.login,
      avatarUrl: viewer.avatar_url,
      type: "User",
    });
  } else if (connection.githubUsername) {
    providers.push({
      login: connection.githubUsername,
      avatarUrl: connection.githubAvatar,
      type: "User",
    });
  }

  if (orgsResponse.ok) {
    const orgs = (await orgsResponse.json()) as Array<{
      login: string;
      avatar_url: string;
    }>;

    for (const org of orgs) {
      providers.push({
        login: org.login,
        avatarUrl: org.avatar_url,
        type: "Organization",
      });
    }
  }

  return providers;
}

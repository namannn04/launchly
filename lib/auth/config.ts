const githubClientId = process.env.NEXT_PUBLIC_AUTH_GITHUB_ID ?? "";
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET ?? "";

export const authConfig = {
  githubClientId,
  githubClientSecret,
};

export const isGitHubOAuthConfigured = Boolean(authConfig.githubClientId);

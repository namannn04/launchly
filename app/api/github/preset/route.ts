import { NextResponse } from "next/server";

import { getGitHubConnectionByStackUserId, listGitHubRepositories } from "@/lib/github-connection/server";
import { stackServerApp } from "@/stack/server";

type GithubContentItem = {
  name: string;
  type: "file" | "dir";
  download_url: string | null;
};

type DetectedPreset = {
  id: "nextjs" | "react-vite" | "react-cra" | "react" | "static-html" | "node" | "unknown";
  label: string;
  confidence: "high" | "medium" | "low";
};

function detectPresetFromRepo(files: string[], packageJson: Record<string, unknown> | null): DetectedPreset {
  const fileSet = new Set(files.map((file) => file.toLowerCase()));

  if (!packageJson) {
    if (fileSet.has("index.html") || fileSet.has("home.html") || fileSet.has("landing.html")) {
      return {
        id: "static-html",
        label: "Static HTML",
        confidence: "high",
      };
    }

    return {
      id: "unknown",
      label: "Automatic",
      confidence: "low",
    };
  }

  const dependencies = {
    ...(typeof packageJson.dependencies === "object" && packageJson.dependencies !== null ? packageJson.dependencies as Record<string, string> : {}),
    ...(typeof packageJson.devDependencies === "object" && packageJson.devDependencies !== null ? packageJson.devDependencies as Record<string, string> : {}),
  };

  const scripts = typeof packageJson.scripts === "object" && packageJson.scripts !== null
    ? packageJson.scripts as Record<string, string>
    : {};

  const buildScript = scripts.build ?? "";

  if (dependencies.next || fileSet.has("next.config.js") || fileSet.has("next.config.ts") || buildScript.includes("next build")) {
    return {
      id: "nextjs",
      label: "Next.js",
      confidence: "high",
    };
  }

  if (dependencies.vite || fileSet.has("vite.config.ts") || fileSet.has("vite.config.js") || buildScript.includes("vite build")) {
    return {
      id: "react-vite",
      label: "React (Vite)",
      confidence: "high",
    };
  }

  if (dependencies["react-scripts"] || buildScript.includes("react-scripts build")) {
    return {
      id: "react-cra",
      label: "React (CRA)",
      confidence: "high",
    };
  }

  if (dependencies.react) {
    return {
      id: "react",
      label: "React",
      confidence: "medium",
    };
  }

  if (fileSet.has("server.js") || fileSet.has("app.js") || fileSet.has("index.js")) {
    return {
      id: "node",
      label: "Node.js",
      confidence: "medium",
    };
  }

  return {
    id: "unknown",
    label: "Automatic",
    confidence: "low",
  };
}

export async function GET(request: Request) {
  const user = await stackServerApp.getUser({ tokenStore: request, or: "return-null" });

  if (!user || user.isAnonymous) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const fullName = url.searchParams.get("fullName")?.trim();
  const repoUrl = url.searchParams.get("repoUrl")?.trim();

  if (!fullName || !repoUrl) {
    return NextResponse.json({ error: "fullName and repoUrl are required" }, { status: 400 });
  }

  const allowedRepositories = await listGitHubRepositories(user.id);
  const trusted = allowedRepositories.some((repository) => {
    const candidates = [repository.htmlUrl, `${repository.htmlUrl}.git`];
    return repository.fullName.toLowerCase() === fullName.toLowerCase() && candidates.includes(repoUrl);
  });

  if (!trusted) {
    return NextResponse.json({ error: "Repository is not trusted for this account" }, { status: 403 });
  }

  const connection = await getGitHubConnectionByStackUserId(user.id);

  if (!connection?.githubAccessToken) {
    return NextResponse.json({ error: "GitHub access token not available" }, { status: 400 });
  }

  const contentsResponse = await fetch(`https://api.github.com/repos/${fullName}/contents`, {
    headers: {
      Authorization: `Bearer ${connection.githubAccessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (!contentsResponse.ok) {
    return NextResponse.json({
      preset: {
        id: "unknown",
        label: "Automatic",
        confidence: "low",
      },
    });
  }

  const contentItems = (await contentsResponse.json()) as GithubContentItem[];
  const files = contentItems.filter((item) => item.type === "file").map((item) => item.name);

  const packageJsonItem = contentItems.find((item) => item.type === "file" && item.name === "package.json");
  let packageJson: Record<string, unknown> | null = null;

  if (packageJsonItem?.download_url) {
    try {
      const packageResponse = await fetch(packageJsonItem.download_url, {
        headers: {
          Authorization: `Bearer ${connection.githubAccessToken}`,
          Accept: "application/vnd.github.raw",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      });

      if (packageResponse.ok) {
        packageJson = await packageResponse.json() as Record<string, unknown>;
      }
    } catch {
      packageJson = null;
    }
  }

  const preset = detectPresetFromRepo(files, packageJson);

  return NextResponse.json({ preset });
}
"use client";

import { motion } from "framer-motion";
import { ArrowLeft, FolderGit2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import ThemeToggle from "@/components/landingPage/components/ThemeToggle";
import { Button } from "@/components/ui/button";

import GitProviderSelect, { type GitProvider } from "./GitProviderSelect";
import RepoList from "./RepoList";
import SearchBar from "./SearchBar";
import { type Repo } from "./RepoCard";

type ImportProjectPageProps = {
  githubUsername: string | null;
  githubAvatar: string | null;
};

function formatRelativeUpdate(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));

  if (hours < 1) {
    return "just now";
  }

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function ImportProjectPage({ githubUsername, githubAvatar }: ImportProjectPageProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [providers, setProviders] = useState<GitProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRepositories() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/github/repositories", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch repositories");
        }

        const payload = (await response.json()) as {
          providers: Array<{
            login: string;
            avatarUrl: string | null;
            type: "User" | "Organization";
          }>;
          repositories: Array<{
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
          }>;
        };

        setProviders(payload.providers);
        setSelectedProvider((current) => current ?? payload.providers[0]?.login ?? null);

        const nextRepos = payload.repositories.map((repo) => ({
          ...repo,
          updatedAt: formatRelativeUpdate(repo.updatedAt),
        }));

        setRepos(nextRepos);
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        setError("We could not load repositories right now. Please retry in a moment.");
        setProviders([]);
        setSelectedProvider(null);
        setRepos([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadRepositories();

    return () => {
      controller.abort();
    };
  }, []);

  const filteredRepos = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    const providerFiltered = selectedProvider
      ? repos.filter((repo) => repo.ownerLogin.toLowerCase() === selectedProvider.toLowerCase())
      : repos;

    if (!normalized) {
      return providerFiltered;
    }

    return providerFiltered.filter(
      (repo) => repo.name.toLowerCase().includes(normalized) || repo.fullName.toLowerCase().includes(normalized),
    );
  }, [repos, searchQuery, selectedProvider]);

  function handleImport(repo: Repo) {
    const params = new URLSearchParams({
      repoUrl: repo.htmlUrl,
      fullName: repo.fullName,
      repoName: repo.name,
      defaultBranch: repo.defaultBranch,
      owner: repo.ownerLogin,
    });

    router.push(`/dashboard/new?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-border/60 bg-card/55 px-4 py-6 backdrop-blur lg:border-b-0 lg:border-r lg:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground">L</span>
            Launchly
          </Link>

          <nav className="mt-8 space-y-2">
            <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <span className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/80 px-3 py-2.5 text-sm font-semibold">
              <FolderGit2 className="h-4 w-4" />
              Import Project
            </span>
          </nav>
        </aside>

        <section className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 px-4 py-4 backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Import</p>
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Import Git Repository</h1>
                <p className="mt-1 text-sm text-muted-foreground">Select a repository to deploy.</p>
              </div>

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-2 py-1">
                  {githubAvatar ? (
                    <Image
                      src={githubAvatar}
                      alt={githubUsername ?? "GitHub avatar"}
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded-full"
                    />
                  ) : (
                    <span className="h-7 w-7 rounded-full bg-muted" />
                  )}
                  <span className="pr-2 text-xs text-muted-foreground sm:text-sm">{githubUsername ?? "GitHub connected"}</span>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-8 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <div className="grid gap-3 md:grid-cols-[minmax(260px,320px)_1fr]">
                <GitProviderSelect
                  providers={providers}
                  selectedProvider={selectedProvider}
                  onChange={setSelectedProvider}
                />
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-500/25 bg-red-500/8 p-4 text-sm text-red-600 dark:text-red-300">
                  {error}
                </div>
              ) : null}

              <RepoList
                repos={filteredRepos}
                isLoading={isLoading}
                onImport={handleImport}
                deploymentStateByRepo={{}}
              />

              <div className="pt-2">
                <Button asChild variant="ghost">
                  <Link href="/dashboard">Cancel</Link>
                </Button>
              </div>
            </motion.div>
          </main>
        </section>
      </div>
    </div>
  );
}

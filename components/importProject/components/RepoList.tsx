"use client";

import { motion } from "framer-motion";

import RepoCard, { type Repo } from "./RepoCard";

type RepoListProps = {
  repos: Repo[];
  isLoading: boolean;
  onImport: (repo: Repo) => void;
};

function RepoSkeleton() {
  return (
    <div className="rounded-xl border border-border/70 bg-card/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-3 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-8 w-20 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export default function RepoList({ repos, isLoading, onImport }: RepoListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <RepoSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-border/70 bg-card/80 p-10 text-center"
      >
        <p className="text-lg font-medium">No repositories found</p>
        <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search query.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-2"
    >
      {repos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} onImport={onImport} />
      ))}
    </motion.div>
  );
}

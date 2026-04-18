"use client";

import { motion } from "framer-motion";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Repo = {
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

type RepoCardProps = {
  repo: Repo;
  onImport: (repo: Repo) => void;
};

export default function RepoCard({ repo, onImport }: RepoCardProps) {
  const githubIcon = (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M12 2a10 10 0 0 0-3.162 19.488c.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.699-2.776.603-3.362-1.338-3.362-1.338-.454-1.155-1.109-1.463-1.109-1.463-.908-.62.069-.608.069-.608 1.004.071 1.532 1.031 1.532 1.031.893 1.53 2.343 1.088 2.914.832.091-.647.35-1.088.636-1.338-2.217-.252-4.55-1.109-4.55-4.938 0-1.091.39-1.983 1.03-2.682-.103-.253-.447-1.269.098-2.645 0 0 .84-.269 2.75 1.025A9.59 9.59 0 0 1 12 6.844c.852.004 1.711.115 2.513.337 1.909-1.294 2.748-1.025 2.748-1.025.546 1.376.202 2.392.1 2.645.64.699 1.028 1.59 1.028 2.682 0 3.838-2.337 4.683-4.561 4.93.359.309.679.92.679 1.855 0 1.338-.012 2.419-.012 2.749 0 .268.18.58.688.481A10 10 0 0 0 12 2Z" />
    </svg>
  );

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
      <Card className="rounded-xl border-border/70 bg-card/85 px-4 py-3 shadow-none">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {repo.ownerAvatar ? (
                <Image src={repo.ownerAvatar} alt={repo.ownerLogin} width={20} height={20} className="h-5 w-5 rounded-full" />
              ) : (
                <span className="h-5 w-5 rounded-full bg-muted" />
              )}
              <p className="truncate font-medium">{repo.name}</p>
              <span
                className={repo.private
                  ? "rounded-full border border-border/70 px-2 py-0.5 text-[11px] text-muted-foreground"
                  : "rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] text-primary"}
              >
                {repo.private ? "Private" : "Public"}
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {githubIcon}
              <span className="ml-1">{repo.fullName}</span>
              <span className="mx-1">•</span>
              <span>{repo.updatedAt}</span>
              <span className="mx-1">•</span>
              <span>{repo.defaultBranch}</span>
              {repo.language ? (
                <>
                  <span className="mx-1">•</span>
                  <span>{repo.language}</span>
                </>
              ) : null}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <a href={repo.htmlUrl} target="_blank" rel="noreferrer">
                View
              </a>
            </Button>
            <Button size="sm" onClick={() => onImport(repo)}>
              Import
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export type { Repo };

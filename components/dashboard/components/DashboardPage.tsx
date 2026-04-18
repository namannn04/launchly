"use client";

import { motion } from "framer-motion";
import { FolderGit2, LayoutGrid, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/landingPage/components/ThemeToggle";

import DashboardEmptyState from "./DashboardEmptyState";
import ProjectCard, { type DashboardProject } from "./ProjectCard";

type DashboardPageProps = {
  githubUsername: string | null;
  githubAvatar: string | null;
  projects: DashboardProject[];
};

const sidebarItems = [
  { label: "Projects", icon: LayoutGrid, active: true },
  { label: "Imports", icon: FolderGit2, active: false },
] as const;

export default function DashboardPage({ githubUsername, githubAvatar, projects }: DashboardPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-border/60 bg-card/55 px-4 py-6 backdrop-blur lg:border-b-0 lg:border-r lg:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground">L</span>
            Launchly
          </Link>

          <nav className="mt-8 space-y-2">
            {sidebarItems.map(({ label, icon: Icon, active }) => (
              <span
                key={label}
                className={active
                  ? "flex items-center gap-3 rounded-xl border border-border/70 bg-background/80 px-3 py-2.5 text-sm font-semibold"
                  : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground"}
              >
                <Icon className="h-4 w-4" />
                {label}
              </span>
            ))}
          </nav>

          <div className="mt-8 lg:mt-auto">
            <Button asChild className="w-full" variant="outline">
              <Link href="/dashboard/import">
                <Plus className="h-4 w-4" />
                Add New Project
              </Link>
            </Button>
          </div>
        </aside>

        <section className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 px-4 py-4 backdrop-blur sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Dashboard</p>
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Launchly Projects</h1>
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
            {projects.length === 0 ? (
              <DashboardEmptyState githubUsername={githubUsername} />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
              >
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </motion.div>
            )}
          </main>
        </section>
      </div>
    </div>
  );
}

export type { DashboardProject };

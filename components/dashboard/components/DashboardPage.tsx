"use client";

import { motion } from "framer-motion";
import { FolderGit2, LayoutGrid, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/landingPage/components/ThemeToggle";

import DashboardEmptyState from "./DashboardEmptyState";
import DeleteProjectDialog from "./DeleteProjectDialog";
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
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<DashboardProject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDeleteConfirm() {
    if (!activeProject) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/deploy/${activeProject.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setDeleteDialogOpen(false);
      setActiveProject(null);
      router.refresh();
    } catch {
      window.alert("Could not delete project right now.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="flex flex-col border-b border-border/60 bg-card/55 px-4 py-6 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-6">
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

        <section className="flex h-screen min-h-0 flex-col">
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

          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6">
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
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isDeleting={isDeleting && activeProject?.id === project.id}
                    onDeleteRequest={(targetProject) => {
                      setActiveProject(targetProject);
                      setDeleteDialogOpen(true);
                    }}
                  />
                ))}
              </motion.div>
            )}
          </main>
        </section>

        <DeleteProjectDialog
          isOpen={deleteDialogOpen && Boolean(activeProject)}
          projectName={activeProject?.name ?? ""}
          isDeleting={isDeleting}
          onCancel={() => {
            setDeleteDialogOpen(false);
            setActiveProject(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </div>
  );
}

export type { DashboardProject };

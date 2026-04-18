"use client";

import { motion } from "framer-motion";
import { Activity, CheckCircle2, Clock3, ExternalLink, Link as LinkIcon, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProjectStatus = "Ready" | "Building" | "Failed";

export type DashboardProject = {
  id: string;
  name: string;
  repoUrl: string;
  deploymentUrl: string | null;
  error: string | null;
  status: ProjectStatus;
  lastDeployedAt: string;
};

type ProjectCardProps = {
  project: DashboardProject;
  onDeleteRequest: (project: DashboardProject) => void;
  isDeleting?: boolean;
};

function statusIcon(status: ProjectStatus) {
  if (status === "Ready") {
    return <CheckCircle2 className="h-4 w-4 text-primary" />;
  }

  if (status === "Building") {
    return <Activity className="h-4 w-4 text-amber-500" />;
  }

  return <Clock3 className="h-4 w-4 text-red-500" />;
}

function badgeVariant(status: ProjectStatus): "default" | "secondary" | "outline" {
  if (status === "Ready") {
    return "default";
  }

  if (status === "Building") {
    return "secondary";
  }

  return "outline";
}

export default function ProjectCard({ project, onDeleteRequest, isDeleting = false }: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <Card className="h-full border-border/70 bg-card/85 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
        <CardHeader className="space-y-4 pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={badgeVariant(project.status)} className="inline-flex items-center gap-1.5">
                {statusIcon(project.status)}
                {project.status}
              </Badge>

              <div className="relative">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Project actions"
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>

                {menuOpen ? (
                  <div className="absolute right-0 top-11 z-20 min-w-44 rounded-xl border border-border/80 bg-background p-1 shadow-xl">
                    <Button asChild variant="ghost" className="w-full justify-start" size="sm" onClick={() => setMenuOpen(false)}>
                      <Link href={`/dashboard/project/${project.id}`}>View Dashboard</Link>
                    </Button>

                    <Button
                      asChild
                      variant="ghost"
                      className="w-full justify-start"
                      size="sm"
                      onClick={() => setMenuOpen(false)}
                      disabled={!project.deploymentUrl}
                    >
                      <a href={project.deploymentUrl ?? "#"} target="_blank" rel="noreferrer">
                        Visit
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-red-500 hover:text-red-500"
                      onClick={() => {
                        setMenuOpen(false);
                        onDeleteRequest(project);
                      }}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeleting ? "Deleting" : "Delete"}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="inline-flex max-w-full items-center gap-1 rounded-full border border-border/70 bg-background/70 px-2 py-1 text-xs text-muted-foreground">
            <LinkIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{project.deploymentUrl ?? `http://localhost:3000/project/${project.id}/`}</span>
          </div>

          {project.error ? <p className="text-xs text-red-500">{project.error}</p> : null}

          <p className="text-sm text-muted-foreground">Last deployed {project.lastDeployedAt}</p>

          <p className="text-xs text-muted-foreground">Use the three-dot menu for actions.</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

"use client";

import { ExternalLink, FileText, GitBranch, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import DeleteProjectDialog from "./DeleteProjectDialog";

type ProjectDashboardActionsProps = {
  projectId: string;
  projectName: string;
  repoUrl: string;
  deploymentUrl: string;
};

export default function ProjectDashboardActions({ projectId, projectName, repoUrl, deploymentUrl }: ProjectDashboardActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/deploy/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setDeleteDialogOpen(false);
      router.push("/dashboard");
      router.refresh();
    } catch {
      window.alert("Could not delete project right now.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <a href={repoUrl} target="_blank" rel="noreferrer">
          <GitBranch className="h-4 w-4" />
          Repository
        </a>
      </Button>

      <Button asChild variant="outline" size="sm">
        <a href="#build-logs">
          <FileText className="h-4 w-4" />
          Logs
        </a>
      </Button>

      <Button asChild size="sm">
        <a href={deploymentUrl} target="_blank" rel="noreferrer">
          Visit
          <ExternalLink className="h-4 w-4" />
        </a>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="text-red-500 hover:text-red-500"
        onClick={() => setDeleteDialogOpen(true)}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>

      <DeleteProjectDialog
        isOpen={deleteDialogOpen}
        projectName={projectName}
        isDeleting={isDeleting}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

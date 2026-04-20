"use client";

import { ExternalLink, FileText, GitBranch, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import DeleteProjectDialog from "./DeleteProjectDialog";

type ProjectDashboardActionsProps = {
  projectId: string;
  projectName: string;
  repoUrl: string;
  deploymentUrl: string;
  runtime: "static" | "nextjs" | "node" | "unknown";
  environment: "development" | "preview" | "production";
};

export default function ProjectDashboardActions({
  projectId,
  projectName,
  repoUrl,
  deploymentUrl,
  runtime,
  environment,
}: ProjectDashboardActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
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

  async function handleRestartRuntime() {
    setIsRestarting(true);

    try {
      const response = await fetch(`/api/deploy/${projectId}/runtime`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          action: "restart",
          environment,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({ error: "Restart failed" }))) as { error?: string };
        throw new Error(payload.error ?? "Restart failed");
      }

      router.refresh();
    } catch {
      window.alert("Could not restart runtime right now.");
    } finally {
      setIsRestarting(false);
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

      {(runtime === "nextjs" || runtime === "node") ? (
        <Button type="button" variant="outline" size="sm" onClick={() => void handleRestartRuntime()} disabled={isRestarting}>
          {isRestarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          Restart Runtime
        </Button>
      ) : null}

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

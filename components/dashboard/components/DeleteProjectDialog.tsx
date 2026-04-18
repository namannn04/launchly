"use client";

import { AlertOctagon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

type DeleteProjectDialogProps = {
  isOpen: boolean;
  projectName: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

export default function DeleteProjectDialog({
  isOpen,
  projectName,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteProjectDialogProps) {
  const [projectInput, setProjectInput] = useState("");
  const [deletePhraseInput, setDeletePhraseInput] = useState("");

  const canDelete = useMemo(() => {
    return projectInput.trim() === projectName && deletePhraseInput.trim() === "delete my project";
  }, [deletePhraseInput, projectInput, projectName]);

  async function handleConfirm() {
    if (!canDelete || isDeleting) {
      return;
    }

    await onConfirm();
    setProjectInput("");
    setDeletePhraseInput("");
  }

  const handleCancel = useCallback(() => {
    setProjectInput("");
    setDeletePhraseInput("");
    onCancel();
  }, [onCancel]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        handleCancel();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [handleCancel, isDeleting, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) {
          handleCancel();
        }
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border/80 bg-background shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
        <div className="border-b border-border/70 px-6 py-5">
          <h2 className="text-2xl font-semibold tracking-tight">Delete Project</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            This will permanently delete the project and related resources like Deployments, Domains and Environment Variables.
          </p>
        </div>

        <div className="space-y-6 border-b border-border/70 bg-card/30 px-6 py-6">
          <div>
            <p className="mb-2 text-sm text-muted-foreground">
              To confirm, type <span className="font-semibold text-foreground">&ldquo;{projectName}&rdquo;</span>
            </p>
            <input
              value={projectInput}
              onChange={(event) => setProjectInput(event.target.value)}
              className="h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none ring-0 transition focus:border-primary"
            />
          </div>

          <div>
            <p className="mb-2 text-sm text-muted-foreground">
              To confirm, type <span className="font-semibold text-foreground">&ldquo;delete my project&rdquo;</span>
            </p>
            <input
              value={deletePhraseInput}
              onChange={(event) => setDeletePhraseInput(event.target.value)}
              className="h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none ring-0 transition focus:border-primary"
            />
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="inline-flex items-center gap-2 rounded-xl border border-red-500/35 bg-red-500/12 px-4 py-3 text-sm text-red-400">
            <AlertOctagon className="h-4 w-4" />
            <span>Deleting {projectName} cannot be undone.</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border/70 px-6 py-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>

          <Button onClick={() => void handleConfirm()} disabled={!canDelete || isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Project"}
          </Button>
        </div>
      </div>
    </div>
  );
}

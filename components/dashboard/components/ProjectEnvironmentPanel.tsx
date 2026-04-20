"use client";

import { Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type ProjectEnvironmentPanelProps = {
  projectId: string;
  environment: "development" | "preview" | "production";
};

type EnvKeyResponse = {
  keys: string[];
};

type RevealResponse = {
  key: string;
  value: string;
};

export default function ProjectEnvironmentPanel({ projectId, environment }: ProjectEnvironmentPanelProps) {
  const [keys, setKeys] = useState<string[]>([]);
  const [revealedValues, setRevealedValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [revealingKey, setRevealingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadKeys = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      setError(null);
      const params = new URLSearchParams({
        projectId,
        environment,
      });

      const response = await fetch(`/api/deploy/env?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not load environment keys");
      }

      const payload = (await response.json()) as EnvKeyResponse;
      setKeys(payload.keys ?? []);
      setRevealedValues((current) => {
        const next: Record<string, string> = {};

        for (const key of payload.keys ?? []) {
          if (current[key]) {
            next[key] = current[key];
          }
        }

        return next;
      });
    } catch {
      setError("Could not load environment keys right now.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [environment, projectId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadKeys();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadKeys]);

  async function revealValue(key: string) {
    setRevealingKey(key);
    setError(null);

    try {
      const reauthResponse = await fetch("/api/security/reauth", {
        method: "POST",
      });

      if (!reauthResponse.ok) {
        throw new Error("Re-auth failed");
      }

      const revealResponse = await fetch("/api/deploy/env/reveal", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          environment,
          key,
        }),
      });

      if (!revealResponse.ok) {
        const payload = (await revealResponse.json().catch(() => ({ error: "Reveal failed" }))) as { error?: string };
        throw new Error(payload.error ?? "Reveal failed");
      }

      const payload = (await revealResponse.json()) as RevealResponse;

      setRevealedValues((current) => ({
        ...current,
        [key]: payload.value,
      }));
    } catch (revealError) {
      setError(revealError instanceof Error ? revealError.message : "Reveal failed");
    } finally {
      setRevealingKey(null);
    }
  }

  function hideValue(key: string) {
    setRevealedValues((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Environment Variables</p>
          <p className="text-xs text-muted-foreground">Scope: {environment}. Values are revealed once with re-auth.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void loadKeys(true)} disabled={isRefreshing || isLoading}>
          {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border/70 bg-background/50 p-3 text-xs text-muted-foreground">Loading environment keys...</div>
      ) : keys.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 bg-background/40 p-3 text-xs text-muted-foreground">No environment keys saved for this scope.</div>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => {
            const revealedValue = revealedValues[key];
            const isRevealing = revealingKey === key;

            return (
              <div key={key} className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/50 p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold tracking-wide">{key}</p>
                  <p className="truncate text-xs text-muted-foreground">{revealedValue ? revealedValue : "••••••••••••"}</p>
                </div>
                {revealedValue ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => hideValue(key)}>
                    <EyeOff className="h-4 w-4" />
                    Hide
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={() => void revealValue(key)} disabled={isRevealing}>
                    {isRevealing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                    Reveal
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
